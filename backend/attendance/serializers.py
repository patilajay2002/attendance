from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Course, Student, Attendance

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name')

class CourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = '__all__'

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    course = serializers.PrimaryKeyRelatedField(
        queryset=Course.objects.all(),
        write_only=True,
        label='Course'
    )

    class Meta:
        model = Student
        fields = ('id', 'user', 'student_id', 'first_name', 'last_name', 
                 'email', 'course', 'photo', 'created_at', 'updated_at')
        read_only_fields = ('face_encoding',)

class AttendanceSerializer(serializers.ModelSerializer):
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(),
        source='student',
        write_only=True
    )

    class Meta:
        model = Attendance
        fields = ('id', 'student', 'student_id', 'date', 'time_in', 
                 'status', 'confidence_score', 'created_at')
        read_only_fields = ('time_in', 'created_at')

class FaceRecognitionSerializer(serializers.Serializer):
    image = serializers.ImageField(required=True, allow_empty_file=False)
    student_id = serializers.CharField(required=False, allow_blank=True)

    def validate_image(self, value):
        if not value:
            raise serializers.ValidationError("No image file was submitted.")
        if value.size > 5 * 1024 * 1024:  # 5MB limit
            raise serializers.ValidationError("Image file size must be less than 5MB.")
        return value 