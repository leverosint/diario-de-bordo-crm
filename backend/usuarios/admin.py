from django.contrib import admin
from .models import CustomUser, CanalVenda, Parceiro
from django.contrib.auth.admin import UserAdmin
@admin.register(Parceiro)
class ParceiroAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'parceiro', 'cidade', 'uf', 'canal_venda')
    search_fields = ('codigo', 'parceiro', 'cidade', 'consultor')
    list_filter = ('canal_venda', 'uf', 'classificacao')

    def get_readonly_fields(self, request, obj=None):
        if not obj:
            return ('tm', 'recorrencia', 'total_geral')
        readonly = ['tm', 'recorrencia', 'total_geral']
        meses = [
            'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
            'janeiro_2', 'fevereiro_2', 'marco_2'
        ]
        for mes in meses:
            valor = getattr(obj, mes, 0)
            if valor and valor != 0:
                readonly.append(mes)
        return readonly

    fieldsets = (
        ('Informações do Parceiro', {
            'fields': (
                'codigo',
                'parceiro',
                'classificacao',
                'consultor',
                'canal_venda',
                'cidade',
                'uf',
            )
        }),
        ('Faturamento Mensal', {
            'fields': (
                'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
                'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
                'janeiro_2', 'fevereiro_2', 'marco_2',
            )
        }),
        ('Totais e Cálculos (Somente Leitura)', {
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
        if db_field.name in [
            'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
            'janeiro_2', 'fevereiro_2', 'marco_2',
            'tm', 'total_geral'
        ]:
            field.widget.attrs['style'] = 'width: 200px'
        return field
