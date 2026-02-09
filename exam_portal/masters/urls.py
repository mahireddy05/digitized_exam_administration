from django.urls import path
from . import views

app_name = "masters"

urlpatterns = [
    # STUDENT
    path("student/", views.student, name="student"),
    path("student/content/", views.student_content, name="student_content"),
    path("student/<int:pk>/detail/", views.student_detail, name="student_detail"),
    path("student/<int:pk>/edit/", views.student_edit, name="student_edit"),
    path("student/<int:pk>/delete/", views.student_delete, name="student_delete"),

    # FACULTY
    path("faculty/", views.faculty, name="faculty"),
    path("faculty/content/", views.faculty_content, name="faculty_content"),
    path("faculty/<int:pk>/detail/", views.faculty_detail, name="faculty_detail"),
    path("faculty/<int:pk>/detail_content/", views.faculty_detail_content, name="faculty_detail_content"),
    path("faculty/<int:pk>/edit/", views.faculty_edit, name="faculty_edit"),
    path("faculty/<int:pk>/delete/", views.faculty_delete, name="faculty_delete"),

    # ROOMS
    path("rooms/", views.rooms, name="rooms"),
    path("rooms/content/", views.rooms_content, name="rooms_content"),
    path("rooms/<int:pk>/detail/", views.room_detail, name="room_detail"),
    path("rooms/<int:pk>/detail_content/", views.room_detail_content, name="room_detail_content"),
    path("rooms/<int:pk>/edit/", views.room_edit, name="room_edit"),
    path("rooms/<int:pk>/delete/", views.room_delete, name="room_delete"),

    # COURSES
    path("courses/", views.courses, name="courses"),

    # COURSE REGISTRATION
    path("coursereg/", views.coursereg, name="coursereg"),
]
