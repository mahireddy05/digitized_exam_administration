from django.urls import path

from django.shortcuts import redirect
from . import views

app_name = "core"

def root_redirect(request):
    if request.user.is_authenticated:
        return redirect('core:dashboard')
    return redirect('accounts:login')

urlpatterns = [
    path("", root_redirect, name="root"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("notifications/", views.notifications, name="notifications"),
    path("settings/", views.settings_view, name="settings"),
    path("settings/upload_departments/", views.upload_departments, name="upload_departments"),
    path("settings/upload_programs/", views.upload_programs, name="upload_programs"),
    path("settings/upload_users/", views.upload_users, name="upload_users"),
    path("settings/dept_conflict/", views.dept_conflict, name="dept_conflict"),
    path("settings/program_conflict/", views.program_conflict, name="program_conflict"),
    path("settings/user_conflict/", views.user_conflict, name="user_conflict"),
]
