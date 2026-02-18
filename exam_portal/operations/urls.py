from django.urls import path
from . import views, ajax

app_name = "operations"

urlpatterns = [
    path("attendence/", views.attendence, name="attendence"),
    path("exams/", views.exams, name="exams"),
    path("roomalloc/", views.roomalloc, name="roomalloc"),
    path("roomalloc/content/", views.roomalloc_content, name="roomalloc_content"),
    path("report/", views.report, name="report"),
    path("exam-scheduling/<int:slot_id>/", views.exam_scheduling, name="schedule_exam"),
    path("ajax/exam-scheduling/groups/", ajax.ajax_exam_scheduling_groups, name="ajax_exam_scheduling_groups"),
    path("ajax/exam-scheduling/filters/", ajax.ajax_exam_filters, name="ajax_exam_filters"),
    path("ajax_exam_slots/", ajax.ajax_exam_slots, name="ajax_exam_slots"),
    path("examination/", views.examination, name="examination"),
    path("ajax/examinations/", views.ajax_examinations, name="ajax_examinations"),
    path("ajax/delete-examination/", ajax.ajax_delete_examination, name="ajax_delete_examination"),
    path("ajax/edit-examination/", ajax.ajax_edit_examination, name="ajax_edit_examination"),
]
