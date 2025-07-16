from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, CanalVenda, Parceiro, InteracaoGerada

# Admin do usuário
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


# Admin de Canal de Venda
@admin.register(CanalVenda)
class CanalVendaAdmin(admin.ModelAdmin):
    list_display = ('id', 'nome')
    search_fields = ('nome',)


# Admin de Parceiro
@admin.register(Parceiro)
class ParceiroAdmin(admin.ModelAdmin):
    list_display = ('codigo', 'parceiro', 'cidade', 'uf', 'canal_venda', 'status')
    search_fields = ('codigo', 'parceiro', 'cidade', 'consultor')
    list_filter = ('canal_venda', 'uf', 'classificacao')

    def get_readonly_fields(self, request, obj=None):
        if not obj:
            return ('tm', 'recorrencia', 'total_geral', 'status')

        readonly = ['tm', 'recorrencia', 'total_geral', 'status']
        meses = [
            'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
            'janeiro_2', 'fevereiro_2', 'marco_2',
        ]
        for mes in meses:
            valor = getattr(obj, mes)
            if valor and valor != 0:
                readonly.append(mes)
        return readonly

    fieldsets = (
        ('Informações do Parceiro', {
            'fields': (
                'codigo', 'parceiro', 'classificacao', 'consultor',
                'canal_venda', 'cidade', 'uf',
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
            'fields': ('tm', 'recorrencia', 'total_geral', 'status')
        }),
    )

    def formfield_for_dbfield(self, db_field, **kwargs):
        field = super().formfield_for_dbfield(db_field, **kwargs)
        if db_field.name == 'canal_venda':
            field.label = 'Unidade'
        return field

from .models import Interacao

@admin.register(Interacao)
class InteracaoAdmin(admin.ModelAdmin):
    list_display = ('parceiro', 'usuario', 'tipo', 'data_interacao', 'entrou_em_contato')
    list_filter = ('tipo', 'entrou_em_contato', 'data_interacao')
    search_fields = ('parceiro__parceiro', 'usuario__username')


# Interacoes Geradas
@admin.register(InteracaoGerada)
class InteracaoGeradaAdmin(admin.ModelAdmin):
    list_display = ('parceiro', 'get_usuario', 'canal_venda', 'status', 'data_geracao')
    list_filter = ('canal_venda', 'status', 'data_geracao')
    search_fields = ('parceiro__parceiro', 'usuario__username', 'usuario__id_vendedor')

    def get_usuario(self, obj):
        return obj.usuario.username if obj.usuario else '-'
    get_usuario.short_description = 'Usuário'
    def get_id_vendedor(self, obj):
        return obj.usuario.id_vendedor if obj.usuario else '-'
    get_id_vendedor.short_description = 'ID Vendedor'