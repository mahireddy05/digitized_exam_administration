from django.contrib.auth.decorators import login_required
# Simple batch list view for redirection
from django.shortcuts import render
@login_required
def batch_list(request):
    from .models import Batch
    batches = Batch.objects.all()
    return render(request, "masters/batch_list.html", {"batches": batches})
from io import TextIOWrapper
import csv
import unicodedata
import re
from django.contrib import messages
from django.shortcuts import redirect
# ===== BATCH CSV UPLOAD =====
@login_required
def batch_upload(request):
    from .models import Batch
    if request.method == "POST" and request.FILES.get("csv_file"):
        csv_file = request.FILES["csv_file"]
        success_count = 0
        try:
            decoded_file = TextIOWrapper(csv_file.file, encoding='utf-8')
            reader = csv.DictReader(decoded_file)
            if not reader.fieldnames:
                messages.error(request, "CSV header error: Expected headers ['batch_code', 'admission_year', 'grad_year'].")
                return redirect("core:settings")
            def normalize(val):
                if not val:
                    return ""
                val = unicodedata.normalize("NFKC", val)
                val = re.sub(r"[\s\u00A0\u200B\u200C\u200D\uFEFF]+", " ", val)
                val = val.strip().lower()
                return val
            # Normalize headers to handle BOM, whitespace, and case
            def norm_header(h):
                if not h:
                    return ""
                h = unicodedata.normalize("NFKC", h)
                h = re.sub(r"[\s\u00A0\u200B\u200C\u200D\uFEFF]+", "", h)
                h = h.strip().lower()
                return h

            norm_field_map = {norm_header(k): k for k in reader.fieldnames}
            required_fields = ["batch_code", "admission_year", "grad_year"]
            missing_fields = [f for f in required_fields if f not in norm_field_map]
            if missing_fields:
                messages.error(request, f"CSV header error: Expected headers {required_fields}.")
                return redirect("core:settings")
            code_key = norm_field_map.get("batch_code") or norm_field_map.get("regulation")
            admission_key = norm_field_map.get("admission_year")
            grad_key = norm_field_map.get("grad_year")
            status_key = norm_field_map.get("status")
            for i, row in enumerate(reader, start=2):
                batch_code = row.get(code_key) if code_key else None
                admission_year = row.get(admission_key) if admission_key else None
                grad_year = row.get(grad_key) if grad_key else None
                status = row.get(status_key) if status_key else "ACTIVE"
                row_has_error = False
                if not batch_code:
                    messages.error(request, f"CSV format error: batch_code/regulation cannot be empty. (Row {i})")
                    row_has_error = True
                if not admission_year:
                    messages.error(request, f"CSV format error: admission_year cannot be empty. (Row {i})")
                    row_has_error = True
                if not grad_year:
                    messages.error(request, f"CSV format error: grad_year cannot be empty. (Row {i})")
                    row_has_error = True
                if not row_has_error:
                    batch_code_norm = normalize(batch_code)
                    try:
                        batch = Batch.objects.get(batch_code__iexact=batch_code_norm)
                        # Check for differences
                        diffs = []
                        if str(batch.admission_year) != str(admission_year):
                            diffs.append(("Admission Year", batch.admission_year, admission_year))
                        if str(batch.grad_year) != str(grad_year):
                            diffs.append(("Grad Year", batch.grad_year, grad_year))
                        if batch.status != status:
                            diffs.append(("Status", batch.status, status))
                        if not diffs:
                            messages.warning(request, f"Batch '{batch_code}' already exists.")
                        else:
                            messages.warning(request, f"Batch '{batch_code}' exists with differences: {diffs}")
                    except Batch.DoesNotExist:
                        Batch.objects.create(
                            batch_code=batch_code,
                            admission_year=admission_year,
                            grad_year=grad_year,
                            status=status
                        )
                        success_count += 1
            if success_count:
                messages.success(request, f"{success_count} batch(es) imported successfully.")
        except Exception as e:
            messages.error(request, f"Error processing file: {e}")
        return redirect("core:settings")
    messages.error(request, "No file uploaded.")
    return redirect("core:settings")
# Handle POST from coursereg_conflict.html to break redirect loop
from django.views.decorators.csrf import csrf_exempt
@csrf_exempt
@login_required
def coursereg_conflict_resolve(request):
    from django.contrib import messages
    from operations.models import StudentCourse
    from .models import Student, Course
    if request.method == "POST":
        selected = request.POST.getlist('conflict_rows')
        from django.shortcuts import render
        from django.conf import settings
        conflicts = request.session.get('coursereg_conflicts')
        if not selected:
            messages.warning(request, "No conflicts selected for update.")
            # Try to reload the same conflict page with the same data
            # If conflicts are not in session, fallback to redirect
            if conflicts:
                return render(request, "masters/coursereg_conflict.html", {"conflicts": conflicts})
            else:
                return redirect('masters:coursereg')
        success_count = 0
        fail_count = 0
        for val in selected:
            try:
                sid, ccode, ay, sem = val.split('|')
                student = Student.objects.get(student_id=sid)
                course = Course.objects.get(course_code=ccode)
                # Find the old registration (conflict)
                old_reg = StudentCourse.objects.filter(student=student, course=course).exclude(academic_year=ay, semester=sem).first()
                # To avoid unique constraint error, delete old before creating new
                if old_reg:
                    old_reg.delete()
                StudentCourse.objects.create(student=student, course=course, academic_year=ay, semester=sem, is_active=True)
                success_count += 1
            except Exception as e:
                fail_count += 1
        if success_count:
            messages.success(request, f"{success_count} conflict(s) registered successfully.")
        if fail_count:
            messages.error(request, f"{fail_count} conflict(s) failed to register.")
        # After update, remove session conflicts and redirect
        if 'coursereg_conflicts' in request.session:
            del request.session['coursereg_conflicts']
        return redirect('masters:coursereg')
