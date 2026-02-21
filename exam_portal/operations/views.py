from django.http import JsonResponse
from django.core.paginator import Paginator
from django.contrib.auth.decorators import login_required

def ajax_examinations(request):
    from .models import Examinations
    page = int(request.GET.get('page', 1))
    per_page = 10
    exams = Examinations.objects.order_by('-start_date', '-end_date', 'exam_name')
    paginator = Paginator(exams, per_page)
    page_obj = paginator.get_page(page)
    results = []
    for idx, exam in enumerate(page_obj.object_list, start=1 + (page_obj.number-1)*per_page):
        results.append({
            'number': idx,
            'exam_id': exam.id,
            'exam_name': exam.exam_name,
            'academic_year': getattr(exam, 'academic_year', ''),
            'semester': getattr(exam, 'semester', ''),
            'start_date': exam.start_date.strftime('%Y-%m-%d'),
            'end_date': exam.end_date.strftime('%Y-%m-%d'),
        })
    return JsonResponse({
        'results': results,
        'page': page_obj.number,
        'num_pages': paginator.num_pages,
        'total': paginator.count
    })
@login_required
def examination(request):
    from .models import Examinations
    import datetime
    today = datetime.date.today()
    from .models import StudentCourse
    acd_years = StudentCourse.objects.values_list('academic_year', flat=True).distinct().order_by('academic_year')
    semesters = StudentCourse.objects.values_list('semester', flat=True).distinct().order_by('semester')
    if request.method == "POST":
        exam_name = request.POST.get("examname", "").strip()
        academic_year = request.POST.get("academic_year", "").strip()
        semester = request.POST.get("semester", "").strip()
        start_date = request.POST.get("start_date", "").strip()
        end_date = request.POST.get("end_date", "").strip()
        form_data = {
            'examname': exam_name,
            'academic_year': academic_year,
            'semester': semester,
            'start_date': start_date,
            'end_date': end_date
        }
        # Validate all fields present
        if not exam_name or not academic_year or not semester or not start_date or not end_date:
            messages.error(request, "Provide all fields.")
            return render(request, "operations/examination.html", {"form_data": form_data, "today": today, "acd_years": acd_years, "semesters": semesters})
        # Validate date order
        try:
            start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
            end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
        except Exception:
            messages.error(request, "Invalid date format.")
            return render(request, "operations/examination.html", {"form_data": form_data, "today": today, "acd_years": acd_years, "semesters": semesters})
        if start_dt < today:
            messages.error(request, "Start date must be today or a future date.")
            return render(request, "operations/examination.html", {"form_data": form_data, "today": today, "acd_years": acd_years, "semesters": semesters})
        if start_dt >= end_dt:
            messages.error(request, "Start date must be before end date.")
            return render(request, "operations/examination.html", {"form_data": form_data, "today": today, "acd_years": acd_years, "semesters": semesters})
        # Check for duplicate exam name (case-insensitive) with same dates and academic year/semester
        existing_exam = Examinations.objects.filter(
            exam_name__iexact=exam_name,
            academic_year=academic_year,
            semester=semester,
            start_date=start_date,
            end_date=end_date
        ).first()
        if existing_exam:
            messages.error(request, "An exam with the same name, academic year, semester, and dates already exists.")
            return render(request, "operations/examination.html", {"form_data": form_data, "today": today, "acd_years": acd_years, "semesters": semesters})
        # Save to DB
        try:
            Examinations.objects.create(
                exam_name=exam_name,
                academic_year=academic_year,
                semester=semester,
                start_date=start_date,
                end_date=end_date
            )
            messages.success(request, "Exam dates declared successfully.")
            return render(request, "operations/examination.html", {"form_data": {}, "today": today, "acd_years": acd_years, "semesters": semesters})
        except Exception as e:
            messages.error(request, f"Error saving examination: {e}")
            return render(request, "operations/examination.html", {"form_data": form_data, "today": today})
    return render(request, "operations/examination.html", {"form_data": {}, "today": today, "acd_years": acd_years, "semesters": semesters})
