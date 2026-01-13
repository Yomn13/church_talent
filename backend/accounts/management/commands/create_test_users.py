from django.core.management.base import BaseCommand
from accounts.models import User, StudentProfile

class Command(BaseCommand):
    help = 'Creates default test users'

    def handle(self, *args, **kwargs):
        # 1. Create Teacher
        teacher, created = User.objects.get_or_create(username='teacher')
        if created:
            teacher.set_password('teacher123')
            teacher.role = 'teacher'
            teacher.save()
            self.stdout.write(self.style.SUCCESS('Created teacher: teacher / teacher123'))
        else:
            self.stdout.write('Teacher already exists')

        # 2. Create Student
            student.set_password('student123')
            student.role = 'student'
            student.first_name = 'Test Student' # Name goes to User.first_name
            student.save()
            StudentProfile.objects.create(user=student, class_name='Faith Class', talent_point=5)
            self.stdout.write(self.style.SUCCESS('Created student: student1 / student123'))
        else:
            self.stdout.write('Student already exists')

        # 3. Create Superuser (Admin)
        if not User.objects.filter(username='admin').exists():
            User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            self.stdout.write(self.style.SUCCESS('Created superuser: admin / admin123'))
        else:
             self.stdout.write('Admin already exists')
