# Generated by Django 4.2 on 2025-06-20 17:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0019_remove_customuser_primeiro_acesso_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='primeiro_acesso',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
