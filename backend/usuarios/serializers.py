from rest_framework import serializers
from .models import Parceiro, CanalVenda, Interacao, CustomUser

# ===== Canal de Venda =====
class CanalVendaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CanalVenda
        fields = ['id', 'nome']


# ===== Parceiro =====
class ParceiroSerializer(serializers.ModelSerializer):
    canal_venda = CanalVendaSerializer(read_only=True)
    canal_venda_id = serializers.PrimaryKeyRelatedField(
        source='canal_venda',
        queryset=CanalVenda.objects.all(),
        write_only=True
    )

    class Meta:
        model = Parceiro
        fields = [
            'id',
            'codigo',
            'parceiro',
            'classificacao',
            'consultor',
            'unidade',
            'cidade',
            'uf',
            'canal_venda',
            'canal_venda_id',
            'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
            'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
            'janeiro_2', 'fevereiro_2', 'marco_2',
            'total_geral',
            'tm',
            'recorrencia',
            'status',
            'primeiro_fat',
            'ultimo_fat',
            'atualizado_em',
        ]


# ===== Interação (Completa) =====
class InteracaoSerializer(serializers.ModelSerializer):
    parceiro_nome = serializers.CharField(source='parceiro.parceiro', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)
    parceiro = serializers.PrimaryKeyRelatedField(queryset=Parceiro.objects.all())

    class Meta:
        model = Interacao
        fields = [
            'id',
            'parceiro',
            'parceiro_nome',
            'usuario',
            'usuario_nome',
            'tipo',
            'data_interacao',
            'entrou_em_contato',
        ]
        read_only_fields = ['data_interacao', 'usuario']


# ===== Interações Pendentes (Simples) =====
class InteracaoPendentesSerializer(serializers.ModelSerializer):
    parceiro = serializers.SerializerMethodField()

    class Meta:
        model = Parceiro
        fields = [
            'id',
            'parceiro',
            'unidade',
            'classificacao',
            'status',
        ]

    def get_parceiro(self, obj):
        return obj.parceiro
