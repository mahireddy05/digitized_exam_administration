from django.shortcuts import render

def attendence(request):
    return render(request, "operations/attendence.html")

def exams(request):
    return render(request, "operations/exams.html")

def roomalloc(request):
    return render(request, "operations/roomalloc.html")

def roomalloc_content(request):
    return render(request, "operations/roomalloc_content.html")

def report(request):
    return render(request, "operations/report.html")
