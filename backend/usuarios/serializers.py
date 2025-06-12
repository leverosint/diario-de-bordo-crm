from rest_framework import serializers
from .models import Parceiro, CanalVenda, Interacao, CustomUser, Oportunidade, GatilhoExtra
from django.utils import timezone

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
    parceiro = serializers.CharField(source='parceiro.parceiro', read_only=True)


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
            'status',  # ✅ novo campo
        ]
        read_only_fields = ['data_interacao', 'usuario', 'status']  # status é só leitura


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

class OportunidadeSerializer(serializers.ModelSerializer):
    parceiro_nome = serializers.CharField(source='parceiro.parceiro', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)
    data_status = serializers.DateTimeField(read_only=True)
    dias_sem_interacao = serializers.SerializerMethodField()

    class Meta:
        model = Oportunidade
        fields = [
            'id',
            'parceiro',
            'parceiro_nome',
            'usuario',
            'usuario_nome',
            'valor',
            'observacao',
            'etapa',
            'data_criacao',
            'data_status',
            'data_etapa',  # 👈 ADICIONE AQUI
            'dias_sem_interacao',
        ]
        read_only_fields = ['data_criacao', 'data_etapa', 'usuario']

    def get_dias_sem_interacao(self, obj):
        from django.utils.timezone import now
        ultima_interacao = obj.parceiro.interacoes.order_by('-data_interacao').first()
        if ultima_interacao:
            delta = now().date() - ultima_interacao.data_interacao.date()
            return delta.days
        return None


class GatilhoExtraSerializer(serializers.ModelSerializer):
    parceiro_nome = serializers.CharField(source='parceiro.parceiro', read_only=True)
    usuario_nome = serializers.CharField(source='usuario.username', read_only=True)

    class Meta:
        model = GatilhoExtra
        fields = ['id', 'parceiro', 'parceiro_nome', 'usuario', 'usuario_nome', 'descricao']