from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StudentViewSet, ActivityViewSet, check_attendance, get_my_info, AttendanceViewSet
from rest_framework.authtoken.views import obtain_auth_token

router = DefaultRouter()
router.register(r'students', StudentViewSet)
router.register(r'activities', ActivityViewSet)
router.register(r'attendance-records', AttendanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('user/me/', get_my_info, name='user_info'),
    path('attendance/', check_attendance, name='attendance'),
    path('auth-token/', obtain_auth_token, name='api_token_auth'),
]
