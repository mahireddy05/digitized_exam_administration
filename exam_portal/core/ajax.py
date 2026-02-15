from django.http import JsonResponse
from django.core.paginator import Paginator
from django.db.models import Q
from accounts.models import User
from masters.models import Batch, Department, Program

def users_ajax(request):
    # Get filter params
    search_fields = ["username", "email", "first_name", "last_name", "role"]
    q = Q()
    for field in search_fields:
        value = request.GET.get(field, "").strip()
        if value:
            q &= Q(**{f"{field}__icontains": value})

    users = User.objects.filter(q).order_by("username")
    page = int(request.GET.get("page", 1))
    paginator = Paginator(users, 25)
    page_obj = paginator.get_page(page)

    user_list = [
        {
            "username": u.username,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "role": u.role,
            "last_login": u.last_login.strftime('%Y-%m-%d %H:%M') if u.last_login else "",
        }
        for u in page_obj
    ]

    return JsonResponse({
        "users": user_list,
        "num_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "total_count": paginator.count,
    })

def batch_ajax(request):
    search_fields = ["batch_code", "admission_year", "grad_year", "status"]
    from django.db.models import Q
    q = Q()
    for field in search_fields:
        value = request.GET.get(field, "").strip()
        if value:
            q &= Q(**{f"{field}__icontains": value})
    batches = Batch.objects.filter(q).order_by("batch_code")
    page = int(request.GET.get("page", 1))
    from django.core.paginator import Paginator
    paginator = Paginator(batches, 25)
    page_obj = paginator.get_page(page)
    batch_list = [
        {
            "batch_code": b.batch_code,
            "admission_year": b.admission_year,
            "grad_year": b.grad_year,
            "status": b.status,
        }
        for b in page_obj
    ]
    return JsonResponse({
        "batches": batch_list,
        "num_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "total_count": paginator.count,
    })

def department_ajax(request):
    search_fields = ["dept_code", "dept_name", "is_active"]
    from django.db.models import Q
    q = Q()
    for field in search_fields:
        value = request.GET.get(field, "").strip()
        if value:
            q &= Q(**{f"{field}__icontains": value})
    departments = Department.objects.filter(q).order_by("dept_code")
    page = int(request.GET.get("page", 1))
    from django.core.paginator import Paginator
    paginator = Paginator(departments, 25)
    page_obj = paginator.get_page(page)
    dept_list = [
        {
            "dept_code": d.dept_code,
            "dept_name": d.dept_name,
            "is_active": "Active" if d.is_active else "Inactive",
        }
        for d in page_obj
    ]
    return JsonResponse({
        "departments": dept_list,
        "num_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "total_count": paginator.count,
    })

def program_ajax(request):
    search_fields = ["program_code", "program_name", "is_active"]
    from django.db.models import Q
    q = Q()
    for field in search_fields:
        value = request.GET.get(field, "").strip()
        if value:
            q &= Q(**{f"{field}__icontains": value})
    programs = Program.objects.filter(q).order_by("program_code")
    page = int(request.GET.get("page", 1))
    from django.core.paginator import Paginator
    paginator = Paginator(programs, 25)
    page_obj = paginator.get_page(page)
    prog_list = [
        {
            "program_code": p.program_code,
            "program_name": p.program_name,
            "is_active": "Active" if p.is_active else "Inactive",
        }
        for p in page_obj
    ]
    return JsonResponse({
        "programs": prog_list,
        "num_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "total_count": paginator.count,
    })
