from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q
from .models import Course, Student, Attendance
from .serializers import (
    CourseSerializer, StudentSerializer, 
    AttendanceSerializer, FaceRecognitionSerializer
)
import numpy as np
from PIL import Image
import io
import cv2
import logging
from django.views.decorators.csrf import csrf_exempt

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize OpenCV face detector
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def preprocess_image(image):
    """Preprocess image for face detection"""
    if isinstance(image, str):
        image = cv2.imread(image)
    elif hasattr(image, 'read'):
        image = cv2.imdecode(np.frombuffer(image.read(), np.uint8), cv2.IMREAD_COLOR)
    
    # Convert BGR to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return image_rgb, gray

def extract_face_encoding(image, min_face_size=(30, 30)):
    """Extract face encoding with improved face detection"""
    try:
        image_rgb, gray = preprocess_image(image)
        
        # Detect faces with improved parameters
        faces = face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=min_face_size,
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        
        if len(faces) == 0:
            logger.warning("No faces detected in image")
            return None, None, None
        
        # Get the largest face (assuming it's the main subject)
        face_sizes = [w * h for (x, y, w, h) in faces]
        largest_face_idx = np.argmax(face_sizes)
        x, y, w, h = faces[largest_face_idx]
        
        # Extract face region with padding
        padding = int(0.1 * w)  # 10% padding
        x1 = max(0, x - padding)
        y1 = max(0, y - padding)
        x2 = min(image_rgb.shape[1], x + w + padding)
        y2 = min(image_rgb.shape[0], y + h + padding)
        
        face_region = image_rgb[y1:y2, x1:x2]
        
        # Resize to a standard size
        face_region = cv2.resize(face_region, (128, 128))
        
        # Convert to grayscale
        face_gray = cv2.cvtColor(face_region, cv2.COLOR_RGB2GRAY)
        
        # Apply histogram equalization for better contrast
        face_gray = cv2.equalizeHist(face_gray)
        
        # Apply Gaussian blur to reduce noise
        face_gray = cv2.GaussianBlur(face_gray, (5, 5), 0)
        
        # Normalize
        face_normalized = face_gray / 255.0
        
        # Calculate confidence based on face size and position
        confidence = min(1.0, (w * h) / (image_rgb.shape[0] * image_rgb.shape[1]) * 10)
        
        # Create face encoding using HOG features
        face_encoding = face_normalized.flatten()
        
        logger.info(f"Detected {len(faces)} faces.")
        # Log a snippet of the face encoding
        if face_encoding is not None:
            logger.info(f"Extracted face encoding snippet: {face_encoding[:10]}...")
        
        return face_encoding, confidence, (x, y, w, h)
        
    except Exception as e:
        logger.error(f"Error in face encoding: {str(e)}")
        return None, None, None

