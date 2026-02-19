from django.views.decorators.http import require_GET

# AJAX endpoint to get course details for a slot
@require_GET
def ajax_slot_courses(request):
    from operations.models import Exam, ExamSlot, StudentExamMap
    from masters.models import Course
    slot_id = request.GET.get('slot_id')
    if not slot_id:
        return JsonResponse({'success': False, 'error': 'Missing slot_id'})
    try:
        slot = ExamSlot.objects.get(id=slot_id)
    except ExamSlot.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Slot not found'})
    exams = Exam.objects.filter(exam_slot=slot).select_related('course')
    course_list = []
    for exam in exams:
        course = exam.course
        if not course:
            continue
        student_count = StudentExamMap.objects.filter(exam=exam).count()
        course_list.append({
            'course_code': course.course_code,
            'course_name': course.course_name,
            'regulation': getattr(course, 'regulation', ''),
            'student_count': student_count,
            'academic_year': getattr(exam, 'academic_year', ''),
            'semester': getattr(exam, 'semester', ''),
        })
    slot_info = {
        'exam_type': slot.exam_type,
        'mode': slot.mode,
        'exam_date': slot.exam_date.strftime('%Y-%m-%d'),
        'start_time': slot.start_time.strftime('%H:%M'),
        'end_time': slot.end_time.strftime('%H:%M'),
        'slot_code': slot.slot_code,
    }
    return JsonResponse({'success': True, 'slot': slot_info, 'courses': course_list})
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Examinations

# AJAX endpoint to edit an examination
@csrf_exempt
def ajax_edit_examination(request):
    import json
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method.'})
    try:
        data = json.loads(request.body.decode('utf-8'))
        exam_id = data.get('exam_id')
        exam_name = data.get('examname', '').strip()
        start_date = data.get('start_date', '').strip()
        end_date = data.get('end_date', '').strip()
        if not exam_id or not exam_name or not start_date or not end_date:
            return JsonResponse({'success': False, 'error': 'All fields are required.'})
        exam = Examinations.objects.filter(id=exam_id).first()
        if not exam:
            return JsonResponse({'success': False, 'error': 'Examination not found.'})
        # Validate date order
        from datetime import datetime
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d").date()
            end_dt = datetime.strptime(end_date, "%Y-%m-%d").date()
        except Exception:
            return JsonResponse({'success': False, 'error': 'Invalid date format.'})
        if start_dt >= end_dt:
            return JsonResponse({'success': False, 'error': 'Start date must be before end date.'})
        # Check for duplicate exam name (case-insensitive) with same dates (excluding self)
        exists = Examinations.objects.filter(
            exam_name__iexact=exam_name,
            start_date=start_date,
            end_date=end_date
        ).exclude(id=exam_id).exists()
        if exists:
            return JsonResponse({'success': False, 'error': 'Another examination with this name and dates exists.'})
        exam.exam_name = exam_name
        exam.start_date = start_date
        exam.end_date = end_date
        exam.save()
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction

# AJAX endpoint to delete an examination and all related slots and exams
@csrf_exempt
def ajax_delete_examination(request):
    from .models import Examinations, ExamSlot, Exam, StudentExamMap
    import json
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Invalid request method.'})
    try:
        data = json.loads(request.body.decode('utf-8'))
        slot_id = data.get('slot_id')
        exam_id = data.get('exam_id')
        with transaction.atomic():
            if slot_id:
                slot = ExamSlot.objects.filter(id=slot_id).first()
                if not slot:
                    return JsonResponse({'success': False, 'error': 'Slot not found.'})
                exams = Exam.objects.filter(exam_slot=slot)
                for ex in exams:
                    StudentExamMap.objects.filter(exam=ex).delete()
                exams.delete()
                slot.delete()
                return JsonResponse({'success': True})
            elif exam_id:
                exam = Examinations.objects.filter(id=exam_id).first()
                if not exam:
                    return JsonResponse({'success': False, 'error': 'Examination not found.'})
                slots = ExamSlot.objects.filter(examination=exam)
                for slot in slots:
                    exams = Exam.objects.filter(exam_slot=slot)
                    for ex in exams:
                        StudentExamMap.objects.filter(exam=ex).delete()
                    exams.delete()
                slots.delete()
                exam.delete()
                return JsonResponse({'success': True})
            else:
                return JsonResponse({'success': False, 'error': 'Missing exam_id or slot_id.'})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})
from django.http import JsonResponse
from .models import ExamSlot

