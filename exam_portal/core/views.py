from django.shortcuts import render, redirect
from django.contrib import messages
import csv
from django.core.files.storage import default_storage
from masters.models import Department, Program
from django.contrib.auth import get_user_model

def dashboard(request):
    User = get_user_model()
    admin_users = User.objects.filter(role='admin').count()
    faculty_count = User.objects.filter(role='faculty').count()
    student_count = User.objects.filter(role='student').count()
    total_users = User.objects.count()
    active_users = User.objects.filter(is_active=True).count()
    return render(request, "core/dashboard.html", {
        "admin_users": admin_users,
        "faculty_count": faculty_count,
        "student_count": student_count,
        "total_users": total_users,
        "active_users": active_users,
    })

def notifications(request):
    return render(request, "core/notifications.html")

def settings_view(request):
    return render(request, "core/settings.html")

def upload_departments(request):
    if request.method == "POST" and request.FILES.get("departments_file"):
        file = request.FILES["departments_file"]
        file_path = default_storage.save("tmp/departments.csv", file)
        with default_storage.open(file_path, mode='rb') as f:
            # Decode with utf-8-sig to handle BOM and ensure text for csv.reader
            text = f.read().decode('utf-8-sig')
            reader = csv.reader(text.splitlines())
            header = next(reader, None)
            for row in reader:
                if len(row) < 2:
                    messages.error(request, "CSV format error: Each row must have dept_code and dept_name.")
                    continue
                dept_code = row[0].strip()
                dept_name = row[1].strip()
                if not dept_code or not dept_name:
                    messages.error(request, "Dept code and dept name cannot be empty.")
                    continue
                if len(dept_code) > Department._meta.get_field('dept_code').max_length:
                    messages.error(request, f"Dept code '{dept_code}' is too long (max {Department._meta.get_field('dept_code').max_length}).")
                    continue
                if len(dept_name) > Department._meta.get_field('dept_name').max_length:
                    messages.error(request, f"Dept name '{dept_name}' is too long (max {Department._meta.get_field('dept_name').max_length}).")
                    continue
                Department.objects.get_or_create(dept_code=dept_code, dept_name=dept_name)
        default_storage.delete(file_path)
        messages.success(request, "Departments uploaded and added successfully.")
        return redirect("core:settings")
    messages.error(request, "No file uploaded or invalid CSV format.")
    return redirect("core:settings")

def upload_programs(request):
    if request.method == "POST" and request.FILES.get("programs_file"):
        file = request.FILES["programs_file"]
        file_path = default_storage.save("tmp/programs.csv", file)
        with default_storage.open(file_path, mode='rb') as f:
            text = f.read().decode('utf-8-sig')
            reader = csv.reader(text.splitlines())
            header = next(reader, None)
            for row in reader:
                # Use correct field names: program_code, program_name
                program_code = row[0].strip() if len(row) > 0 else ""
                program_name = row[1].strip() if len(row) > 1 else ""
                if not program_code or not program_name:
                    continue
                Program.objects.get_or_create(program_code=program_code, program_name=program_name)
        default_storage.delete(file_path)
        messages.success(request, "Programs uploaded and added successfully.")
        return redirect("core:settings")
    messages.error(request, "No file uploaded.")
    return redirect("core:settings")

def upload_users(request):
    if request.method == "POST" and request.FILES.get("users_file"):
        file = request.FILES["users_file"]
        file_path = default_storage.save("tmp/users.csv", file)
        with default_storage.open(file_path, mode='rb') as f:
            text = f.read().decode('utf-8-sig')
            reader = csv.reader(text.splitlines())
            header = next(reader, None)
            User = get_user_model()
            for row in reader:
                # Expecting: username, password, first_name, last_name, email, role
                if len(row) < 6:
                    messages.error(request, "CSV format error: Each row must have username, password, first_name, last_name, email, role.")
                    continue
                username = row[0].strip()
                password = row[1].strip()
                first_name = row[2].strip()
                last_name = row[3].strip()
                email = row[4].strip()
                role = row[5].strip().lower()
                if not username or not password or not email:
                    messages.error(request, "Username, password, and email cannot be empty.")
                    continue

                # Set user flags based on role
                is_superuser = is_staff = is_active = False
                if role == "admin":
                    is_superuser = True
                    is_staff = True
                    is_active = True
                elif role == "faculty" or role == "staff" or role == "hod" or role == "dept_exam_incharge":
                    is_superuser = False
                    is_staff = True
                    is_active = True
                elif role == "student":
                    is_superuser = False
                    is_staff = False
                    is_active = True
                else:
                    # Default: treat as normal user
                    is_superuser = False
                    is_staff = False
                    is_active = True

                # Save the role field explicitly if it exists on the model
                user, created = User.objects.get_or_create(username=username, defaults={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "is_superuser": is_superuser,
                    "is_staff": is_staff,
                    "is_active": is_active,
                    "role": role,  # <-- ensure this line is present
                })
                # Always set password and update role fields if user already exists
                user.email = email
                user.first_name = first_name
                user.last_name = last_name
                user.is_superuser = is_superuser
                user.is_staff = is_staff
                user.is_active = is_active
                if hasattr(user, "role"):
                    user.role = role  # <-- update role on existing user as well
                user.set_password(password)
                user.save()
        default_storage.delete(file_path)
        messages.success(request, "Users uploaded and added successfully.")
        return redirect("core:settings")
    messages.error(request, "No file uploaded or invalid CSV format.")
    return redirect("core:settings")