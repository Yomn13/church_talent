from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    IS_TEACHER = 'teacher'
    IS_STUDENT = 'student'
    ROLE_CHOICES = [
        (IS_TEACHER, 'Teacher'),
        (IS_STUDENT, 'Student'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=IS_STUDENT)

class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    talent_point = models.IntegerField(default=0)
    class_name = models.CharField(max_length=50, blank=True)
    theme = models.CharField(max_length=20, default='default') # default, spring, summer, fall, winter

    def __str__(self):
        return f"{self.user.username}'s profile"
