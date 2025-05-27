from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, CanalVenda, Parceiro


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


@admin.register(CanalVenda)
class CanalVendaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome')
    search_fields = ('nome',)


@admin.register(Parceiro)
class ParceiroAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'parceiro', 'cidade', 'uf', 'canal_venda')
    search_fields = ('codigo', 'parceiro', 'cidade', 'consultor')
    list_filter = ('canal_venda', 'uf', 'classificacao')

    def get_readonly_fields(self, request, obj=None):
        if obj is None:
            return []

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
                'canal_venda',  # exibido como "Unidade" visualmente
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
        return field
