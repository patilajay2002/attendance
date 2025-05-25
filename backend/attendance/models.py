from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Course(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code} - {self.name}"

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    student_id = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    course = models.ForeignKey(Course, on_delete=models.SET_NULL, null=True)
    photo = models.ImageField(upload_to='student_photos/', null=True, blank=True)
    face_encoding = models.BinaryField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student_id} - {self.first_name} {self.last_name}"

    class Meta:
        ordering = ['student_id']

class Attendance(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    time_in = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=[
        ('present', 'Present'),
        ('late', 'Late'),
        ('absent', 'Absent')
    ], default='present')
    confidence_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'date']
        ordering = ['-date', '-time_in']

    def __str__(self):
        return f"{self.student} - {self.date} ({self.status})"
