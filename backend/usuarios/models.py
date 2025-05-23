from django.contrib.auth.models import AbstractUser
from django.db import models

TIPOS_USUARIO = [
    ('VENDEDOR', 'Vendedor'),
    ('GESTOR', 'Gestor'),
    ('ADMIN', 'Administrador'),
]

class CustomUser(AbstractUser):
    tipo_user = models.CharField(max_length=10, choices=TIPOS_USUARIO, default='VENDEDOR')
    canal = models.CharField(max_length=100, blank=True, null=True)
    id_vendedor = models.CharField(max_length=20, blank=True, null=True)
    primeiro_acesso = models.BooleanField(default=True)

    USERNAME_FIELD = 'username'  # ← ESSENCIAL para autenticação
    REQUIRED_FIELDS = ['email']  # ← Usado para o createsuperuser

    def __str__(self):
        return self.username