from django.shortcuts import render
from django.contrib import messages
from .models import ExamSlot, Exam

def attendence(request):
    return render(request, "operations/attendence.html")

@login_required
def exams(request):
    from .models import Exam
    slot_list = ExamSlot.objects.all().order_by('-exam_date', '-start_time')
    # Build a dict of slot_id to status
    exam_status = {}
    for slot in slot_list:
        if Exam.objects.filter(exam_slot=slot).exists():
            exam_status[slot.id] = 'Created'
        else:
            exam_status[slot.id] = 'Pending'

    # Get examname from Examinations table using exam_id from GET parameters
    exam_id = request.GET.get('exam_id')
    examname = ''
    if exam_id:
        try:
            from .models import Examinations
            exam_obj = Examinations.objects.filter(id=exam_id).first()
            if exam_obj:
                examname = exam_obj.exam_name
        except Exception:
            examname = ''
    q_start_date = request.GET.get('start_date') or request.POST.get('start_date') or ''
    q_end_date = request.GET.get('end_date') or request.POST.get('end_date') or ''
    if request.method == "POST":
        exam_id = request.POST.get("exam_id", "").strip()
        exam_name = request.POST.get("examname", "").strip()
        exam_type = request.POST.get("examtype", "")
        mode = request.POST.get("mode", "")
        exam_date = request.POST.get("exam_date", "")
        start_time = request.POST.get("starttime", "")
        end_time = request.POST.get("endtime", "")
        slot_code = request.POST.get("slot_code", "")
        form_data = dict(request.POST)
        form_data['examname'] = exam_name or examname
        # Basic validation
        required_fields = {
            'Exam Name': exam_name,
            'Exam Type': exam_type,
            'Mode': mode,
            'Exam Date': exam_date,
            'Start Time': start_time,
            'End Time': end_time,
            'Slot Code': slot_code
        }
        missing = [name for name, value in required_fields.items() if not value]
        if missing:
            formatted = '\n'.join([f"- {field}" for field in missing])
            messages.error(request, f"Please fill the following required fields:\n{formatted}")
            return render(request, "operations/exams.html", {
                'form_data': form_data,
                'slot_list': slot_list,
                'exam_status': exam_status,
                'examname': examname,
                'q_start_date': q_start_date,
                'q_end_date': q_end_date
            })

        import datetime
        today = datetime.date.today()
        try:
            exam_date_obj = datetime.datetime.strptime(exam_date, "%Y-%m-%d").date()
        except ValueError:
            messages.error(request, "Invalid exam date format.")
            return render(request, "operations/exams.html", {
                'form_data': form_data,
                'slot_list': slot_list,
                'exam_status': exam_status,
                'examname': examname,
                'q_start_date': q_start_date,
                'q_end_date': q_end_date
            })
        if exam_date_obj < today:
            messages.error(request, "Exam date must be today or later.")
            return render(request, "operations/exams.html", {
                'form_data': form_data,
                'slot_list': slot_list,
                'exam_status': exam_status,
                'examname': examname,
                'q_start_date': q_start_date,
                'q_end_date': q_end_date
            })

        try:
            start_time_obj = datetime.datetime.strptime(start_time, "%H:%M").time()
            end_time_obj = datetime.datetime.strptime(end_time, "%H:%M").time()
        except ValueError:
            messages.error(request, "Invalid time format.")
            return render(request, "operations/exams.html", {
                'form_data': request.POST
            })
        if start_time_obj >= end_time_obj:
            messages.error(request, "Start time should be before end time.")
            return render(request, "operations/exams.html", {
                'form_data': request.POST
            })
        # Map frontend values to model choices
        exam_type_map = {
            "Theoretical": "REGULAR",
            "Practical": "SUPPLY",
            "Viva": "IMPROVEMENT",
            "Quiz": "REGULAR",
            "Assignment": "SUPPLY"
        }
        mode_map = {
            "Offline": "THEORY",
            "Online": "PRACTICAL",
            "Hybrid": "THEORY"
        }
        slot_code_map = {
            "FN": "FN",
            "AN": "AN",
            "AM": "FN",
            "PM": "AN",
            "EVENING": "AN"
        }
        exam_type_db = exam_type_map.get(exam_type, "REGULAR")
        mode_db = mode_map.get(mode, "THEORY")
        slot_code_db = slot_code_map.get(slot_code, "FN")
        try:
            from .models import Examinations
            exam_obj = None
            if exam_id:
                exam_obj = Examinations.objects.filter(id=exam_id).first()
            elif exam_name:
                exam_obj = Examinations.objects.filter(exam_name=exam_name).first()
            # 1. Create ExamSlot and link to Examinations
            slot = ExamSlot(
                examination=exam_obj,
                exam_type=exam_type_db,
                mode=mode_db,
                exam_date=exam_date,
                start_time=start_time,
                end_time=end_time,
                slot_code=slot_code_db
            )
            slot.save()
            messages.success(request, "Exam slot created successfully.")
        except Exception as e:
            if 'Duplicate entry' in str(e) and 'uq_exam_slot_time' in str(e):
                messages.error(request, "An exam slot with the same date, start time, end time, and slot code already exists. Please choose a different time or slot.")
            else:
                messages.error(request, f"Error creating exam slot: {str(e)}")
    slot_list = ExamSlot.objects.all().order_by('-exam_date', '-start_time')
    form_data = {'examname': examname}
    return render(request, "operations/exams.html", {
        'form_data': form_data,
        'slot_list': slot_list,
        'exam_status': exam_status,
        'examname': examname,
        'q_start_date': q_start_date,
        'q_end_date': q_end_date
    })

