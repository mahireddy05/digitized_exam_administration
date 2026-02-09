from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("hod", "HOD"),
        ("faculty", "Faculty"),
        ("student", "Student"),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="student")
    department = models.CharField(max_length=100, null=True, blank=True)