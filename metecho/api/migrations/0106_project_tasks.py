# Generated by Django 3.2.4 on 2021-07-05 22:29

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0105_alter_project_branch_name"),
    ]

    operations = [
        # 1. Drop the index on `epic`.
        #    Previously this field was called `project` and an old `task_project_id`
        #    index persists even after the rename in migration 0089. By dropping it and
        #    re-creating it later we ensure the creation of `task.project` (the next
        #    step) doesn't fail due to index name collisions.
        migrations.AlterField(
            model_name="task",
            name="epic",
            field=models.ForeignKey(
                db_index=False,
                on_delete=django.db.models.deletion.PROTECT,
                to="api.epic",
            ),
        ),
        # 2. Add new `project` field
        migrations.AddField(
            model_name="task",
            name="project",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="tasks",
                to="api.project",
            ),
        ),
        # 3. Make `epic` nullable and re-create the index (see note in #1)
        migrations.AlterField(
            model_name="task",
            name="epic",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="tasks",
                to="api.epic",
            ),
        ),
        # 4. Add exclusive-or constraint
        migrations.AddConstraint(
            model_name="task",
            constraint=models.CheckConstraint(
                check=models.Q(
                    models.Q(
                        ("project__isnull", False),
                        ("epic__isnull", False),
                        _connector="OR",
                    ),
                    models.Q(
                        ("epic__isnull", False),
                        ("project__isnull", False),
                        _negated=True,
                    ),
                ),
                name="project_xor_epic",
            ),
        ),
    ]