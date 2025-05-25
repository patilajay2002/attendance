from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'courses', views.CourseViewSet)
router.register(r'students', views.StudentViewSet)
router.register(r'attendance', views.AttendanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 