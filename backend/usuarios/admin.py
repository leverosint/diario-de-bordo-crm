from django.contrib import admin
from .models import CustomUser, CanalVenda, Parceiro
from django.contrib.auth.admin import UserAdmin

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'tipo_user', 'id_vendedor', 'exibir_canais')
    fieldsets = UserAdmin.fieldsets + (
        ('Informações Adicionais', {
            'fields': ('tipo_user', 'id_vendedor', 'primeiro_acesso', 'canais_venda')
        }),
    )
    filter_horizontal = ('canais_venda',)

    def exibir_canais(self, obj):
        return ", ".join([c.nome for c in obj.canais_venda.all()])
    exibir_canais.short_description = 'Canais de Venda'

@admin.register(Parceiro)
class ParceiroAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'parceiro', 'cidade', 'uf', 'canal_venda')
    search_fields = ('codigo', 'parceiro', 'cidade', 'consultor')
    list_filter = ('canal_venda', 'uf', 'classificacao')

admin.site.register(CanalVenda)
