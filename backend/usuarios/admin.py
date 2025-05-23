from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, CanalVenda

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ('username', 'first_name', 'email', 'tipo_user', 'id_vendedor', 'is_staff')

    
    fieldsets = UserAdmin.fieldsets + (
        ('Dados Comerciais', {
            'fields': ('tipo_user', 'canal', 'id_vendedor', 'primeiro_acesso', 'canais_permitidos')
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Dados Comerciais', {
            'fields': ('tipo_user', 'canal', 'id_vendedor', 'primeiro_acesso', 'canais_permitidos')
        }),
    )

@admin.register(CanalVenda)
class CanalVendaAdmin(admin.ModelAdmin):
    list_display = ('nome',)
