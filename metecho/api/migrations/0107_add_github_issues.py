# Generated by Django 3.2.4 on 2021-06-16 22:18

import django.db.models.deletion
import hashid_field.field
import sfdo_template_helpers.fields.string
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0106_project_tasks"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="currently_fetching_issues",
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name="GitHubIssue",
            fields=[
                (
                    "id",
                    hashid_field.field.HashidAutoField(
                        alphabet="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",  # noqa
                        min_length=7,
                        prefix="",
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("github_id", models.PositiveIntegerField(db_index=True)),
                ("title", sfdo_template_helpers.fields.string.StringField()),
                ("number", models.PositiveIntegerField()),
                (
                    "state",
                    models.CharField(
                        choices=[("open", "Open"), ("closed", "Closed")], max_length=50
                    ),
                ),
                ("html_url", models.URLField()),
                ("created_at", models.DateTimeField()),
                ("updated_at", models.DateTimeField()),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="issues",
                        to="api.project",
                    ),
                ),
            ],
            options={
                "verbose_name": "GitHub issue",
                "verbose_name_plural": "GitHub issues",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddField(
            model_name="epic",
            name="issue",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="epic",
                to="api.githubissue",
            ),
        ),
        migrations.AddField(
            model_name="task",
            name="issue",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="task",
                to="api.githubissue",
            ),
        ),
    ]
