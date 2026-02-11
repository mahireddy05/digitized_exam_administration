from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("username", "email", "first_name", "last_name", "user_code", "role", "is_staff", "is_active")
    list_filter = ("role", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "user_code")
    ordering = ("username",)

    # keep date_joined, last_login readonly (admin won't try to edit)
    readonly_fields = ("last_login", "date_joined")

    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Role & Code", {"fields": ("role", "user_code")}),
    )

    add_fieldsets = DjangoUserAdmin.add_fieldsets + (
        ("Role & Code", {"fields": ("role", "user_code")}),
    )
