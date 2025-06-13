from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import datetime, timedelta
from django.conf import settings  # para pegar o AUTH_USER_MODEL
from django.utils import timezone

# Canal de venda associado a usuários e parceiros
class CanalVenda(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

# Tipos de usuário
TIPOS_USUARIO = [
    ('VENDEDOR', 'Vendedor'),
    ('GESTOR', 'Gestor'),
    ('ADMIN', 'Administrador'),
]

# Usuário customizado
class CustomUser(AbstractUser):
    tipo_user = models.CharField(max_length=20, choices=TIPOS_USUARIO)
    canais_venda = models.ManyToManyField(CanalVenda, blank=True, related_name='usuarios')
    id_vendedor = models.CharField(max_length=50, blank=True, null=True)
    primeiro_acesso = models.BooleanField(default=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username

# Modelo de Parceiro
class Parceiro(models.Model):
    codigo = models.CharField(max_length=52, unique=True)
    parceiro = models.CharField(max_length=255)
    classificacao = models.CharField(max_length=100, blank=True, null=True)
    consultor = models.CharField(max_length=100, blank=True, null=True)
    unidade = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    uf = models.CharField(max_length=2, blank=True, null=True)
    primeiro_fat = models.DateField(blank=True, null=True)
    ultimo_fat = models.DateField(blank=True, null=True)
    janeiro = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    fevereiro = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    marco = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    abril = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    maio = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    junho = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    julho = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    agosto = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    setembro = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    outubro = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    novembro = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    dezembro = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    janeiro_2 = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    fevereiro_2 = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    marco_2 = models.DecimalField(max_digits=12, decimal_places=2, default=0, null=True, blank=True)
    total_geral = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    recorrencia = models.IntegerField(blank=True, null=True)
    tm = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=30, blank=True, null=True)
    canal_venda = models.ForeignKey(CanalVenda, on_delete=models.SET_NULL, blank=True, null=True, related_name="parceiros")
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.codigo or ''} - {self.parceiro or ''}"

##SAVE##

    def save(self, *args, **kwargs):
        # Soma e métricas mensais
        meses = [
            ('janeiro', self.janeiro), ('fevereiro', self.fevereiro), ('marco', self.marco), ('abril', self.abril),
            ('maio', self.maio), ('junho', self.junho), ('julho', self.julho), ('agosto', self.agosto),
            ('setembro', self.setembro), ('outubro', self.outubro), ('novembro', self.novembro), ('dezembro', self.dezembro),
            ('janeiro_2', self.janeiro_2), ('fevereiro_2', self.fevereiro_2), ('marco_2', self.marco_2)
        ]
        self.total_geral = sum([m[1] or 0 for m in meses])
        meses_com_valor = [m[1] for m in meses if m[1] and m[1] > 0]
        self.tm = self.total_geral / len(meses_com_valor) if meses_com_valor else 0
        self.recorrencia = len(meses_com_valor)

        # Referência de datas dos meses
        mes_ref = {
            'janeiro': (1, 2025), 'fevereiro': (2, 2025), 'marco': (3, 2025), 'abril': (4, 2025),
            'maio': (5, 2025), 'junho': (6, 2025), 'julho': (7, 2025), 'agosto': (8, 2025),
            'setembro': (9, 2025), 'outubro': (10, 2025), 'novembro': (11, 2025), 'dezembro': (12, 2025),
            'janeiro_2': (1, 2026), 'fevereiro_2': (2, 2026), 'marco_2': (3, 2026)
        }

        # Determina o último mês com valor > 0
        ultimo_fat_data = None
        for nome, valor in reversed(meses):
            if valor and valor > 0:
                mes_num, ano = mes_ref[nome]
                ultimo_fat_data = datetime(ano, mes_num, 1)
                break

        # Classificação de status
        if self.total_geral == 0:
            self.status = "Sem Faturamento"
        elif ultimo_fat_data:
            hoje = datetime.today()
            dias_diferenca = (hoje - ultimo_fat_data).days

            if dias_diferenca < 30:
                self.status = "Base Ativa"
            elif dias_diferenca < 60:
                self.status = "30 dias s/ Fat"
            elif dias_diferenca < 90:
                self.status = "60 dias s/ Fat"
            elif dias_diferenca < 120:
                self.status = "90 dias s/ Fat"
            else:
                self.status = "120 dias s/ Fat"
        else:
            self.status = "Sem Faturamento"

        super(Parceiro, self).save(*args, **kwargs)



# Modelo de Interação
class Interacao(models.Model):
    TIPO_CHOICES = [
        ('whatsapp', 'WhatsApp'),
        ('email', 'E-mail'),
        ('ligacao', 'Ligação'),
    ]
    parceiro = models.ForeignKey(Parceiro, on_delete=models.CASCADE, related_name='interacoes')
    usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='interacoes')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    data_interacao = models.DateTimeField(auto_now_add=True)
    entrou_em_contato = models.BooleanField(default=False)
    
    # ✅ novo campo:
    status = models.CharField(max_length=50, null=True, blank=True)

    def __str__(self):
        return f"{self.parceiro.parceiro} - {self.usuario.username} ({self.tipo})"

# Modelo de Oportunidade

class Oportunidade(models.Model):
    ETAPA_CHOICES = [
    ('oportunidade', 'Oportunidade'),
    ('orcamento', 'Orçamento'),
    ('aguardando', 'Aguardando Pagamento'),  # 👈 adicionado aqui
    ('pedido', 'Pedido'),
    ('perdida', 'Venda Perdida'),
]

    parceiro = models.ForeignKey(Parceiro, on_delete=models.CASCADE, related_name='oportunidades')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='oportunidades')
    valor = models.DecimalField(max_digits=12, decimal_places=2)
    etapa = models.CharField(max_length=20, choices=ETAPA_CHOICES, default='oportunidade')
    observacao = models.TextField(blank=True, null=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_etapa = models.DateTimeField(null=True, blank=True)  # NOVO CAMPO
    data_status = models.DateTimeField(null=True, blank=True)


    def save(self, *args, **kwargs):
        # se for uma nova ou a etapa foi alterada, atualiza a data_etapa
        if not self.pk:
            self.data_etapa = timezone.now()
        else:
            original = Oportunidade.objects.get(pk=self.pk)
            if self.etapa != original.etapa:
                self.data_etapa = timezone.now()

        super().save(*args, **kwargs)


    def __str__(self):
        return f"{self.parceiro.parceiro} - R$ {self.valor} - {self.get_etapa_display()}"

# Gatilhos extras (eventos manuais)
class GatilhoExtra(models.Model):
    parceiro = models.ForeignKey(Parceiro, on_delete=models.CASCADE, related_name='gatilhos_extras')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='gatilhos_extras')
    descricao = models.CharField(max_length=255)

    def __str__(self):
        return f'{self.parceiro.parceiro} - {self.usuario.username} ({self.descricao})'
