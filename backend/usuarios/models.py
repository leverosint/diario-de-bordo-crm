from django.contrib.auth.models import AbstractUser
from django.db import models

TIPOS_USUARIO = [
    ('VENDEDOR', 'Vendedor'),
    ('GESTOR', 'Gestor'),
    ('ADMIN', 'Administrador'),
]

class CanalVenda(models.Model):
    nome = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nome

class CustomUser(AbstractUser):
    tipo_user = models.CharField(max_length=10, choices=TIPOS_USUARIO, default='VENDEDOR')
    canais_venda = models.ManyToManyField(CanalVenda, blank=True, related_name='usuarios')
    id_vendedor = models.CharField(max_length=20, blank=True, null=True)
    primeiro_acesso = models.BooleanField(default=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return self.username
