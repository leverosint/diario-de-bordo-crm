from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'first_name', 'email', 'tipo_user', 'canal', 'id_vendedor', 'is_staff')
    fieldsets = UserAdmin.fieldsets + (
        ('Dados Comerciais', {
            'fields': ('tipo_user', 'canal', 'id_vendedor', 'primeiro_acesso')
        }),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Dados Comerciais', {
            'fields': ('tipo_user', 'canal', 'id_vendedor', 'primeiro_acesso')
        }),
    )