# ===== FACULTY CSV UPLOAD =====
@login_required
def faculty_upload(request):
    if request.method == "POST" and request.FILES.get("csv_file"):
        csv_file = request.FILES["csv_file"]
        success_count = 0
        try:
            decoded_file = TextIOWrapper(csv_file.file, encoding='utf-8')
            reader = csv.DictReader(decoded_file)
            if not reader.fieldnames:
                messages.error(request, "CSV file is missing headers.")
                return redirect("masters:faculty")
            def normalize(val):
                if not val:
                    return ""
                val = unicodedata.normalize("NFKC", val)
                val = re.sub(r"[\s\u00A0\u200B\u200C\u200D\uFEFF]+", " ", val)
                val = val.strip().lower()
                return val
            from .models import Department
            from accounts.models import User
            dept_lookup = {normalize(d.dept_name): d for d in Department.objects.all()}
            field_map = {k.strip().lower(): k for k in reader.fieldnames}
            dept_key = field_map.get("dept_name") or field_map.get("department")
            mismatches = []
            for i, row in enumerate(reader, start=2):
                faculty_id = row.get(field_map.get("faculty_id")) if field_map.get("faculty_id") else None
                phone_number = row.get(field_map.get("phone_number")) if field_map.get("phone_number") else None
                designation = row.get(field_map.get("designation")) if field_map.get("designation") else None
                status = row.get(field_map.get("status")) if field_map.get("status") else "ACTIVE"
                dept_name = row.get(dept_key) if dept_key else None
                name = row.get(field_map.get("faculty_name")) if field_map.get("faculty_name") else None
                row_has_error = False
                user = None
                if not faculty_id:
                    messages.error(request, f"Row {i}: faculty_id is missing in the CSV.")
                    row_has_error = True
                else:
                    try:
                        user = User.objects.get(username=faculty_id)
                    except User.DoesNotExist:
                        messages.error(request, f"Row {i}: User with faculty_id '{faculty_id}' not found.")
                        row_has_error = True
                if not name and user:
                    name = f"{user.first_name} {user.last_name}".strip()
                if not name:
                    messages.error(request, f"Row {i}:'{faculty_id}' is not linked to any user.")
                    row_has_error = True
                if not dept_name:
                    messages.error(request, f"Row {i}: Department name is missing in the CSV.")
                    row_has_error = True
                else:
                    norm_dept_name = normalize(dept_name)
                    dept = dept_lookup.get(norm_dept_name)
                    if not dept:
                        messages.error(request, f"Row {i}: Department '{dept_name}' not found.")
                        row_has_error = True
                if not row_has_error and faculty_id:
                    from .models import Faculty
                    try:
                        faculty = Faculty.objects.get(faculty_id=faculty_id)
                        diffs = []
                        if faculty.faculty_name != name:
                            diffs.append(("Name", faculty.faculty_name, name))
                        if user and faculty.email != user.email:
                            diffs.append(("Email", faculty.email, user.email))
                        if faculty.phone_number != phone_number:
                            diffs.append(("Phone Number", faculty.phone_number, phone_number))
                        if faculty.dept != dept:
                            diffs.append(("Department", faculty.dept.dept_name if faculty.dept else "", dept.dept_name if dept else ""))
                        if faculty.status != status:
                            diffs.append(("Status", faculty.status, status))
                        if designation and faculty.designation != designation:
                            diffs.append(("Designation", faculty.designation, designation))
                        if not diffs:
                            messages.warning(request, f"Faculty with ID '{faculty_id}' already exists.")
                        else:
                            mismatches.append({
                                "faculty_id": faculty_id,
                                "diffs": diffs
                            })
                    except Faculty.DoesNotExist:
                        if not user:
                            messages.error(request, f"Row {i}: No user found with username '{faculty_id}' to link as faculty.")
                        else:
                            Faculty.objects.create(
                                faculty_id=faculty_id,
                                user=user,
                                faculty_name=name,
                                phone_number=phone_number,
                                dept=dept,
                                designation=designation,
                                status=status
                            )
                            success_count += 1
            if success_count:
                messages.success(request, f"{success_count} faculty imported successfully.")
            if mismatches:
                request.session['faculty_mismatches'] = mismatches
                return redirect('masters:faculty_update_conflicts')
        except Exception as e:
            messages.error(request, f"Error importing CSV: {e}")
    else:
        messages.error(request, "No file uploaded.")
    return redirect("masters:faculty")
# AJAX: Edit course
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

@csrf_exempt
@login_required
def course_edit(request, pk):
    from .models import Course
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            code = data.get('course_code', '').strip()
            name = data.get('course_name', '').strip()
            is_active = data.get('is_active', True)
            course = Course.objects.get(pk=pk)
            if code:
                course.course_code = code
            if name:
                course.course_name = name
            course.is_active = bool(is_active)
            course.save()
            # Set a session flag for notification
            request.session['course_message'] = 'Course updated successfully.'
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

# AJAX: Delete course
@csrf_exempt
@login_required
def course_delete(request, pk):
    from .models import Course
    if request.method == 'POST':
        try:
            course = Course.objects.get(pk=pk)
            course.delete()
            # Set a session flag for notification
            request.session['course_message'] = 'Course deleted successfully.'
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request'})
from django.shortcuts import render
from .models import Student, Faculty, Room

