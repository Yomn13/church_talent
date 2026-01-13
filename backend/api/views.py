from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action, api_view, permission_classes
from accounts.models import User, StudentProfile
from core.models import ActivityLog, Attendance
from .serializers import ActivityLogSerializer, StudentProfileSerializer, StudentManageSerializer, AttendanceSerializer
from django.utils import timezone
import datetime

class StudentViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return StudentManageSerializer
        return StudentProfileSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return StudentProfile.objects.none()
        if user.role == User.IS_TEACHER:
            return StudentProfile.objects.all()
        # Student sees themselves (or maybe all friends forest? per requirements "Friend's Forest")
        # Allow viewing all students for the ranking forest
        return StudentProfile.objects.all()

    @action(detail=False, methods=['get'])
    def me(self, request):
        if not request.user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        try:
            profile = request.user.student_profile
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except StudentProfile.DoesNotExist:
            return Response({'error': 'No profile'}, status=404)

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = ActivityLog.objects.all()
    serializer_class = ActivityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == User.IS_TEACHER and 'user_id' in self.request.data:
            from accounts.models import User
            try:
                target_user = User.objects.get(id=self.request.data['user_id'])
                instance = serializer.save(user=target_user, is_approved=True) # Auto-approve if teacher adds
                # Add point
                profile, _ = StudentProfile.objects.get_or_create(user=target_user)
                profile.talent_point += instance.points
                profile.save()
                return
            except User.DoesNotExist:
                pass # Fallback to self
        
        # Student Upload
        serializer.save(user=user)

    def perform_destroy(self, instance):
        if instance.is_approved:
            profile, _ = StudentProfile.objects.get_or_create(user=instance.user)
            if profile.talent_point >= instance.points:
                profile.talent_point -= instance.points
            else:
                profile.talent_point = 0
            profile.save()
        instance.delete()
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ActivityLog.objects.none()
        if user.role == User.IS_TEACHER:
            return ActivityLog.objects.all()
        return ActivityLog.objects.filter(user=user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        # Only teacher can approve
        if request.user.role != User.IS_TEACHER:
            return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
            
        activity = self.get_object()
        if not activity.is_approved:
            activity.is_approved = True
            activity.save()
            # Add talent point
            profile, created = StudentProfile.objects.get_or_create(user=activity.user)
            profile.talent_point += 1
            profile.save()
            return Response({'status': 'approved'})
        return Response({'status': 'already approved'})

        return Response({'status': 'already approved'})

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only teacher can see all. Student?? detailed in point_history already.
        # This viewset is mainly for CRUD by teacher.
        if self.request.user.role == User.IS_TEACHER:
            return Attendance.objects.all()
        return Attendance.objects.none()

    def perform_create(self, serializer):
        # Allow manually creating attendance.
        user = serializer.validated_data['user']
        # Add point
        profile, _ = StudentProfile.objects.get_or_create(user=user)
        profile.talent_point += 1
        profile.save()
        serializer.save()

    def perform_destroy(self, instance):
        # Remove point
        profile, _ = StudentProfile.objects.get_or_create(user=instance.user)
        if profile.talent_point > 0:
            profile.talent_point -= 1
            profile.save()
        instance.delete()

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_info(request):
    return Response({
        'username': request.user.username,
        'role': request.user.role,
        'id': request.user.id
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def check_attendance(request):
    # Only teacher can check attendance
    if request.user.role != User.IS_TEACHER:
        return Response({'message': 'Only teachers can check attendance'}, status=status.HTTP_403_FORBIDDEN)
    
    student_id = request.data.get('student_id')
    if not student_id:
        return Response({'message': 'Student ID required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        student_user = User.objects.get(id=student_id)
    except User.DoesNotExist:
        return Response({'message': 'Student not found'}, status=404)

    today = timezone.localdate()
    # Check if attended this week (Monday to Sunday)
    start_week = today - datetime.timedelta(days=today.weekday())
    end_week = start_week + datetime.timedelta(days=6)
    
    if Attendance.objects.filter(user=student_user, date__range=[start_week, end_week]).exists():
        return Response({'message': 'Already checked attendance this week'}, status=status.HTTP_400_BAD_REQUEST)
    
    Attendance.objects.create(user=student_user)
    # Give point
    profile, created = StudentProfile.objects.get_or_create(user=student_user)
    profile.talent_point += 1
    profile.save()
    
    return Response({'message': f'Attendance checked for {student_user.username} (+1 Talent)'})
