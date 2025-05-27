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
    tipo_user = models.CharField(max_length=10, choices=TIPOS_USUARIO, default='VENDEDOR')
    canais_venda = models.ManyToManyField(CanalVenda, blank=True, related_name='usuarios')
    id_vendedor = models.CharField(max_length=20, blank=True, null=True)
    primeiro_acesso = models.BooleanField(default=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username


# Modelo de Parceiro
class Parceiro(models.Model):
    codigo = models.CharField(max_length=50, unique=True)
    parceiro = models.CharField(max_length=255)
    classificacao = models.CharField(max_length=100, blank=True, null=True)
    consultor = models.CharField(max_length=100, blank=True, null=True)
    unidade = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    uf = models.CharField(max_length=2, blank=True, null=True)
    primeiro_fat = models.DateField(blank=True, null=True)
    ultimo_fat = models.DateField(blank=True, null=True)

    # Faturamento mensal
    janeiro = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fevereiro = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    marco = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    abril = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    maio = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    junho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    julho = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    agosto = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    setembro = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outubro = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    novembro = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    dezembro = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    janeiro_2 = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fevereiro_2 = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    marco_2 = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Cálculos automáticos
    total_geral = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    recorrencia = models.CharField(max_length=50, blank=True, null=True)
    tm = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    canal_venda = models.ForeignKey(CanalVenda, on_delete=models.SET_NULL, blank=True, null=True, related_name="parceiros")
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.codigo} - {self.parceiro}"

    def save(self, *args, **kwargs):
        meses = [
            self.janeiro, self.fevereiro, self.marco, self.abril, self.maio, self.junho,
            self.julho, self.agosto, self.setembro, self.outubro, self.novembro, self.dezembro,
            self.janeiro_2, self.fevereiro_2, self.marco_2,
        ]
        self.total_geral = sum(meses)

        meses_com_valor = [m for m in meses if m > 0]
        if meses_com_valor:
            self.tm = self.total_geral / len(meses_com_valor)
        else:
            self.tm = 0

        self.recorrencia = "Ativo" if len(meses_com_valor) >= 3 else "Ocasional"

        super().save(*args, **kwargs)
