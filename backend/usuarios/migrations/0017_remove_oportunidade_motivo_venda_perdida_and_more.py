# Generated by Django 4.2 on 2025-06-18 17:42

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0016_oportunidade_motivo_venda_perdida_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='oportunidade',
            name='motivo_venda_perdida',
        ),
        migrations.RemoveField(
            model_name='oportunidade',
            name='outro_motivo',
        ),
    ]
