from django.shortcuts import render

# ===== STUDENTS =====
def student(request):
    return render(request, "masters/student.html")

def student_content(request):
    return render(request, "masters/student_content.html")

def student_detail(request, pk):
    return render(request, "masters/student_detail.html", {"pk": pk})

def student_edit(request, pk):
    return render(request, "masters/student_edit.html", {"pk": pk})

def student_delete(request, pk):
    return render(request, "masters/student_delete.html", {"pk": pk})

# ===== FACULTY =====
def faculty(request):
    return render(request, "masters/faculty.html")

def faculty_content(request):
    return render(request, "masters/faculty_content.html")

def faculty_detail(request, pk):
    return render(request, "masters/faculty_detail.html", {"pk": pk})

def faculty_detail_content(request, pk):
    return render(request, "masters/faculty_detail_content.html", {"pk": pk})

def faculty_edit(request, pk):
    return render(request, "masters/faculty_edit.html", {"pk": pk})

def faculty_delete(request, pk):
    return render(request, "masters/faculty_delete.html", {"pk": pk})

# ===== ROOMS =====
def rooms(request):
    return render(request, "masters/rooms.html")

def rooms_content(request):
    return render(request, "masters/rooms_content.html")

def room_detail(request, pk):
    return render(request, "masters/room_detail.html", {"pk": pk})

def room_detail_content(request, pk):
    return render(request, "masters/room_detail_content.html", {"pk": pk})

def room_edit(request, pk):
    return render(request, "masters/room_edit.html", {"pk": pk})

def room_delete(request, pk):
    return render(request, "masters/room_delete.html", {"pk": pk})

# ===== COURSES =====
def courses(request):
    return render(request, "masters/courses.html")

# ===== COURSE REGISTRATION =====
def coursereg(request):
    return render(request, "masters/coursereg.html")