def compare_faces(face1, face2, threshold=0.7):
    """Compare faces with improved similarity calculation"""
    try:
        # Log snippets of the input face encodings
        logger.info(f"Comparing face encodings - Face1 snippet: {face1[:10]}..., Face2 snippet: {face2[:10]}...")

        # Normalize the face encodings
        face1_norm = face1 / np.linalg.norm(face1)
        face2_norm = face2 / np.linalg.norm(face2)

        # Log normalized vector snippets
        logger.info(f"Normalized Face1 snippet: {face1_norm[:10]}..., Normalized Face2 snippet: {face2_norm[:10]}...")
        
        # Calculate cosine similarity
        similarity = np.dot(face1_norm, face2_norm)

        # Log similarity
        logger.info(f"Cosine similarity: {similarity}")
        
        # Calculate Euclidean distance
        distance = np.linalg.norm(face1 - face2)

        # Log distance
        logger.info(f"Euclidean distance: {distance}")
        
        # Use only cosine similarity for match
        return similarity > threshold, similarity
        
    except Exception as e:
        logger.error(f"Error in face comparison: {str(e)}", exc_info=True)
        return False, 0.0

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        """
        Allow unauthenticated access for listing courses
        """
        if self.action == 'list':
            return [] # Allow any permissions for the list action
        return [permission() for permission in self.permission_classes]

    @action(detail=False, methods=['post'], authentication_classes=[], permission_classes=[])
    def check_face(self, request):
        """Endpoint for real-time face detection"""
        serializer = FaceRecognitionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )

        image = serializer.validated_data['image']
        try:
            # Extract face encoding
            face_encoding, confidence, face_position = extract_face_encoding(image)
            
            if face_encoding is None:
                return Response({
                    'face_detected': False,
                    'message': 'No face detected'
                })
            
            if face_position:
                x, y, w, h = face_position
                return Response({
                    'face_detected': True,
                    'confidence': confidence,
                    'face_position': {
                        'x': x,
                        'y': y,
                        'width': w,
                        'height': h
                    }
                })
            
            return Response({
                'face_detected': False,
                'message': 'No face detected'
            })
            
        except Exception as e:
            logger.error(f"Error in face detection: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.AllowAny]

    @csrf_exempt
    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"Attempting to create new student with data: {request.data}")
            serializer = self.get_serializer(data=request.data)
            
            if not serializer.is_valid():
                logger.error(f"Student registration validation errors: {serializer.errors}")
                return Response(
                    {'error': 'Validation failed', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            logger.info(f"Successfully created new student: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
        except Exception as e:
            logger.error(f"Unexpected error while creating student: {str(e)}")
            return Response(
                {'error': 'Failed to create student', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def get_queryset(self):
        queryset = Student.objects.all()
        course = self.request.query_params.get('course', None)
        if course:
            queryset = queryset.filter(course_id=course)
        return queryset

    @action(detail=False, methods=['post'])
    def upload_photo(self, request):
        logger.info("upload_photo endpoint called.")
        student_id = request.data.get('student_id')
        try:
            student = Student.objects.get(student_id=student_id)
            logger.info(f"Student {student_id} found for photo upload.")
        except Student.DoesNotExist:
            logger.error(f"Student {student_id} not found for photo upload.")
            return Response(
                {'error': 'Student not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        if 'photo' not in request.FILES:
            logger.error("No photo provided in upload_photo request.")
            return Response(
                {'error': 'No photo provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        photo = request.FILES['photo']
        student.photo = photo
        
        # Process face encoding
        try:
            logger.info("Attempting to extract face encoding in upload_photo.")
            face_encoding, confidence, _ = extract_face_encoding(photo)
            
            if face_encoding is None:
                logger.warning("No face detected in photo during upload.")
                return Response(
                    {'error': 'No face detected in the image'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Face encoding extracted successfully with confidence: {confidence}")
            logger.info(f"Extracted face encoding snippet during upload: {face_encoding[:10]}...")

            if confidence < 0.3:  # Minimum confidence threshold
                logger.warning(f"Face detection confidence {confidence} too low during upload.")
                return Response(
                    {'error': 'Face detection confidence too low'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            student.face_encoding = face_encoding.tobytes()
            logger.info("Face encoding assigned to student object.")
            student.save()
            logger.info(f"Student {student_id} saved with face encoding.")

            # Log before returning success response
            logger.info("upload_photo function returning success response.")

            return Response(
                {
                    'message': 'Photo uploaded and face encoded successfully',
                    'confidence': confidence
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"Error in photo upload processing: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.AllowAny]

    def get_permissions(self):
        """
        Override get_permissions to allow unauthenticated access to check_face
        """
        if self.action == 'check_face':
            return []
        return [permission() for permission in self.permission_classes]

    def get_queryset(self):
        queryset = Attendance.objects.all()
        student = self.request.query_params.get('student', None)
        date = self.request.query_params.get('date', None)
        course = self.request.query_params.get('course', None)

        if student:
            queryset = queryset.filter(student_id=student)
        if date:
            queryset = queryset.filter(date=date)
        if course:
            queryset = queryset.filter(student__course_id=course)

        return queryset

    @action(detail=False, methods=['post'], authentication_classes=[], permission_classes=[])
    def check_face(self, request):
        """Endpoint for real-time face detection"""
        serializer = FaceRecognitionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors, 
                status=status.HTTP_400_BAD_REQUEST
            )

        image = serializer.validated_data['image']
        try:
            # Extract face encoding
            face_encoding, confidence, face_position = extract_face_encoding(image)
            
            if face_encoding is None:
                return Response({
                    'face_detected': False,
                    'message': 'No face detected'
                })
            
            if face_position:
                x, y, w, h = face_position
                return Response({
                    'face_detected': True,
                    'confidence': confidence,
                    'face_position': {
                        'x': x,
                        'y': y,
                        'width': w,
                        'height': h
                    }
                })
            
            return Response({
                'face_detected': False,
                'message': 'No face detected'
            })
            
        except Exception as e:
            logger.error(f"Error in face detection: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def mark_attendance(self, request):
        try:
            # Check if image is in request.FILES
            if 'image' not in request.FILES:
                logger.error("No image file in request.FILES")
                return Response(
                    {'error': 'No image file was submitted. Please send the image in the request.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate request data
            serializer = FaceRecognitionSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Invalid request data: {serializer.errors}")
                # Explicitly log serializer errors before returning response
                for field, errors in serializer.errors.items():
                    logger.error(f"Serializer Error for field '{field}': {errors}")
                return Response(
                    {'error': 'Invalid request data', 'details': serializer.errors}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            image = request.FILES['image']
            student_id = serializer.validated_data.get('student_id')

            # Extract face encoding
            face_encoding, confidence, _ = extract_face_encoding(image)
            
            if face_encoding is None:
                logger.warning("No face detected in the image")
                return Response(
                    {'error': 'No face detected in the image. Please ensure the image contains a clear face.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Define the threshold here for logging
            match_threshold = 0.7 # Using a higher threshold to reduce false positives
            logger.info(f"Using matching threshold: {match_threshold}")

            # If student_id is provided, verify against that student
            if student_id:
                try:
                    student = Student.objects.get(student_id=student_id)
                    if not student.face_encoding:
                        logger.warning(f"Student {student_id} has no face encoding")
                        return Response(
                            {'error': 'Student face not registered. Please register the student\'s face first.'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    stored_encoding = np.frombuffer(student.face_encoding)
                    
                    # Log type and shape of stored encoding
                    logger.info(f"Stored encoding type for student {student.student_id}: {type(stored_encoding)}")
                    logger.info(f"Stored encoding shape for student {student.student_id}: {stored_encoding.shape if stored_encoding is not None else 'None'}")

                    # Log snippets of the encodings before comparison
                    logger.info(f"Mark Attendance - Comparing stored encoding snippet ({student.student_id}): {stored_encoding[:10]}... with new encoding snippet: {face_encoding[:10]}...")

                    match, similarity = compare_faces(stored_encoding, face_encoding, threshold=match_threshold)
                    
                    logger.info(f"Comparison for student {student_id}: Match={match}, Similarity={similarity}")

                    if not match:
                        logger.warning(f"Face does not match for student {student_id}")
                        return Response(
                            {'error': 'Face does not match registered student. Please try again with a clearer image.'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Mark attendance
                    attendance, created = Attendance.objects.get_or_create(
                        student=student,
                        date=timezone.now().date(),
                        defaults={
                            'status': 'present',
                            'confidence_score': similarity
                        }
                    )
                    
                    if not created:
                        logger.info(f"Attendance already marked for student {student_id}")
                        return Response(
                            {'error': 'Attendance already marked for today'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    logger.info(f"Successfully marked attendance for student {student_id}")
                    return Response(
                        AttendanceSerializer(attendance).data,
                        status=status.HTTP_201_CREATED
                    )
                    
                except Student.DoesNotExist:
                    logger.warning(f"Student {student_id} not found")
                    return Response(
                        {'error': 'Student not found. Please check the student ID.'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
            
            # If no student_id provided, try to match against all students
            students = Student.objects.exclude(face_encoding__isnull=True)
            if not students.exists():
                logger.warning("No students registered with face data")
                return Response(
                    {'error': 'No students registered with face data. Please register students first.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            best_match = None
            best_confidence = 0.7  # Minimum confidence threshold - UPDATED
            highest_similarity = 0.0 # To track the highest similarity found

            for student in students:
                stored_encoding = np.frombuffer(student.face_encoding)
                
                # Log type and shape of stored encoding in loop
                logger.info(f"Stored encoding type for student {student.student_id} in loop: {type(stored_encoding)}")
                logger.info(f"Stored encoding shape for student {student.student_id} in loop: {stored_encoding.shape if stored_encoding is not None else 'None'}")
                
                # Log snippets of the encodings before comparison (in the loop)
                logger.info(f"Mark Attendance - Comparing stored encoding snippet ({student.student_id}) in loop: {stored_encoding[:10]}... with new encoding snippet: {face_encoding[:10]}...")

                match, similarity = compare_faces(stored_encoding, face_encoding, threshold=match_threshold)
                highest_similarity = max(highest_similarity, similarity)
                
                if match and similarity > best_confidence:
                    best_match = student
                    best_confidence = similarity

            logger.info(f"Highest similarity found among all students: {highest_similarity}")

            if not best_match:
                logger.warning("No matching student found")
                return Response(
                    {'error': 'No matching student found. Please try again.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Mark attendance for the best match
            attendance, created = Attendance.objects.get_or_create(
                student=best_match,
                date=timezone.now().date(),
                defaults={
                    'status': 'present',
                    'confidence_score': best_confidence
                }
            )

            if not created:
                logger.info(f"Attendance already marked for student {best_match.student_id}")
                return Response(
                    {'error': 'Attendance already marked for today'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            logger.info(f"Successfully marked attendance for student {best_match.student_id}")
            # Return a success response with student details
            return Response(
                {
                    'message': f'Attendance marked successfully for {best_match.first_name} {best_match.last_name}',
                    'student': AttendanceSerializer(attendance).data['student'], # Include student details
                    'date': attendance.date,
                    'time_in': attendance.time_in,
                    'status': attendance.status,
                    'confidence_score': attendance.confidence_score
                },
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Error in marking attendance: {str(e)}")
            return Response(
                {'error': 'Internal server error', 'details': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