# ===== STUDENTS =====
@login_required
def student(request):
    from .models import Department, Batch
    from django.core.paginator import Paginator
    from django.db import models
    students = Student.objects.select_related('user', 'dept', 'batch').all().order_by('student_id')
    departments = Department.objects.all()
    batches = Batch.objects.all()
    search = request.GET.get('search', '').strip().lower()
    department = request.GET.get('department', '').strip()
    batch = request.GET.get('batch', '').strip()
    if search:
        students = students.filter(
            models.Q(student_id__icontains=search) |
            models.Q(user__first_name__icontains=search) |
            models.Q(user__last_name__icontains=search)
        )
    if department and department != 'all':
        students = students.filter(dept__dept_code=department)
    if batch and batch != 'all':
        students = students.filter(batch__batch_code=batch)
    paginator = Paginator(students, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    return render(request, "masters/student.html", {
        "page_obj": page_obj,
        "departments": departments,
        "batches": batches,
        "search": search,
        "selected_department": department,
        "selected_batch": batch
    })

@login_required
def student_content(request):
    return render(request, "masters/student_content.html")

@login_required
def student_detail(request, pk):
    from .models import Student
    student = Student.objects.select_related('user', 'dept', 'program').get(pk=pk)
    return render(request, "masters/student_detail.html", {"student": student})

@login_required
def student_edit(request, pk):
    from .models import Student, Department, Program, Batch
    student = Student.objects.select_related('user', 'dept', 'program', 'batch').get(pk=pk)
    departments = Department.objects.all()
    programs = Program.objects.all()
    batches = Batch.objects.all()
    if request.method == "POST":
        user = student.user
        user.first_name = request.POST.get("first_name", user.first_name)
        user.last_name = request.POST.get("last_name", user.last_name)
        user.email = request.POST.get("email", user.email)
        user.save()
        dept_id = request.POST.get("department")
        program_id = request.POST.get("program")
        batch_id = request.POST.get("batch")
        student.dept_id = dept_id if dept_id else student.dept_id
        student.program_id = program_id if program_id else student.program_id
        student.batch_id = batch_id if batch_id else student.batch_id
        student.email = user.email  # keep in sync
        student.phone_number = request.POST.get("phone_number", student.phone_number)
        student.parent_phone_number = request.POST.get("parent_phone_number", student.parent_phone_number)
        student.status = request.POST.get("status", student.status)
        student.save()
        from django.contrib import messages
        messages.success(request, "Student details updated successfully.")
        return redirect("masters:student_detail", pk=student.pk)
    return render(request, "masters/student_edit.html", {"student": student, "departments": departments, "programs": programs, "batches": batches})

@login_required
def student_delete(request, pk):
    from django.http import JsonResponse
    from django.shortcuts import get_object_or_404, redirect
    from .models import Student
    student = get_object_or_404(Student, pk=pk)
    if request.method == "POST":
        student.delete()
        # AJAX request
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({"success": True})
        # Normal form submission
        return redirect("masters:student")
    return render(request, "masters/student_delete.html", {"student": student})

# ===== FACULTY =====
@login_required
def faculty(request):
    from .models import Department
    from django.core.paginator import Paginator
    faculties = Faculty.objects.select_related('user', 'dept').all()
    departments = Department.objects.all()
    search = request.GET.get('search', '').strip().lower()
    department = request.GET.get('department', '').strip()
    if search:
        faculties = faculties.filter(
            models.Q(faculty_id__icontains=search) |
            models.Q(user__first_name__icontains=search) |
            models.Q(user__last_name__icontains=search)
        )
    if department and department != 'all':
        faculties = faculties.filter(dept__dept_code=department)
    paginator = Paginator(faculties, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    return render(request, "masters/faculty.html", {
        "page_obj": page_obj,
        "departments": departments,
        "search": search,
        "selected_department": department
    })

@login_required
def faculty_content(request):
    return render(request, "masters/faculty_content.html")

@login_required
def faculty_detail(request, pk):
    from django.shortcuts import get_object_or_404
    faculty = get_object_or_404(Faculty.objects.select_related('user', 'dept'), pk=pk)
    return render(request, "masters/faculty_detail.html", {"faculty": faculty})

@login_required
def faculty_detail_content(request, pk):
    return render(request, "masters/faculty_detail_content.html", {"pk": pk})

@login_required
def faculty_edit(request, pk):
    from .models import Faculty, Department
    from accounts.models import User
    faculty = Faculty.objects.select_related('user', 'dept').get(pk=pk)
    departments = Department.objects.all()
    user = faculty.user
    if request.method == "POST":
        user.first_name = request.POST.get("first_name", user.first_name)
        user.last_name = request.POST.get("last_name", user.last_name)
        user.email = request.POST.get("email", user.email)
        user.save()
        dept_id = request.POST.get("department")
        if dept_id:
            faculty.dept_id = dept_id
        faculty.phone_number = request.POST.get("phone", faculty.phone_number)
        faculty.designation = request.POST.get("designation", faculty.designation)
        faculty.status = request.POST.get("status", faculty.status)
        faculty.save()
        from django.contrib import messages
        messages.success(request, "Faculty details updated successfully.")
        return redirect("masters:faculty_detail", pk=faculty.pk)
    return render(request, "masters/faculty_edit.html", {"faculty": faculty, "user": user, "departments": departments})

@login_required
def faculty_delete(request, pk):
    from django.http import JsonResponse
    from django.shortcuts import get_object_or_404, redirect
    from .models import Faculty
    faculty = get_object_or_404(Faculty, pk=pk)
    user = faculty.user if hasattr(faculty, 'user') else None
    if request.method == "POST":
        faculty.delete()
        # AJAX request
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({"success": True})
        # Normal form submission
        return redirect("masters:faculty")
    return render(request, "masters/faculty_delete.html", {"faculty": faculty, "user": user})


# ===== ROOMS =====
from django.contrib import messages
import csv
from io import TextIOWrapper
import unicodedata
import re
from django.shortcuts import redirect

@login_required
def rooms(request):
    from django.core.paginator import Paginator
    unique_blocks = Room.objects.values_list('block', flat=True).distinct()
    rooms = Room.objects.all()
    search = request.GET.get('search', '').strip().lower()
    block = request.GET.get('block', '').strip()
    capacity_min = request.GET.get('capacity_min', '').strip()
    capacity_max = request.GET.get('capacity_max', '').strip()
    if search:
        rooms = rooms.filter(
            models.Q(room_code__icontains=search) |
            models.Q(block__icontains=search)
        )
    if block and block.lower() != 'all' and block:
        rooms = rooms.filter(block=block)
    if capacity_min.isdigit():
        rooms = rooms.filter(capacity__gte=int(capacity_min))
    if capacity_max.isdigit():
        rooms = rooms.filter(capacity__lte=int(capacity_max))
    paginator = Paginator(rooms, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    return render(request, "masters/rooms.html", {
        "page_obj": page_obj,
        "unique_blocks": unique_blocks,
        "search": search,
        "selected_block": block,
        "capacity_min": capacity_min,
        "capacity_max": capacity_max,
    })

# CSV upload view
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.utils.datastructures import MultiValueDictKeyError

@login_required
def room_upload(request):
    if request.method == "POST" and request.FILES.get("csv_file"):
        csv_file = request.FILES["csv_file"]
        errors = []
        success_count = 0
        try:
            decoded_file = TextIOWrapper(csv_file.file, encoding='utf-8')
            reader = csv.DictReader(decoded_file)
            # DEBUG: Log CSV headers and field_map
            messages.error(request, f"DEBUG: CSV headers={reader.fieldnames}")
            field_map = {k.strip().lower(): k for k in reader.fieldnames}
            messages.error(request, f"DEBUG: field_map={field_map}")
            def normalize(val):
                if not val:
                    return ""
                val = unicodedata.normalize("NFKC", val)
                val = re.sub(r"[\s\u00A0\u200B\u200C\u200D\uFEFF]+", " ", val)  # Remove all unicode whitespace/invisible
                val = val.strip().lower()
                return val

            # Build lookup dictionaries for departments and programs
            from .models import Department, Program
            from accounts.models import User
            dept_lookup = {normalize(d.dept_name): d for d in Department.objects.all()}
            # Match program_code instead of program_name
            program_lookup = {normalize(p.program_code): p for p in Program.objects.all()}

            # Fix: strip whitespace from all field_map values for robust lookup
            field_map = {k.strip().lower(): v.strip() for k, v in field_map.items()}
            dept_key = field_map.get("dept_name") or field_map.get("department")
            # Find the actual key in the CSV header for 'program' (with or without spaces)
            program_key = None
            for k in reader.fieldnames:
                if k.strip().lower() in ("program", "program_name"):
                    program_key = k
                    break
            # Find all possible program keys in the row (case-insensitive, strip spaces)
            possible_program_keys = [k for k in reader.fieldnames if k.strip().lower() in ("program", "program_name")]
            mismatches = []
            for i, row in enumerate(reader, start=2):
                student_id = row.get(field_map.get("student_id"))
                phone_number = row.get(field_map.get("phone_number"))
                parent_phone_number = row.get(field_map.get("parent_phone_number"))
                dept_name = row.get(dept_key)
                possible_program_keys = [k for k in row.keys() if k.strip().lower() in ("program", "program_name")]
                program_name = None
                for k in possible_program_keys:
                    if row.get(k):
                        program_name = row.get(k)
                        break
                row_has_error = False
                # Error: student_id missing
                if not student_id:
                    messages.error(request, f"Row {i}: student_id is missing in the CSV.")
                    row_has_error = True
                else:
                    try:
                        user = User.objects.get(username=student_id)
                    except User.DoesNotExist:
                        messages.error(request, f"Row {i}: User with student_id '{student_id}' not found.")
                        row_has_error = True
                if not dept_name:
                    messages.error(request, f"Row {i}: Department name is missing in the CSV.")
                    row_has_error = True
                else:
                    norm_dept_name = normalize(dept_name)
                    dept = dept_lookup.get(norm_dept_name)
                    if not dept:
                        messages.error(request, f"Row {i}: Department '{dept_name}' not found.")
                        row_has_error = True
                if not program_name:
                    messages.error(request, f"Row {i}: Program name is missing in the CSV.")
                    row_has_error = True
                else:
                    norm_program_name = normalize(program_name)
                    program = program_lookup.get(norm_program_name)
                    if not program:
                        messages.error(request, f"Row {i}: Program '{program_name}' not found.")
                        row_has_error = True
                if not row_has_error and student_id:
                    name = f"{user.first_name} {user.last_name}".strip()
                    email = user.email
                    from .models import Student
                    try:
                        student = Student.objects.get(student_id=student_id)
                        # Compare all relevant fields
                        diffs = []
                        if student.std_name != name:
                            diffs.append(("Name", student.std_name, name))
                        if student.email != email:
                            diffs.append(("Email", student.email, email))
                        if student.phone_number != phone_number:
                            diffs.append(("Phone Number", student.phone_number, phone_number))
                        if student.parent_phone_number != parent_phone_number:
                            diffs.append(("Parent Phone Number", student.parent_phone_number, parent_phone_number))
                        if student.dept != dept:
                            diffs.append(("Department", student.dept.dept_name if student.dept else "", dept.dept_name if dept else ""))
                        if student.program != program:
                            diffs.append(("Program", student.program.program_name if student.program else "", program.program_name if program else ""))
                        if student.status != "ACTIVE":
                            diffs.append(("Status", student.status, "ACTIVE"))
                        if not diffs:
                            messages.warning(request, f"Student with ID '{student_id}' already exists.")
                        else:
                            mismatches.append({
                                "student_id": student_id,
                                "diffs": diffs
                            })
                    except Student.DoesNotExist:
                        # Create new student
                        Student.objects.create(
                            student_id=student_id,
                            user=user,
                            std_name=name,
                            email=email,
                            phone_number=phone_number,
                            parent_phone_number=parent_phone_number,
                            dept=dept,
                            program=program,
                            status="ACTIVE"
                        )
                        success_count += 1
            if success_count:
                messages.success(request, f"{success_count} students imported successfully.")
            if mismatches:
                request.session['student_mismatches'] = mismatches
                return redirect('masters:student_update_conflicts')
        except Exception as e:
            messages.error(request, f"Error importing CSV: {e}")
    else:
        messages.error(request, "No file uploaded.")
    return redirect("masters:student")

@login_required
def rooms_content(request):
    return render(request, "masters/rooms_content.html")

@login_required
def room_detail(request, pk):
    room = Room.objects.get(pk=pk)
    return render(request, "masters/room_detail.html", {"room": room})

@login_required
def room_detail_content(request, pk):
    return render(request, "masters/room_detail_content.html", {"pk": pk})

@login_required
def room_edit(request, pk):
    room = Room.objects.get(pk=pk)
    if request.method == "POST":
        room.block = request.POST.get("block", room.block)
        room.floor = request.POST.get("floor", room.floor)
        # Capacity is auto-calculated, so update rows/columns
        try:
            room.rows = int(request.POST.get("rowscount", room.rows))
            room.columns = int(request.POST.get("columnscount", room.columns))
        except (TypeError, ValueError):
            pass
        # Checkbox: present if checked, absent if not
        room.is_active = 'is_active' in request.POST
        room.save()
        messages.success(request, "Room updated successfully.")
        return redirect("masters:room_detail", pk=room.pk)
    return render(request, "masters/room_edit.html", {"room": room})

@login_required
def room_delete(request, pk):
    room = Room.objects.get(pk=pk)
    if request.method == "POST":
        room.delete()
        messages.success(request, "Room deleted successfully.")
        return redirect("masters:rooms")
    return render(request, "masters/room_delete.html", {"room": room})

# ===== COURSES =====
@login_required
def courses(request):
    from .models import Course
    from django.core.paginator import Paginator
    search = request.GET.get('search', '').strip().lower()
    courses = Course.objects.all().order_by('course_code')
    if search:
        courses = courses.filter(
            models.Q(course_code__icontains=search) |
            models.Q(course_name__icontains=search)
        )
    paginator = Paginator(courses, 25)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    # Check for session notification
    course_message = request.session.pop('course_message', None)
    context = {"page_obj": page_obj, "search": search}
    if course_message:
        from django.contrib import messages
        messages.success(request, course_message)
    return render(request, "masters/courses.html", context)

from .models import Course

# ===== COURSE CSV UPLOAD =====
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
@csrf_exempt
@require_POST
@login_required
def course_upload(request):
    from django.contrib import messages
    import csv
    from io import TextIOWrapper
    if request.method == "POST" and request.FILES.get("csv_file"):
        csv_file = request.FILES["csv_file"]
        success_count = 0
        duplicate_count = 0
        error_count = 0
        duplicate_codes = []
        try:
            decoded_file = TextIOWrapper(csv_file.file, encoding='utf-8')
            # Read a sample to auto-detect delimiter
            sample = decoded_file.read(2048)
            decoded_file.seek(0)
            import csv
            sniffer = csv.Sniffer()
            try:
                dialect = sniffer.sniff(sample, delimiters=',;\t')
            except Exception:
                class SemiDialect(csv.Dialect):
                    delimiter = ';'
                    quotechar = '"'
                    doublequote = True
                    skipinitialspace = True
                    lineterminator = '\r\n'
                    quoting = csv.QUOTE_MINIMAL
                # Try semicolon as fallback, then comma
                try:
                    decoded_file.seek(0)
                    reader = csv.DictReader(decoded_file, delimiter=';')
                    headers = [h.strip().lower() for h in reader.fieldnames] if reader.fieldnames else []
                    if 'course_code' in headers and 'course_name' in headers:
                        pass # use this reader
                    else:
                        raise Exception('No semicolon header match')
                except Exception:
                    decoded_file.seek(0)
                    reader = csv.DictReader(decoded_file, delimiter=',')
            else:
                reader = csv.DictReader(decoded_file, dialect=dialect)
            # Normalize headers for robust matching
            import re
            def normalize_header(h):
                # Remove all whitespace and invisible characters, lowercase
                return re.sub(r"[\s\u00A0\u200B\u200C\u200D\uFEFF]+", "", h or "").lower()
            norm_headers = [normalize_header(h) for h in reader.fieldnames] if reader.fieldnames else []
            # Accept headers like 'course_code', 'course_code ', ' course_code', etc.
            def find_header(target):
                target_norm = normalize_header(target)
                for idx, h in enumerate(norm_headers):
                    if h == target_norm:
                        return reader.fieldnames[idx]
                return None
            code_col = find_header('course_code')
            name_col = find_header('course_name')
            if not code_col or not name_col:
                messages.error(request, "CSV must have 'course_code' and 'course_name' columns.")
                return redirect('masters:courses')
            for i, row in enumerate(reader, start=2):
                code = (row.get(code_col) or '').strip()
                name = (row.get(name_col) or '').strip()
                if not code or not name:
                    messages.error(request, f"Row {i}: Missing course_code or course_name.")
                    error_count += 1
                    continue
                if Course.objects.filter(course_code__iexact=code).exists():
                    duplicate_codes.append(code)
                    duplicate_count += 1
                    continue
                try:
                    Course.objects.create(course_code=code, course_name=name)
                    success_count += 1
                except Exception as e:
                    messages.error(request, f"Row {i}: Error saving course '{code}': {e}")
                    error_count += 1
            if success_count:
                messages.success(request, f"{success_count} course(s) uploaded successfully.")
            if duplicate_count:
                messages.warning(request, f"{duplicate_count} duplicate course code(s) skipped: {', '.join(duplicate_codes)}")
            if error_count and not (success_count or duplicate_count):
                messages.error(request, "No courses uploaded. Please check your CSV file.")
        except Exception as e:
            messages.error(request, f"Error importing CSV: {e}")
    else:
        messages.error(request, "No file uploaded.")
    return redirect('masters:courses')
@login_required
def coursereg(request):
    from operations.models import StudentCourse
    from .models import Course, Student
    courseregs = StudentCourse.objects.select_related('student', 'course').all()
    courses = Course.objects.order_by('course_code').all()
    academic_years = sorted(set(courseregs.values_list('academic_year', flat=True)))
    semesters = sorted(set(courseregs.values_list('semester', flat=True)), key=str)
    return render(request, "masters/coursereg.html", {
        "courseregs": courseregs,
        "courses": courses,
        "academic_years": academic_years,
        "semesters": semesters
    })

# ===== COURSE REGISTRATION CSV UPLOAD =====
from operations.models import StudentCourse
from .models import Student, Course
from django.db import transaction

@login_required
def coursereg_upload(request):
    if request.method == "POST" and request.FILES.get("csv_file"):
        import codecs
        csv_file = request.FILES["csv_file"]
        try:
            # Try to decode and split lines, handle encoding errors
            decoded = csv_file.read().decode("utf-8-sig").replace('\r','').splitlines()
        except Exception as e:
            messages.error(request, f"Could not read file: {e}")
            return redirect(request.META.get("HTTP_REFERER", "/"))
        # Try to auto-detect delimiter (tab or comma)
        import csv as pycsv
        sniffer = pycsv.Sniffer()
        try:
            dialect = sniffer.sniff('\n'.join(decoded[:2]))
            delimiter = dialect.delimiter
        except Exception:
            delimiter = ','
        reader = pycsv.DictReader(decoded, delimiter=delimiter)
        expected_fields = ["student_id", "course_code", "academic_year", "semester"]
        # Normalize fieldnames: strip, lower, remove extra spaces/tabs
        def norm(s):
            return s.strip().lower().replace(' ', '').replace('\t','')
        normalized_header = [norm(f) for f in (reader.fieldnames or [])]
        normalized_expected = [norm(f) for f in expected_fields]
        if normalized_header != normalized_expected:
            messages.error(request, f"CSV header mismatch. Expected: {', '.join(expected_fields)}. Found: {', '.join(reader.fieldnames or [])}")
            return redirect(request.META.get("HTTP_REFERER", "/"))

        new_rows = []
        duplicate_rows = []
        conflict_rows = []
        total = 0
        missing_student = []
        missing_course = []
        for row in reader:
            total += 1
            try:
                sid = (row.get("student_id") or '').strip()
                ccode = (row.get("course_code") or '').strip()
                ay = (row.get("academic_year") or '').strip()
                sem = (row.get("semester") or '').strip()
            except Exception as e:
                conflict_rows.append({"student_id": "", "course_code": "", "academic_year": "", "semester": "", "reason": f"Malformed row: {e}"})
                continue
            if not sid or not ccode or not ay or not sem:
                conflict_rows.append({"student_id": sid, "course_code": ccode, "academic_year": ay, "semester": sem, "reason": "Missing required value(s)"})
                continue
            try:
                student = Student.objects.get(student_id=sid)
            except Student.DoesNotExist:
                missing_student.append(sid)
                continue
            try:
                course = Course.objects.get(course_code=ccode)
            except Course.DoesNotExist:
                missing_course.append(ccode)
                continue
            exists = StudentCourse.objects.filter(student=student, course=course, academic_year=ay, semester=sem).exists()
            if exists:
                duplicate_rows.append(row)
                continue
            conflict = StudentCourse.objects.filter(student=student, course=course).exclude(academic_year=ay, semester=sem).first()
            if conflict:
                conflict_rows.append({
                    "student_id": sid,
                    "course_code": ccode,
                    "academic_year": ay,
                    "semester": sem,
                    "reason": "Student already registered for this course in another term",
                    "old_academic_year": conflict.academic_year,
                    "old_semester": conflict.semester
                })
                continue
            new_rows.append((student, course, ay, sem))

        # If any missing students or courses, show error and redirect back
        if missing_student:
            messages.error(request, f"No student(s) exist with ID(s): {', '.join(missing_student)}.")
            return redirect(request.META.get("HTTP_REFERER", "/"))
        if missing_course:
            messages.error(request, f"No course(s) exist with code(s): {', '.join(missing_course)}.")
            return redirect(request.META.get("HTTP_REFERER", "/"))

        # If the sheet is empty (no data rows), show error
        if total == 0:
            messages.error(request, "CSV file contains no data rows.")
            return redirect(request.META.get("HTTP_REFERER", "/"))

        # Insert new rows
        with transaction.atomic():
            for student, course, ay, sem in new_rows:
                StudentCourse.objects.create(student=student, course=course, academic_year=ay, semester=sem, is_active=True)

        # Prepare messages
        dup_count = len(duplicate_rows)
        new_count = len(new_rows)
        conf_count = len(conflict_rows)
        if conf_count > 0:
            # Show conflict page with details and use messages for notifications
            if dup_count > 0:
                messages.warning(request, f"{dup_count}/{total} found to be duplicate.")
            if new_count > 0:
                messages.success(request, f"{new_count}/{total} uploaded successfully.")
            if conf_count > 0:
                messages.error(request, f"{conf_count}/{total} found to have conflicts.")
            # Store conflicts in session for resolve view fallback
            request.session['coursereg_conflicts'] = conflict_rows
            return render(request, "masters/coursereg_conflict.html", {
                "conflicts": conflict_rows
            })
        # If all rows are duplicates (no new or conflict rows), show info message
        if dup_count == total and total > 0:
            messages.info(request, "No new data found. All the data uploaded already exists and matches exactly.")
        elif new_count > 0:
            messages.success(request, f"All {new_count} uploaded successfully.")
        elif dup_count > 0:
            messages.info(request, f"All {dup_count} found to be duplicate.")
        return redirect(request.META.get("HTTP_REFERER", "/"))
    # If not POST or no file, always return a response
    messages.error(request, "No file uploaded or invalid request.")
    return redirect(request.META.get("HTTP_REFERER", "/"))

# Final fallback to ensure HttpResponse is always returned
from django.http import HttpResponse
@login_required
def _coursereg_upload_fallback(*args, **kwargs):
    return HttpResponse("Unexpected error: No response returned.")

@login_required
def display_students(request):
    students = Student.objects.all()
    return render(request, "masters/student.html", {"students": students})

# ===== STUDENT CSV UPLOAD =====
@login_required
def student_upload(request):
    if request.method == "POST" and request.FILES.get("csv_file"):
        csv_file = request.FILES["csv_file"]
        success_count = 0
        try:
            decoded_file = TextIOWrapper(csv_file.file, encoding='utf-8')
            reader = csv.DictReader(decoded_file)
            if not reader.fieldnames:
                messages.error(request, "CSV file is missing headers.")
                return redirect("masters:student")
            def normalize(val):
                if not val:
                    return ""
                val = unicodedata.normalize("NFKC", val)
                val = re.sub(r"[\s\u00A0\u200B\u200C\u200D\uFEFF]+", " ", val)
                val = val.strip().lower()
                return val
            from .models import Department, Program, Batch
            from accounts.models import User
            dept_lookup = {normalize(d.dept_name): d for d in Department.objects.all()}
            program_lookup = {normalize(p.program_code): p for p in Program.objects.all()}
            batch_lookup = {normalize(b.batch_code): b for b in Batch.objects.all()}
            field_map = {k.strip().lower(): k for k in reader.fieldnames}
            dept_key = field_map.get("dept_name") or field_map.get("department")
            possible_program_keys = [k for k in reader.fieldnames if k.strip().lower() in ("program", "program_name")]
            batch_key = field_map.get("batch_code") or field_map.get("regulation")
            mismatches = []
            for i, row in enumerate(reader, start=2):
                student_id = row.get(field_map.get("student_id")) if field_map.get("student_id") else None
                phone_number = row.get(field_map.get("phone_number")) if field_map.get("phone_number") else None
                parent_phone_number = row.get(field_map.get("parent_phone_number")) if field_map.get("parent_phone_number") else None
                dept_name = row.get(dept_key) if dept_key else None
                program_name = None
                for k in possible_program_keys:
                    if row.get(k):
                        program_name = row.get(k)
                        break
                batch_code = row.get(batch_key) if batch_key else None
                row_has_error = False
                if not student_id:
                    messages.error(request, f"Row {i}: student_id is missing in the CSV.")
                    row_has_error = True
                else:
                    try:
                        user = User.objects.get(username=student_id)
                    except User.DoesNotExist:
                        messages.error(request, f"Row {i}: User with student_id '{student_id}' not found.")
                        row_has_error = True
                if not dept_name:
                    messages.error(request, f"Row {i}: Department name is missing in the CSV.")
                    row_has_error = True
                else:
                    norm_dept_name = normalize(dept_name)
                    dept = dept_lookup.get(norm_dept_name)
                    if not dept:
                        messages.error(request, f"Row {i}: Department '{dept_name}' not found.")
                        row_has_error = True
                if not program_name:
                    messages.error(request, f"Row {i}: Program name is missing in the CSV.")
                    row_has_error = True
                else:
                    norm_program_name = normalize(program_name)
                    program = program_lookup.get(norm_program_name)
                    if not program:
                        messages.error(request, f"Row {i}: Program '{program_name}' not found.")
                        row_has_error = True
                if not batch_code:
                    messages.error(request, f"Row {i}: Regulation/Batch code is missing in the CSV. Regulation is mandatory.")
                    row_has_error = True
                else:
                    norm_batch_code = normalize(batch_code)
                    batch = batch_lookup.get(norm_batch_code)
                    if not batch:
                        messages.error(request, f"Row {i}: Regulation/Batch code '{batch_code}' not found in the system. Please add the batch first.")
                        row_has_error = True
                if not row_has_error and student_id:
                    name = f"{user.first_name} {user.last_name}".strip()
                    email = user.email
                    from .models import Student
                    try:
                        student = Student.objects.get(student_id=student_id)
                        diffs = []
                        if student.std_name != name:
                            diffs.append(("Name", student.std_name, name))
                        if student.email != email:
                            diffs.append(("Email", student.email, email))
                        if student.phone_number != phone_number:
                            diffs.append(("Phone Number", student.phone_number, phone_number))
                        if student.parent_phone_number != parent_phone_number:
                            diffs.append(("Parent Phone Number", student.parent_phone_number, parent_phone_number))
                        if student.dept != dept:
                            diffs.append(("Department", student.dept.dept_name if student.dept else "", dept.dept_name if dept else ""))
                        if student.program != program:
                            diffs.append(("Program", student.program.program_name if student.program else "", program.program_name if program else ""))
                        if student.batch != batch:
                            diffs.append(("Regulation", student.batch.batch_code if student.batch else "", batch.batch_code if batch else ""))
                        if student.status != "ACTIVE":
                            diffs.append(("Status", student.status, "ACTIVE"))
                        if not diffs:
                            messages.warning(request, f"Student with ID '{student_id}' already exists.")
                        else:
                            mismatches.append({"student_id": student_id, "diffs": diffs})
                    except Student.DoesNotExist:
                        Student.objects.create(
                            student_id=student_id,
                            user=user,
                            std_name=name,
                            email=email,
                            phone_number=phone_number,
                            parent_phone_number=parent_phone_number,
                            dept=dept,
                            program=program,
                            batch=batch,
                            status="ACTIVE"
                        )
                        success_count += 1
            if success_count:
                messages.success(request, f"{success_count} students imported successfully.")
            if mismatches:
                request.session['student_mismatches'] = mismatches
                return redirect('masters:student_update_conflicts')
        except Exception as e:
            messages.error(request, f"Error importing CSV: {e}")
    else:
        messages.error(request, "No file uploaded.")
    return redirect("masters:student")


@login_required
def student_update_conflicts(request):
    mismatches = request.session.get('student_mismatches', [])
    if request.method == 'POST':
        selected_ids = request.POST.getlist('update_student')
        updated = []
        from .models import Student, Department, Program
        def normalize(val):
            if not val:
                return ""
            import unicodedata, re
            val = unicodedata.normalize("NFKC", val)
            val = re.sub(r"[\s\u00A0\u200B\u200C\u200D\uFEFF]+", " ", val)
            return val.strip().lower()

        if not mismatches:
            messages.error(request, "No student conflicts found to update.")
            return redirect('masters:student_update_conflicts')

        if not selected_ids:
            messages.warning(request, "No students selected for update.")
            return redirect('masters:student_update_conflicts')

        for mismatch in mismatches:
            student_id = mismatch['student_id']
            if student_id in selected_ids:
                student = Student.objects.get(student_id=student_id)
                for field, old, new in mismatch['diffs']:
                    if field == 'Name':
                        student.std_name = new
                    elif field == 'Email':
                        student.email = new
                    elif field == 'Phone Number':
                        student.phone_number = new
                    elif field == 'Parent Phone Number':
                        student.parent_phone_number = new
                    elif field == 'Department':
                        dept = Department.objects.filter(dept_name=new).first()
                        if dept:
                            student.dept = dept
                    elif field == 'Program':
                        program = Program.objects.filter(program_name=new).first()
                        if program:
                            student.program = program
                    elif field == 'Status':
                        student.status = new
                student.save()
                updated.append(student_id)
        if updated:
            for sid in updated:
                messages.success(request, f"{sid} - details updated successfully")
            if 'student_mismatches' in request.session:
                del request.session['student_mismatches']
            return redirect('masters:student')
        else:
            messages.info(request, "No selected students required updating.")
            return redirect('masters:student_update_conflicts')
    return render(request, "masters/student_update_conflicts.html", {"mismatches": mismatches})


@login_required
def faculty_update_conflicts(request):
    mismatches = request.session.get('faculty_mismatches', [])
    if request.method == 'POST':
        selected_ids = request.POST.getlist('update_faculty')
        updated = []
        from .models import Faculty, Department

        if not mismatches:
            messages.error(request, "No faculty conflicts found to update.")
            return redirect('masters:faculty_update_conflicts')

        if not selected_ids:
            messages.warning(request, "No faculty selected for update.")
            return redirect('masters:faculty_update_conflicts')

        for mismatch in mismatches:
            faculty_id = mismatch['faculty_id']
            if faculty_id in selected_ids:
                faculty = Faculty.objects.get(faculty_id=faculty_id)
                for field, old, new in mismatch['diffs']:
                    if field == 'Name':
                        faculty.faculty_name = new
                    elif field == 'Email':
                        pass
                    elif field == 'Phone Number':
                        faculty.phone_number = new
                    elif field == 'Department':
                        dept = Department.objects.filter(dept_name=new).first()
                        if dept:
                            faculty.dept = dept
                    elif field == 'Status':
                        faculty.status = new
                faculty.save()
                updated.append(faculty_id)
        if updated:
            for fid in updated:
                messages.success(request, f"{fid} - details updated successfully")
            if 'faculty_mismatches' in request.session:
                del request.session['faculty_mismatches']
            return redirect('masters:faculty')
        else:
            messages.info(request, "No selected faculty required updating.")
            return redirect('masters:faculty_update_conflicts')
    return render(request, "masters/faculty_update_conflicts.html", {"mismatches": mismatches})


# ===== ROOM CSV UPLOAD =====
def room_upload(request):
    if request.method == "POST" and request.FILES.get("csv_file"):
        csv_file = request.FILES["csv_file"]
        success_count = 0
        try:
            decoded_file = TextIOWrapper(csv_file.file, encoding='utf-8')
            reader = csv.DictReader(decoded_file)
            if not reader.fieldnames:
                messages.error(request, "CSV file is missing headers.")
                return redirect("masters:rooms")
            field_map = {k.strip().lower(): k for k in reader.fieldnames}
            required_fields = ["room_code", "block", "floor", "rows", "columns"]
            # Accept Room_id as room_code
            if "room_code" not in field_map and "room_id" in field_map:
                field_map["room_code"] = field_map["room_id"]
            for field in required_fields:
                if field not in field_map:
                    messages.error(request, f"CSV missing required column: {field}")
                    return redirect("masters:rooms")
            from .models import Room
            mismatches = []
            for i, row in enumerate(reader, start=2):
                code = (row.get(field_map["room_code"]) or '').strip()
                block = (row.get(field_map["block"]) or '').strip()
                floor = (row.get(field_map["floor"]) or '').strip()
                rows_val = (row.get(field_map["rows"]) or '').strip()
                columns_val = (row.get(field_map["columns"]) or '').strip()
                if not code or not block or not floor or not rows_val or not columns_val:
                    messages.error(request, f"Row {i}: Missing required room data.")
                    continue
                try:
                    room = Room.objects.get(room_code__iexact=code)
                    diffs = []
                    if str(room.rows) != rows_val:
                        diffs.append(("Rows", room.rows, rows_val))
                    if str(room.columns) != columns_val:
                        diffs.append(("Columns", room.columns, columns_val))
                    if (room.floor or "") != floor:
                        diffs.append(("Floor", room.floor, floor))
                    if (room.block or "") != block:
                        diffs.append(("Block", room.block, block))
                    if diffs:
                        mismatches.append({"room_code": code, "diffs": diffs})
                    else:
                        messages.warning(request, f"Row {i}: Room '{code}' already exists and matches.")
                except Room.DoesNotExist:
                    try:
                        Room.objects.create(
                            room_code=code,
                            block=block,
                            floor=floor,
                            rows=int(rows_val),
                            columns=int(columns_val)
                        )
                        success_count += 1
                    except Exception as e:
                        messages.error(request, f"Row {i}: Error saving room '{code}': {e}")
            if success_count:
                messages.success(request, f"{success_count} room(s) uploaded successfully.")
            if mismatches:
                request.session['room_mismatches'] = mismatches
                return redirect('masters:room_update_conflicts')
        except Exception as e:
            messages.error(request, f"Error importing CSV: {e}")
    else:
        messages.error(request, "No file uploaded.")
    return redirect("masters:rooms")


@login_required
def room_update_conflicts(request):
    mismatches = request.session.get('room_mismatches', [])
    if request.method == 'POST':
        selected_ids = request.POST.getlist('update_room')
        updated = []
        from .models import Room

        if not mismatches:
            messages.error(request, "No room conflicts found to update.")
            return redirect('masters:room_update_conflicts')

        if not selected_ids:
            messages.warning(request, "No rooms selected for update.")
            return redirect('masters:room_update_conflicts')

        for mismatch in mismatches:
            room_code = mismatch['room_code']
            if room_code in selected_ids:
                room = Room.objects.get(room_code=room_code)
                for field, old, new in mismatch['diffs']:
                    if field == 'Rows':
                        room.rows = int(new)
                    elif field == 'Columns':
                        room.columns = int(new)
                    elif field == 'Floor':
                        room.floor = new
                    elif field == 'Block':
                        room.block = new
                    # Capacity is auto-computed; do not set directly
                room.save()
                updated.append(room_code)
        if updated:
            for rc in updated:
                messages.success(request, f"{rc} - details updated successfully")
            if 'room_mismatches' in request.session:
                del request.session['room_mismatches']
            return redirect('masters:rooms')
        else:
            messages.info(request, "No selected rooms required updating.")
            return redirect('masters:room_update_conflicts')
    return render(request, "masters/room_update_conflicts.html", {"mismatches": mismatches})