import logging
from typing import Optional

from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers
from rest_framework.exceptions import NotFound

from .fields import MarkdownField
from .models import Project, Repository, ScratchOrg, Task
from .validators import CaseInsensitiveUniqueTogetherValidator

User = get_user_model()
logger = logging.getLogger(__name__)


class FormattableDict:
    """
    Stupid hack to get a dict error message into a
    CaseInsensitiveUniqueTogetherValidator, so the error can be assigned
    to a particular key.
    """

    def __init__(self, key, msg):
        self.key = key
        self.msg = msg

    def format(self, *args, **kwargs):
        return {
            self.key: self.msg.format(*args, **kwargs),
        }


class HashidPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    def to_representation(self, value):
        if self.pk_field is not None:
            return self.pk_field.to_representation(value.pk)
        return str(value.pk)


class FullUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "is_staff",
            "valid_token_for",
            "org_name",
            "org_type",
            "is_devhub_enabled",
            "sf_username",
            "currently_fetching_repos",
        )


class MinimalUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ("id", "username")


class RepositorySerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)
    repo_url = serializers.SerializerMethodField()

    class Meta:
        model = Repository
        fields = (
            "id",
            "name",
            "repo_url",
            "description",
            "is_managed",
            "slug",
            "old_slugs",
        )

    def get_repo_url(self, obj) -> Optional[str]:
        return f"https://github.com/{obj.repo_owner}/{obj.repo_name}"


class HookSerializerMixin:
    def get_matching_repository(self):
        repo_id = self.validated_data["repository"]["id"]
        return Repository.objects.filter(repo_id=repo_id).first()


class HookRepositorySerializer(HookSerializerMixin, serializers.Serializer):
    id = serializers.IntegerField()


class AuthorCommitSerializer(serializers.Serializer):
    name = serializers.CharField(required=False)
    email = serializers.CharField(required=False)
    username = serializers.CharField(required=False)
    avatar_url = serializers.CharField(required=False)


class PrSerializer(serializers.Serializer):
    merged = serializers.BooleanField()
    # All other fields are ignored by default.


class PrHookSerializer(HookSerializerMixin, serializers.Serializer):
    action = serializers.CharField()
    number = serializers.IntegerField()
    pull_request = PrSerializer()
    repository = HookRepositorySerializer()
    # All other fields are ignored by default.

    def _is_merged(self):
        return (
            self.validated_data["action"] == "closed"
            and self.validated_data["pull_request"]["merged"]
        )

    def _get_matching_task(self, repository):
        return Task.objects.filter(
            project__repository=repository, pr_number=self.validated_data["number"]
        ).first()

    def process_hook(self):
        repository = self.get_matching_repository()
        if not repository:
            raise NotFound("No matching repository.")

        if self._is_merged():
            task = self._get_matching_task(repository)
            if task is None:
                return
            task.finalize_status_completed()


class CommitSerializer(serializers.Serializer):
    id = serializers.CharField()
    timestamp = serializers.CharField()
    author = AuthorCommitSerializer()
    message = serializers.CharField()
    url = serializers.CharField()


class HookSenderSerializer(serializers.Serializer):
    login = serializers.CharField(required=False)
    avatar_url = serializers.CharField(required=False)


class PushHookSerializer(HookSerializerMixin, serializers.Serializer):
    forced = serializers.BooleanField()
    ref = serializers.CharField()
    sender = HookSenderSerializer()
    commits = serializers.ListField(child=CommitSerializer())
    repository = HookRepositorySerializer()
    # All other fields are ignored by default.

    def is_force_push(self):
        return self.validated_data["forced"]

    def process_hook(self):
        repository = self.get_matching_repository()
        if not repository:
            raise NotFound("No matching repository.")

        ref = self.validated_data["ref"]
        branch_prefix = "refs/heads/"
        if not ref.startswith(branch_prefix):
            logger.error(f"Received an invalid ref: {ref}")
            return
        prefix_len = len(branch_prefix)
        ref = ref[prefix_len:]

        if self.is_force_push():
            repository.queue_refresh_commits(ref=ref)
        else:
            sender = self.validated_data["sender"]
            repository.add_commits(
                commits=self.validated_data["commits"], ref=ref, sender=sender,
            )