def roomalloc(request):
    return render(request, "operations/roomalloc.html")

@login_required
def roomalloc_content(request):
    return render(request, "operations/roomalloc_content.html")

def report(request):
    return render(request, "operations/report.html")

@login_required
def exam_scheduling(request, slot_id):
    from operations.models import StudentCourse, Exam
    from masters.models import Course
    slot = ExamSlot.objects.get(id=slot_id)
    # Handle POST for scheduling selected groups
    if request.method == "POST":
        selected = request.POST.getlist('selected_groups')
        created = 0
        from operations.models import StudentExamMap, StudentCourse
        for group in selected:
            # group format: course_code|regulation|academic_year|semester
            try:
                course_code, regulation, academic_year, semester = group.split('|')
                course = Course.objects.get(course_code=course_code)
                exam = Exam.objects.create(
                    exam_slot=slot,
                    course=course,
                    academic_year=academic_year,
                    semester=semester,
                    regulation=regulation
                )
                # Find students registered for this course, regulation, year, semester
                students = StudentCourse.objects.filter(
                    course=course,
                    academic_year=academic_year,
                    semester=semester,
                    student__batch__batch_code=regulation
                ).select_related('student')
                for reg in students:
                    StudentExamMap.objects.create(
                        exam=exam,
                        student=reg.student,
                        attempt_type="REGULAR",
                        status="REGISTERED"
                    )
                created += 1
            except Exception as e:
                import logging
                logging.exception(f"Error scheduling exam for group {group}: {e}")
                messages.error(request, f"Error scheduling exam for group {group}: {e}")
        if created:
            messages.success(request, f"Scheduled {created} exam(s) successfully.")
        else:
            messages.error(request, "No exams were scheduled. Please try again.")
    # Only fetch filter values for dropdowns
    courseregs = StudentCourse.objects.all()
    academic_years = sorted(set(courseregs.values_list('academic_year', flat=True)))
    semesters = sorted(set(courseregs.values_list('semester', flat=True)), key=str)
    regulations = sorted(set(courseregs.values_list('student__batch__batch_code', flat=True)))
    exam_name = slot.examination.exam_name if slot.examination else ''
    return render(request, "operations/exam_scheduling.html", {
        'slot': slot,
        'exam_name': exam_name,
        'academic_years': academic_years,
        'semesters': semesters,
        'regulations': regulations,
    })
