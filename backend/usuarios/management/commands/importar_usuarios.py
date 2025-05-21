import pandas as pd
from django.core.management.base import BaseCommand
from usuarios.models import CustomUser
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = 'Importa usuários a partir de uma planilha Excel'

    def add_arguments(self, parser):
        parser.add_argument('arquivo_excel', type=str)

    def handle(self, *args, **kwargs):
        arquivo = kwargs['arquivo_excel']
        df = pd.read_excel(arquivo)

        for _, row in df.iterrows():
            username = str(row['username']).strip()
            if CustomUser.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f"Usuário '{username}' já existe. Ignorado."))
                continue

            user = CustomUser(
                username=username,
                first_name=row.get('nome', ''),
                tipo_user=row.get('tipo_user', 'VENDEDOR'),
                canal=row.get('canal', ''),
                id_vendedor=row.get('id_vendedor', ''),
                primeiro_acesso=True,
                password=make_password(str(row.get('senha', '123456')))
            )
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Usuário '{username}' criado com sucesso."))
