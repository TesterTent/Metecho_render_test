# Generated by Django 2.2.8 on 2019-12-19 21:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0041_merge_20191218_2155"),
    ]

    operations = [
        migrations.AddField(
            model_name="task",
            name="pr_is_open",
            field=models.BooleanField(default=False),
        ),
    ]