from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from usuarios.models import CanalVenda
import pandas as pd


class Command(BaseCommand):
    help = 'Importa usuários a partir de um arquivo Excel'

    def add_arguments(self, parser):
        parser.add_argument('arquivo_excel', type=str, help='Caminho do arquivo Excel')

    def handle(self, *args, **kwargs):
        arquivo_excel = kwargs['arquivo_excel']
        df = pd.read_excel(arquivo_excel)

        User = get_user_model()

        for index, row in df.iterrows():
            username = str(row['username']).strip()
            email = str(row['email']).strip()
            tipo_user = str(row['tipo_user']).strip()
            id_vendedor = str(row['id_vendedor']).strip()
            canal_nome = str(row['canal']).strip() if pd.notna(row['canal']) else None

            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'tipo_user': tipo_user,
                    'id_vendedor': id_vendedor,
                }
            )

            if created:
                user.set_password('12345678')
                user.save()

            if canal_nome:
                canal, _ = CanalVenda.objects.get_or_create(nome=canal_nome)
                user.canais_venda.add(canal)

            self.stdout.write(
                self.style.SUCCESS(
                    f"✅ Usuário {username} {'criado' if created else 'atualizado'} com canal {canal_nome if canal_nome else 'nenhum'}"
                )
            )
