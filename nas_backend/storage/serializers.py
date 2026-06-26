import mimetypes

from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Node, Share, StorageDisk
from django.contrib.auth import authenticate
import os


User = get_user_model()

class CreateFolderSerializer(serializers.Serializer):

    name = serializers.CharField(max_length=255)

    parent_id = serializers.CharField(
        required=False,
        allow_null=True
    )

    def validate(self, data):

        request = self.context["request"]

        parent_id = data.get("parent_id")

        parent = None

        if parent_id:

            try:
                parent = Node.objects.get(
                    id=parent_id,
                    owner_id=request.user.id
                )

            except Node.DoesNotExist:
                raise serializers.ValidationError(
                    "Parent not found"
                )

            if parent.type != "FOLDER":
                raise serializers.ValidationError(
                    "Parent must be a folder"
                )

        existing = Node.objects.filter(
            owner_id=request.user.id,
            parent=parent,
            name=data["name"]
        ).first()

        if existing:
            raise serializers.ValidationError(
                "Folder already exists"
            )

        data["parent"] = parent

        return data
    

class NodeListSerializer(serializers.Serializer):

    id = serializers.CharField(source="pk")

    name = serializers.CharField()
    
    type = serializers.CharField()
    
    size = serializers.IntegerField(default=0)
    
    created_at = serializers.DateTimeField()
    
    parent_id = serializers.SerializerMethodField()
    
    parent_name = serializers.SerializerMethodField()
    
    mime_type = serializers.SerializerMethodField()
    
    thumbnail_url = serializers.SerializerMethodField()

    def get_parent_id(self, obj):

        return str(obj.parent.id) if obj.parent else None

    def get_parent_name(self, obj):

        return obj.parent.name if obj.parent else None

    def get_mime_type(self, obj):

        if obj.type != "FILE":
            return None

        mime, _ = mimetypes.guess_type(obj.name)

        return mime or "application/octet-stream"

    def get_thumbnail_url(self, obj):

        request = self.context.get("request")

        if obj.type != "FILE":
            return None

        mime, _ = mimetypes.guess_type(obj.name)

        if not mime:
            return None

        # Images
        if mime.startswith("image/"):
            return request.build_absolute_uri(
                f"/api/thumbnail/{obj.id}/"
            )

        # Videos
        if mime.startswith("video/"):
            return request.build_absolute_uri(
                f"/api/thumbnail/{obj.id}/"
            )

        return None
    

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    parent_id = serializers.CharField(required=False, allow_null=True)

    def validate(self, data):
        request = self.context["request"]
        parent_id = data.get("parent_id")
        # if data["file"].size > MAX_FILE_SIZE:
        #     raise serializers.ValidationError(
        #         "File too large"
        #     )
        
        if parent_id:
            try:
                parent = Node.objects.get(id=parent_id, owner_id=request.user.id)
                data["parent"] = parent
                existing = Node.objects.filter(
                    owner_id=request.user.id,
                    parent=parent,
                    name=data["file"].name,
                    type="FILE"
                ).first()

                if existing:
                    raise serializers.ValidationError(
                        "File already exists"
                    )
            except Node.DoesNotExist:
                raise serializers.ValidationError("Parent folder not found")

            if parent.type != "FOLDER":
                raise serializers.ValidationError("Parent must be a folder")

            data["parent"] = parent
        else:
            data["parent"] = None

        return data
    

class ShareSerializer(serializers.Serializer):
    node_id = serializers.CharField()
    user_id = serializers.IntegerField()

    def validate(self, data):
        request = self.context["request"]

        try:
            node = Node.objects.get(id=data["node_id"])
        except Node.DoesNotExist:
            raise serializers.ValidationError("Node not found")

        if node.owner_id != request.user.id:
            raise serializers.ValidationError("Only owner can share")
        
        if node.type == "FOLDER":
            raise serializers.ValidationError(
                "Folder sharing not supported yet"
            )
    
        try:
            user = User.objects.get(id=data["user_id"])
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")

        if user.id == request.user.id:
            raise serializers.ValidationError("Cannot share with yourself")

        existing = Share.objects.filter(
            node=node,
            shared_with_id=user.id
        ).first()

        if existing:
            raise serializers.ValidationError("Already shared with this user")

        data["node"] = node
        data["shared_user"] = user

        return data
    

class SharedNodeSerializer(serializers.Serializer):
    
    id = serializers.SerializerMethodField()
    
    name = serializers.SerializerMethodField()
    
    type = serializers.SerializerMethodField()
    
    size = serializers.SerializerMethodField()
    
    owner = serializers.SerializerMethodField()
    
    mime_type = serializers.SerializerMethodField()
    
    thumbnail_url = serializers.SerializerMethodField()
    
    created_at = serializers.SerializerMethodField()

    def get_id(self, obj):
        return str(obj.node.id)

    def get_name(self, obj):
        return obj.node.name

    def get_type(self, obj):
        return obj.node.type

    def get_size(self, obj):
        return obj.node.size

    def get_created_at(self, obj):
        return obj.node.created_at
    
    def get_mime_type(self, obj):

        if obj.node.type != "FILE":
            return None

        mime, _ = mimetypes.guess_type(obj.node.name)

        return mime or "application/octet-stream"

    def get_owner(self, obj):
        try:
            user = User.objects.get(id=obj.node.owner_id)
            return {
                "id": user.id,
                "username": user.username
            }
        except User.DoesNotExist:
            return None
        
    def get_thumbnail_url(self, obj):

        request = self.context.get("request")

        if obj.node.type != "FILE":
            return None

        mime, _ = mimetypes.guess_type(obj.node.name)

        if not mime:
            return None

        if mime.startswith("image/"):
            return request.build_absolute_uri(
                f"/api/thumbnail/{obj.node.id}/"
            )

        if mime.startswith("video/"):
            return request.build_absolute_uri(
                f"/api/thumbnail/{obj.node.id}/"
            )

        return None
        

