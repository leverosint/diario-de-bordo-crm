from django.db import models
from django.contrib.auth.models import AbstractUser

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

    canal_venda = models.ForeignKey(CanalVenda, on_delete=models.SET_NULL, blank=True, null=True, related_name="parceiros")
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.codigo or ''} - {self.parceiro or ''}"

    def save(self, *args, **kwargs):
        meses = [
            self.janeiro or 0, self.fevereiro or 0, self.marco or 0, self.abril or 0,
            self.maio or 0, self.junho or 0, self.julho or 0, self.agosto or 0,
            self.setembro or 0, self.outubro or 0, self.novembro or 0, self.dezembro or 0,
            self.janeiro_2 or 0, self.fevereiro_2 or 0, self.marco_2 or 0,
        ]

        self.total_geral = sum(meses)

        meses_com_valor = [m for m in meses if m > 0]
        self.tm = self.total_geral / len(meses_com_valor) if meses_com_valor else 0

        # Recorrência = total de meses com faturamento > 0 (mesmo pulando meses vazios)
        self.recorrencia = sum(1 for m in meses if m > 0)

        super().save(*args, **kwargs)
