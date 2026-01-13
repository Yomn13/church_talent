from rest_framework import serializers
from accounts.models import User, StudentProfile
from core.models import ActivityLog, Attendance
from datetime import datetime

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role']

class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    name = serializers.CharField(source='user.first_name', read_only=True)
    point_history = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'username', 'name', 'talent_point', 'class_name', 'point_history', 'theme']
        read_only_fields = ['user', 'talent_point']

    def get_point_history(self, obj):
        history = []
        # Activities
        activities = ActivityLog.objects.filter(user=obj.user, is_approved=True)
        for act in activities:
            history.append({
                'id': act.id,
                'model': 'activity',
                'type': 'activity',
                'name': act.get_activity_type_display(),
                'content': act.content,
                'date': act.created_at.strftime('%Y-%m-%d'),
                'timestamp': act.created_at.timestamp()
            })
        
        # Attendance
        attendances = Attendance.objects.filter(user=obj.user)
        for att in attendances:
            history.append({
                'id': att.id,
                'model': 'attendance',
                'type': 'attendance',
                'name': '출석체크',
                'content': '출석체크',
                'date': att.date.strftime('%Y-%m-%d'),
                'timestamp': datetime.combine(att.date, datetime.min.time()).timestamp()
            })
        
        history.sort(key=lambda x: x['timestamp'])
        return history

class StudentManageSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, required=False)
    name = serializers.CharField(write_only=True)
    
    class Meta:
        model = StudentProfile
        fields = ['id', 'username', 'password', 'name', 'talent_point', 'class_name', 'theme']

    def create(self, validated_data):
        username = validated_data.pop('username')
        password = validated_data.pop('password', 'password123')
        name = validated_data.pop('name')
        
        user = User.objects.create_user(username=username, password=password, first_name=name)
        user.role = User.IS_STUDENT
        user.save()
        
        profile = StudentProfile.objects.create(user=user, **validated_data)
        return profile

    def update(self, instance, validated_data):
        user = instance.user
        if 'username' in validated_data:
            user.username = validated_data.pop('username')
        if 'name' in validated_data:
            user.first_name = validated_data.pop('name')
        if 'password' in validated_data:
            password = validated_data.pop('password')
            if password: 
                user.set_password(password)
        user.save()
        
        return super().update(instance, validated_data)

class ActivityLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = ActivityLog
        fields = ['id', 'user', 'username', 'date', 'activity_type', 'content', 'points', 'photo', 'is_approved', 'created_at']
        read_only_fields = ['user', 'is_approved', 'date', 'created_at']

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'user', 'date']
