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
    readonly_fields = ('tm', 'recorrencia', 'total_geral')

    fieldsets = (
        ('Informações do Parceiro', {
            'fields': (
                'codigo',
                'parceiro',
                'classificacao',
                'consultor',
                'canal_venda',  # mostrado como "Unidade" no display abaixo
                'cidade',
                'uf',
            )
        }),
        ('Faturamento Calculado (Somente Leitura)', {
            'fields': (
                'tm',
                'recorrencia',
                'total_geral',
            )
        }),
    )

    def formfield_for_dbfield(self, db_field, **kwargs):
        field = super().formfield_for_dbfield(db_field, **kwargs)
        if db_field.name == 'canal_venda':
            field.label = 'Unidade'
        return field


admin.site.register(CanalVenda)
