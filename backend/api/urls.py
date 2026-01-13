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
    path('attendance-records/', AttendanceViewSet.as_view({'post': 'create'})),
    path('attendance-records/<int:pk>/', AttendanceViewSet.as_view({'delete': 'destroy'})),
    path('seed/', views.seed_users),
]
