from django.contrib import admin
from .models import Course, Student, Attendance

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'created_at')
    search_fields = ('code', 'name')
    ordering = ('code',)

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'first_name', 'last_name', 'email', 'course')
    search_fields = ('student_id', 'first_name', 'last_name', 'email')
    list_filter = ('course',)
    ordering = ('student_id',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'time_in', 'status', 'confidence_score')
    search_fields = ('student__student_id', 'student__first_name', 'student__last_name')
    list_filter = ('status', 'date', 'student__course')
    ordering = ('-date', '-time_in')