def ajax_exam_slots(request):
    exam_id = request.GET.get('exam_id')
    slots = []
    if exam_id:
        from operations.models import Exam, StudentExamMap
        slot_qs = ExamSlot.objects.filter(examination_id=exam_id).order_by('-exam_date', '-start_time')
        for slot in slot_qs:
            exams = Exam.objects.filter(exam_slot=slot)
            course_count = exams.count()
            student_count = StudentExamMap.objects.filter(exam__in=exams).count() if course_count else 0
            if course_count:
                assignment_status = "Assigned"
            else:
                assignment_status = "Pending"
            slots.append({
                'id': slot.id,
                'exam_type': slot.exam_type,
                'mode': slot.mode,
                'exam_date': slot.exam_date.strftime('%Y-%m-%d'),
                'start_time': slot.start_time.strftime('%H:%M'),
                'end_time': slot.end_time.strftime('%H:%M'),
                'slot_code': slot.slot_code,
                'assignment_status': assignment_status,
                'course_count': course_count,
                'student_count': student_count,
            })
    return JsonResponse({'slots': slots})
from django.http import JsonResponse
from operations.models import StudentCourse
from masters.models import Course
from django.db.models import Count

def ajax_exam_scheduling_groups(request):
    academic_year = request.GET.get('academic_year', '')
    semester = request.GET.get('semester', '')
    regulation = request.GET.get('regulation', '')
    slot_id = request.GET.get('slot_id', '')
    from operations.models import Exam, StudentExamMap, ExamSlot
    reg_qs = StudentCourse.objects.select_related('student', 'course')
    if academic_year:
        reg_qs = reg_qs.filter(academic_year=academic_year)
    if semester:
        reg_qs = reg_qs.filter(semester=semester)
    if regulation:
        reg_qs = reg_qs.filter(student__batch__batch_code=regulation)
    groups = {}
    slot = None
    scheduled_courses = set()
    if slot_id:
        try:
            slot = ExamSlot.objects.get(id=slot_id)
            # Get all courses already scheduled for any slot in the same examination
            from operations.models import Exam
            all_slots = ExamSlot.objects.filter(examination=slot.examination)
            scheduled_courses = set(Exam.objects.filter(exam_slot__in=all_slots).values_list('course__course_code', flat=True))
        except:
            slot = None
    for reg in reg_qs:
        batch = getattr(reg.student.batch, 'batch_code', 'N/A')
        key = (reg.course.course_code, batch, reg.academic_year, reg.semester)
        # Skip if course is already scheduled for this slot
        if reg.course.course_code in scheduled_courses:
            continue
        if key not in groups:
            groups[key] = {
                'course_code': reg.course.course_code,
                'course_name': reg.course.course_name,
                'regulation': batch,
                'academic_year': reg.academic_year,
                'semester': reg.semester,
                'student_count': 0,
                'clash': False,
                'student_ids': []
            }
        groups[key]['student_count'] += 1
        groups[key]['student_ids'].append(reg.student_id)
    # Detect clashes: if any student in group has another exam in same slot
    if slot:
        # Build a set of all students already scheduled in this slot
        from operations.models import StudentExamMap, Exam
        exams_in_slot = Exam.objects.filter(exam_slot=slot)
        scheduled_students = set(StudentExamMap.objects.filter(exam__in=exams_in_slot).values_list('student_id', flat=True))
        # Remove groups where any student would clash
        filtered_groups = []
        for group in groups.values():
            course_code = group['course_code']
            regulation = group['regulation']
            academic_year = group['academic_year']
            semester = group['semester']
            students = StudentCourse.objects.filter(
                course__course_code=course_code,
                academic_year=academic_year,
                semester=semester,
                student__batch__batch_code=regulation
            ).values_list('student_id', flat=True)
            # If any student in this group is already scheduled in this slot, skip this group
            if any(s in scheduled_students for s in students):
                continue
            filtered_groups.append(group)
        return JsonResponse({'groups': filtered_groups})
    return JsonResponse({'groups': list(groups.values())})

def ajax_exam_filters(request):
    courseregs = StudentCourse.objects.all()
    academic_years = sorted(set(courseregs.values_list('academic_year', flat=True)))
    semesters = sorted(set(courseregs.values_list('semester', flat=True)), key=str)
    regulations = sorted(set(courseregs.values_list('student__batch__batch_code', flat=True)))
    return JsonResponse({'academic_years': academic_years, 'semesters': semesters, 'regulations': regulations})
