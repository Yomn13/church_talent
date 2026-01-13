from django.db import models
from django.conf import settings

class ActivityLog(models.Model):
    ACTIVITY_TYPES = [
        ('prayer', '기도'),
        ('word', '말씀 읽기'),
        ('transcribe', '성경 필사'),
        ('qt', 'QT'),
        ('other', '기타'),
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True)
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    content = models.TextField(blank=True)
    points = models.IntegerField(default=1)
    photo = models.ImageField(upload_to='activities/', blank=True, null=True)
    is_approved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.activity_type}"

class Attendance(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    date = models.DateField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'date')