class StorageDiskSerializer(serializers.Serializer):

    mount_path = serializers.CharField()

    def validate_mount_path(self, value):

        if not os.path.exists(value):
            raise serializers.ValidationError(
                "Mount path does not exist"
            )

        if not os.path.isdir(value):
            raise serializers.ValidationError(
                "Mount path must be directory"
            )

        if not os.access(value, os.W_OK):
            raise serializers.ValidationError(
                "Mount path is not writable"
            )

        existing = StorageDisk.objects.filter(
            mount_path=value
        ).first()

        if existing:
            raise serializers.ValidationError(
                "Disk already added"
            )

        return value
    

class StorageDiskListSerializer(serializers.Serializer):
    id = serializers.CharField(source="pk")

    name = serializers.CharField()
    mount_path = serializers.CharField()

    total_space = serializers.IntegerField()

    system_used_space = serializers.IntegerField()
    nas_used_space = serializers.IntegerField()

    available_space = serializers.SerializerMethodField()

    is_active = serializers.BooleanField()

    created_at = serializers.DateTimeField()
    last_checked = serializers.DateTimeField()

    def get_available_space(self, obj):
        return obj.total_space - obj.system_used_space
    


class AdminCreateUserSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    is_staff = serializers.BooleanField(default=False)
    is_superuser = serializers.BooleanField(default=False)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists")

        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")

        return value
    
class AdminUserListSerializer(
    serializers.ModelSerializer
):

    class Meta:

        model = User

        fields = (
            "id",
            "username",
            "email",
            "is_staff",
            "is_superuser",
            "is_active",
            "date_joined",
        )
    id = serializers.IntegerField()
    username = serializers.CharField()
    email = serializers.EmailField()

    is_staff = serializers.BooleanField()
    is_superuser = serializers.BooleanField()
    is_active = serializers.BooleanField()

    date_joined = serializers.DateTimeField()


class BackupCreateSerializer(serializers.Serializer):

    backup_type = serializers.ChoiceField(
        choices=["USER", "DISK"]
    )

    user_id = serializers.IntegerField(required=False)

    disk_id = serializers.CharField(required=False)

    def validate(self, data):

        backup_type = data["backup_type"]

        # USER BACKUP
        if backup_type == "USER":
            if not data.get("user_id"):
                raise serializers.ValidationError(
                    "user_id required"
                )

        # DISK BACKUP
        if backup_type == "DISK":
            if not data.get("disk_id"):
                raise serializers.ValidationError(
                    "disk_id required"
                )

        return data
    

class LoginSerializer(serializers.Serializer):

    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):

        user = authenticate(
            username=data["username"],
            password=data["password"]
        )

        if not user:
            raise serializers.ValidationError(
                "Invalid credentials"
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "User disabled"
            )

        data["user"] = user

        return data
    
class InitiateUploadSerializer(serializers.Serializer):

    filename = serializers.CharField()

    total_size = serializers.IntegerField(
        min_value=1
    )

    total_chunks = serializers.IntegerField(
        min_value=1
    )

    chunk_size = serializers.IntegerField(
        min_value=1
    )

    file_hash = serializers.CharField()

    parent_id = serializers.CharField(
        required=False,
        allow_null=True
    )

    def validate(self, data):

        request = self.context["request"]

        parent_id = data.get("parent_id")

        if parent_id:

            try:
                parent = Node.objects.get(
                    id=parent_id,
                    owner_id=request.user.id
                )

            except Node.DoesNotExist:
                raise serializers.ValidationError(
                    "Parent folder not found"
                )

            if parent.type != "FOLDER":
                raise serializers.ValidationError(
                    "Parent must be a folder"
                )

            data["parent"] = parent

        else:
            data["parent"] = None

        return data
    
class MySharedNodeSerializer(serializers.Serializer):
    id = serializers.SerializerMethodField()

    share_id = serializers.CharField(source="pk")
    
    user_id = serializers.IntegerField(
        source="shared_with_id"
    )

    username = serializers.SerializerMethodField()

    name = serializers.SerializerMethodField()

    size = serializers.SerializerMethodField()
    mime_type = serializers.SerializerMethodField()
    created_at = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()

    def get_username(self, obj):

        try:
            user = User.objects.get(
                id=obj.shared_with_id
            )
            return user.username
        except User.DoesNotExist:
            return None

    def get_id(self, obj):
        return str(obj.node.id)

    def get_name(self, obj):
        return obj.node.name

    def get_size(self, obj):
        return obj.node.size

    def get_created_at(self, obj):
        return obj.created_at
    
    def get_mime_type(self, obj):
        if obj.node.type != "FILE":
            return None

        mime, _ = mimetypes.guess_type(obj.node.name)

        return mime or "application/octet-stream"
    
    def get_thumbnail_url(self, obj):

        request = self.context.get("request")

        if obj.node.type != "FILE":
            return None

        mime, _ = mimetypes.guess_type(obj.node.name)

        if not mime:
            return None

        if mime.startswith("image/"):
            return request.build_absolute_uri(
                f"/api/thumbnail/{obj.node.id}/"
            )

        if mime.startswith("video/"):
            return request.build_absolute_uri(
                f"/api/thumbnail/{obj.node.id}/"
            )

        return None