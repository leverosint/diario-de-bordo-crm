# Generated by Django 4.2 on 2025-06-04 17:40

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0010_oportunidade_usuario'),
    ]

    operations = [
        migrations.CreateModel(
            name='GatilhoExtra',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('descricao', models.CharField(max_length=255)),
                ('parceiro', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gatilhos_extras', to='usuarios.parceiro')),
                ('usuario', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='gatilhos_extras', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
