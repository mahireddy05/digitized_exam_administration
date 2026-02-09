from django.urls import path
from . import views

app_name = "operations"

urlpatterns = [
    path("attendence/", views.attendence, name="attendence"),
    path("exams/", views.exams, name="exams"),
    path("roomalloc/", views.roomalloc, name="roomalloc"),
    path("roomalloc/content/", views.roomalloc_content, name="roomalloc_content"),
    path("report/", views.report, name="report"),
]
