from django.shortcuts import render

def dashboard(request):
    return render(request, "core/dashboard.html")

def notifications(request):
    return render(request, "core/notifications.html")

def settings_view(request):
    return render(request, "core/settings.html")