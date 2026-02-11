from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("hod", "HOD"),
        ("faculty", "Faculty"),
        ("student", "Student"),
        ("dept_exam_controller", "Dept Exam Controller"),
    )

    user_code = models.CharField(
        max_length=10,
        unique=True,
        null=True,   # allows first migration when users already exist
        blank=True,
    )

    role = models.CharField(
        max_length=30,
        choices=ROLE_CHOICES,
        default="student",
    )

    def save(self, *args, **kwargs):
        # generate only if missing
        if not self.user_code:
            year = timezone.now().year

            # safer: get max existing sequence for this year
            prefix = str(year)
            last = (
                User.objects.filter(user_code__startswith=prefix)
                .order_by("-user_code")
                .values_list("user_code", flat=True)
                .first()
            )

            if last and last.startswith(prefix) and len(last) == 9:
                last_seq = int(last[-5:])
                next_seq = last_seq + 1
            else:
                next_seq = 1

            self.user_code = f"{year}{str(next_seq).zfill(5)}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"
