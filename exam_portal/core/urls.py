from django.urls import path
from . import views

app_name = "core"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("notifications/", views.notifications, name="notifications"),
    path("settings/", views.settings_view, name="settings"),
    path("settings/upload_departments/", views.upload_departments, name="upload_departments"),
    path("settings/upload_programs/", views.upload_programs, name="upload_programs"),
    path("settings/upload_users/", views.upload_users, name="upload_users"),
]
