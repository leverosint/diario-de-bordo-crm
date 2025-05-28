from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import datetime, timedelta

# Canal de venda associado a usuários e parceiros
class CanalVenda(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

TIPOS_USUARIO = [
    ('VENDEDOR', 'Vendedor'),
    ('GESTOR', 'Gestor'),
    ('ADMIN', 'Administrador'),
]

# Usuário customizado
class CustomUser(AbstractUser):
    tipo_user = models.CharField(max_length=20, choices=[("ADMIN", "Administrador"), ("GESTOR", "Gestor"), ("VENDEDOR", "Vendedor")])
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

    # Faturamento mensal
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

    def save(self, *args, **kwargs):
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

        # Mapeamento mês → número e ano
        mes_ref = {
            'janeiro': (1, 2025), 'fevereiro': (2, 2025), 'marco': (3, 2025), 'abril': (4, 2025),
            'maio': (5, 2025), 'junho': (6, 2025), 'julho': (7, 2025), 'agosto': (8, 2025),
            'setembro': (9, 2025), 'outubro': (10, 2025), 'novembro': (11, 2025), 'dezembro': (12, 2025),
            'janeiro_2': (1, 2026), 'fevereiro_2': (2, 2026), 'marco_2': (3, 2026)
        }

        # Último mês com faturamento > 0
        ultimo_fat_data = None
        for nome, valor in reversed(meses):
            if valor and valor > 0:
                mes_num, ano = mes_ref[nome]
                ultimo_fat_data = datetime(ano, mes_num, 1)
                break

        if ultimo_fat_data:
            hoje = datetime.today()
            ano_atual, mes_atual = hoje.year, hoje.month
            ultimo_dia_mes_anterior = datetime(ano_atual, mes_atual, 1) - timedelta(days=1)

            dias_diferenca = (ultimo_dia_mes_anterior - ultimo_fat_data).days

            if dias_diferenca <= 30:
                self.status = "30d s/ Fat"
            elif dias_diferenca <= 60:
                self.status = "60d s/ Fat"
            elif dias_diferenca <= 90:
                self.status = "90d s/ Fat"
            else:
                self.status = "120d s/ Fat"

            if ultimo_fat_data.month in [mes_atual, mes_atual - 1] and ultimo_fat_data.year == ano_atual:
                self.status = "Recorrente"
        else:
            self.status = "Sem Faturamento"

        super().save(*args, **kwargs)

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

    def __str__(self):
        return f"{self.parceiro.parceiro} - {self.usuario.username} ({self.tipo})"
