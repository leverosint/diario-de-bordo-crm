from django.db import models
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from django.contrib.auth.models import AbstractUser


TIPO_USER_CHOICES = [
    ('ADMIN', 'Administrador'),
    ('GESTOR', 'Gestor'),
    ('VENDEDOR', 'Vendedor'),
]

class CanalVenda(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class Parceiro(models.Model):
    codigo = models.CharField(max_length=50, unique=True)
    parceiro = models.CharField(max_length=200)
    classificacao = models.CharField(max_length=100, blank=True, null=True)
    consultor = models.CharField(max_length=100, blank=True, null=True)
    cidade = models.CharField(max_length=100, blank=True, null=True)
    uf = models.CharField(max_length=2, blank=True, null=True)
    unidade = models.CharField(max_length=100, blank=True, null=True)
    canal_venda = models.ForeignKey(CanalVenda, on_delete=models.SET_NULL, null=True)

    janeiro = models.FloatField(default=0)
    fevereiro = models.FloatField(default=0)
    marco = models.FloatField(default=0)
    abril = models.FloatField(default=0)
    maio = models.FloatField(default=0)
    junho = models.FloatField(default=0)
    julho = models.FloatField(default=0)
    agosto = models.FloatField(default=0)
    setembro = models.FloatField(default=0)
    outubro = models.FloatField(default=0)
    novembro = models.FloatField(default=0)
    dezembro = models.FloatField(default=0)
    janeiro_2 = models.FloatField(default=0)
    fevereiro_2 = models.FloatField(default=0)
    marco_2 = models.FloatField(default=0)

    total_geral = models.FloatField(default=0)
    tm = models.FloatField(default=0)
    recorrencia = models.IntegerField(default=0)
    status = models.CharField(max_length=50, default="Sem registro")
    primeiro_fat = models.DateField(null=True, blank=True)
    ultimo_fat = models.DateField(null=True, blank=True)

    atualizado_em = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        meses = [
            ('01', self.janeiro),
            ('02', self.fevereiro),
            ('03', self.marco),
            ('04', self.abril),
            ('05', self.maio),
            ('06', self.junho),
            ('07', self.julho),
            ('08', self.agosto),
            ('09', self.setembro),
            ('10', self.outubro),
            ('11', self.novembro),
            ('12', self.dezembro),
            ('01', self.janeiro_2),
            ('02', self.fevereiro_2),
            ('03', self.marco_2),
        ]

        hoje = datetime.now()
        ano = hoje.year
        ano_anterior = ano - 1

        datas_faturamento = []
        total = 0
        recorrencia = 0

        for i, (mes, valor) in enumerate(meses):
            if valor > 0:
                ano_ref = ano_anterior if i < 12 else ano
                data_ref = datetime.strptime(f"{ano_ref}-{mes}-01", "%Y-%m-%d")
                datas_faturamento.append(data_ref)
                recorrencia += 1
                total += valor

        self.total_geral = total
        self.tm = total / recorrencia if recorrencia else 0
        self.recorrencia = recorrencia

        self.primeiro_fat = min(datas_faturamento) if datas_faturamento else None
        self.ultimo_fat = max(datas_faturamento) if datas_faturamento else None

        # Cálculo de status
        status = "Sem registro"
        if self.ultimo_fat:
            ultimo_dia_mes_passado = datetime(hoje.year, hoje.month, 1) - timedelta(days=1)
            dias_diff = (ultimo_dia_mes_passado.date() - self.ultimo_fat).days

            if dias_diff <= 0:
                status = "Recorrente"
            elif dias_diff <= 30:
                status = "30d s/ Fat"
            elif dias_diff <= 60:
                status = "60d s/ Fat"
            elif dias_diff <= 90:
                status = "90d s/ Fat"
            else:
                status = "120d s/ Fat"

        self.status = status

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.codigo} - {self.parceiro}"

class CustomUser(AbstractUser):
    tipo_user = models.CharField(max_length=10, choices=TIPO_USER_CHOICES, default='VENDEDOR')
    id_vendedor = models.CharField(max_length=20, blank=True, null=True)
    canais_venda = models.ManyToManyField(CanalVenda, blank=True)

    def __str__(self):
        return self.username
    
    