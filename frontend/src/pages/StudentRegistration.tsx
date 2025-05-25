import { useRef, useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import type { SelectChangeEvent } from '@mui/material';
import Webcam from 'react-webcam';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import axios, { Axios } from 'axios';

interface Course {
  id: number;
  name: string;
}

interface StudentRegistration {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  course: number;
}

interface FaceDetectionResponse {
  face_detected: boolean;
  confidence?: number;
  face_position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  message?: string;
}

// Define interface for User based on UserSerializer
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

// Define interface for the response when creating a student
interface CreatedStudentResponse {
  id: number;
  user: User | null; // User field from UserSerializer
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  course: number; // Course ID is returned as primary key
  photo?: string; // Photo URL might be returned
  created_at: string; // DateTimeField serialized as string
  updated_at: string; // DateTimeField serialized as string
}

const StudentRegistration: React.FC = () => {
  const webcamRef = useRef<Webcam>(null);
  const [capturing, setCapturing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [facePosition, setFacePosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState<StudentRegistration>({
    student_id: '',
    first_name: '',
    last_name: '',
    email: '',
    course: 0,
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get<{ results: Course[] }>('/api/courses/');
      setCourses(response.data.results);
    } catch (err) {
      setError('Failed to fetch courses');
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<number>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const checkFaceDetection = async () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const formData = new FormData();
      formData.append('image', blob, 'check.jpg');
      
      const response = await axios.post<FaceDetectionResponse>('/api/attendance/check_face/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setFaceDetected(response.data.face_detected);
      if (response.data.face_position) {
        setFacePosition(response.data.face_position);
      }
    } catch (err) {
      setFaceDetected(false);
      setFacePosition(null);
    }
  };

  useEffect(() => {
    const interval = setInterval(checkFaceDetection, 500);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faceDetected) {
      setError('Please position your face in the frame');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) {
        throw new Error('Could not capture image');
      }

      // First, create the student record without the photo
      const studentData = new FormData();
      studentData.append('student_id', formData.student_id);
      studentData.append('first_name', formData.first_name);
      studentData.append('last_name', formData.last_name);
      studentData.append('email', formData.email);
      studentData.append('course', formData.course.toString());

      const studentResponse: Axios.AxiosResponse<CreatedStudentResponse> = await axios.post('/api/students/', studentData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      const createdStudent = studentResponse.data;

      // Then, upload the photo and trigger face encoding
      const photoData = new FormData();
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      photoData.append('student_id', createdStudent.student_id); // Use student_id from created student
      photoData.append('photo', blob, 'capture.jpg');

      await axios.post('/api/students/upload_photo/', photoData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setSuccess('Student registered and photo uploaded successfully');
      setFormData({
        student_id: '',
        first_name: '',
        last_name: '',
        email: '',
        course: 0,
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom align="center">
          Student Registration
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ position: 'relative', mb: 2 }}>
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width="100%"
                height={300}
                videoConstraints={{ facingMode: 'user' }}
                style={{ 
                  borderRadius: 8, 
                  border: `2px solid ${faceDetected ? '#4caf50' : '#f44336'}`,
                  position: 'relative'
                }}
              />
              {facePosition && (
                <Box
                  sx={{
                    position: 'absolute',
                    border: '2px solid #4caf50',
                    borderRadius: 1,
                    top: facePosition.y,
                    left: facePosition.x,
                    width: facePosition.width,
                    height: facePosition.height,
                    pointerEvents: 'none',
                  }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <Alert severity={faceDetected ? "success" : "warning"}>
                {faceDetected ? "Face detected" : "No face detected"}
              </Alert>
            </Box>
          </Box>
          <Box sx={{ flex: 1 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Student ID"
                name="student_id"
                value={formData.student_id}
                onChange={handleTextChange}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleTextChange}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleTextChange}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleTextChange}
                required
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Course</InputLabel>
                <Select
                  name="course"
                  value={formData.course}
                  onChange={handleSelectChange}
                  required
                  label="Course"
                >
                  {courses.map((course) => (
                    <MenuItem key={course.id} value={course.id}>
                      {course.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || !faceDetected}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Register Student'}
              </Button>
            </form>
          </Box>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Paper>
    </Container>
  );
};

export default StudentRegistration; 