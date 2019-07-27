from django.contrib.auth import get_user_model
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from .fields import MarkdownField
from .models import Product, Project, Task

User = get_user_model()


class HashidPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def to_representation(self, value):
        if self.pk_field is not None:
            return self.pk_field.to_representation(value.pk)
        return str(value.pk)


class FullUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username", "email", "is_staff")


class MinimalUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username")


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "repo_url",
            "description",
            "is_managed",
            "slug",
            "old_slugs",
        )


class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)
    product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), pk_field=serializers.CharField()
    )
    branch_url = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = (
            "id",
            "name",
            "description",
            "slug",
            "old_slugs",
            "product",
            "branch_url",
        )
        validators = (
            UniqueTogetherValidator(
                queryset=Project.objects.all(),
                fields=("name", "product"),
                message="A project with this name already exists.",
            ),
        )

    def get_branch_url(self, obj):
        return f"{obj.product.repo_url}/tree/{obj.branch_name}"


class TaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), pk_field=serializers.CharField()
    )
    assignee = HashidPrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True
    )

    class Meta:
        model = Task
        fields = ("id", "name", "description", "project", "assignee")