class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)
    repository = serializers.PrimaryKeyRelatedField(
        queryset=Repository.objects.all(), pk_field=serializers.CharField()
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
            "repository",
            "branch_url",
        )
        validators = (
            CaseInsensitiveUniqueTogetherValidator(
                queryset=Project.objects.all(),
                fields=("name", "repository"),
                message=FormattableDict(
                    "name", _("A project with this name already exists.")
                ),
            ),
        )

    def get_branch_url(self, obj) -> Optional[str]:
        repo = obj.repository
        repo_owner = repo.repo_owner
        repo_name = repo.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and branch:
            return f"https://github.com/{repo_owner}/{repo_name}/tree/{branch}"
        return None


class TaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    description = MarkdownField(allow_blank=True)
    project = serializers.PrimaryKeyRelatedField(
        queryset=Project.objects.all(), pk_field=serializers.CharField()
    )
    assignee = HashidPrimaryKeyRelatedField(
        queryset=User.objects.all(), allow_null=True
    )
    branch_url = serializers.SerializerMethodField()
    branch_diff_url = serializers.SerializerMethodField()
    pr_url = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = (
            "id",
            "name",
            "description",
            "project",
            "assignee",
            "slug",
            "old_slugs",
            "has_unmerged_commits",
            "currently_creating_pr",
            "branch_url",
            "commits",
            "branch_diff_url",
            "pr_url",
            "status",
        )
        validators = (
            CaseInsensitiveUniqueTogetherValidator(
                queryset=Task.objects.all(),
                fields=("name", "project"),
                message=FormattableDict(
                    "name", _("A task with this name already exists.")
                ),
            ),
        )

    def get_branch_url(self, obj) -> Optional[str]:
        repo = obj.project.repository
        repo_owner = repo.repo_owner
        repo_name = repo.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and branch:
            return f"https://github.com/{repo_owner}/{repo_name}/tree/{branch}"
        return None

    def get_branch_diff_url(self, obj) -> Optional[str]:
        project = obj.project
        project_branch = project.branch_name
        repo = project.repository
        repo_owner = repo.repo_owner
        repo_name = repo.repo_name
        branch = obj.branch_name
        if repo_owner and repo_name and project_branch and branch:
            return (
                f"https://github.com/{repo_owner}/{repo_name}/compare/"
                f"{project_branch}...{branch}"
            )
        return None

    def get_pr_url(self, obj) -> Optional[str]:
        repo = obj.project.repository
        repo_owner = repo.repo_owner
        repo_name = repo.repo_name
        pr_number = obj.pr_number
        if repo_owner and repo_name and pr_number:
            return f"https://github.com/{repo_owner}/{repo_name}/pull/{pr_number}"
        return None


class CreatePrSerializer(serializers.Serializer):
    title = serializers.CharField()
    critical_changes = serializers.CharField(allow_blank=True)
    additional_changes = serializers.CharField(allow_blank=True)
    issues = serializers.CharField(allow_blank=True)
    notes = serializers.CharField(allow_blank=True)


class ScratchOrgSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    task = serializers.PrimaryKeyRelatedField(
        queryset=Task.objects.all(), pk_field=serializers.CharField()
    )
    owner = serializers.PrimaryKeyRelatedField(
        pk_field=serializers.CharField(),
        default=serializers.CurrentUserDefault(),
        read_only=True,
    )
    has_unsaved_changes = serializers.SerializerMethodField()

    class Meta:
        model = ScratchOrg
        fields = (
            "id",
            "task",
            "org_type",
            "owner",
            "last_modified_at",
            "expires_at",
            "latest_commit",
            "latest_commit_url",
            "latest_commit_at",
            "url",
            "unsaved_changes",
            "has_unsaved_changes",
            "currently_refreshing_changes",
            "currently_capturing_changes",
            "delete_queued_at",
            "owner_sf_id",
        )
        extra_kwargs = {
            "last_modified_at": {"read_only": True},
            "expires_at": {"read_only": True},
            "latest_commit": {"read_only": True},
            "latest_commit_url": {"read_only": True},
            "latest_commit_at": {"read_only": True},
            "url": {"read_only": True},
            "unsaved_changes": {"read_only": True},
            "currently_refreshing_changes": {"read_only": True},
            "currently_capturing_changes": {"read_only": True},
        }

    def get_has_unsaved_changes(self, obj) -> bool:
        return bool(getattr(obj, "unsaved_changes", {}))

    def save(self, **kwargs):
        kwargs["owner"] = kwargs.get("owner", self.context["request"].user)
        return super().save(**kwargs)


class CommitSerializer(serializers.Serializer):
    commit_message = serializers.CharField()
    # Expect this to be Dict<str, List<str>>
    changes = serializers.DictField(
        child=serializers.ListField(child=serializers.CharField())
    )
