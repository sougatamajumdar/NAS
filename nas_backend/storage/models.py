from mongoengine import *
import datetime


# -------------------------------
# Storage Disk Model
# -------------------------------
class StorageDisk(Document):

    name = StringField(required=True)

    mount_path = StringField(
        required=True,
        unique=True
    )

    total_space = LongField(required=True)

    system_used_space = LongField(default=0)

    nas_used_space = LongField(default=0)

    is_active = BooleanField(default=True)

    created_at = DateTimeField(
        default=datetime.datetime.utcnow
    )

    last_checked = DateTimeField(
        default=datetime.datetime.utcnow
    )

    meta = {
        "collection": "storage_disks",
        "indexes": [
            "is_active",
            "mount_path",
        ]
    }
    

# -------------------------------
# User Storage Mapping
# -------------------------------
class UserStorageMapping(Document):

    user_id = IntField(
        required=True
    )

    disk = ReferenceField(
        StorageDisk,
        required=True
    )

    storage_path = StringField(
        required=True
    )

    is_primary = BooleanField(
        default=False
    )

    created_at = DateTimeField(
        default=datetime.datetime.utcnow
    )

    meta = {
        "collection": "user_storage_mappings",
        "indexes": [
            "user_id",
            "disk",
            ("user_id", "disk"),
        ]
    }


# -------------------------------
# Node Model
# -------------------------------
class Node(Document):

    NODE_TYPE = ("FILE", "FOLDER")

    name = StringField(required=True)

    type = StringField(
        required=True,
        choices=NODE_TYPE
    )

    owner_id = IntField(required=True)

    parent = ReferenceField(
        "self",
        null=True
    )

    disk = ReferenceField(
        StorageDisk,
        null=True
    )

    file_path = StringField()

    size = LongField(default=0)

    file_hash = StringField()
    
    thumbnail_path = StringField()
    
    created_at = DateTimeField(
        default=datetime.datetime.utcnow
    )

    meta = {
        "collection": "nodes",
        "indexes": [
            "owner_id",
            "parent",
            ("owner_id", "parent"),
            ("owner_id", "name"),
            ("disk", "type"),

            {
                "fields": ["$name"],
                "default_language": "english"
            }
        ]
    }


# -------------------------------
# Upload Session
# -------------------------------
class UploadSession(Document):

    upload_id = StringField(
        required=True,
        unique=True
    )

    owner_id = IntField(required=True)

    filename = StringField(required=True)

    total_size = LongField(required=True)

    total_chunks = IntField(required=True)

    uploaded_chunks = ListField(
        IntField(),
        default=list
    )

    chunk_size = IntField(required=True)

    parent = ReferenceField(
        Node,
        null=True
    )

    disk = ReferenceField(
        StorageDisk,
        required=True
    )

    temp_path = StringField(required=True)

    is_completed = BooleanField(default=False)

    created_at = DateTimeField(
        default=datetime.datetime.utcnow
    )
    file_hash = StringField()
    meta = {
        "collection": "upload_sessions",
        "indexes": [
            "upload_id",
            "owner_id",
            "is_completed",
        ]
    }

# -------------------------------
# Share Model
# -------------------------------
class Share(Document):
    
    node = ReferenceField(
        Node,
        required=True,
        reverse_delete_rule=CASCADE
    )

    shared_by_id = IntField(required=True) 

    shared_with_id = IntField(required=True)

    permission = StringField(default="VIEW")

    created_at = DateTimeField(
        default=datetime.datetime.utcnow
    )

    meta = {
        "collection": "shares",
        "indexes": [
            "shared_by_id",  
            "shared_with_id",
            "node",
            {
                "fields": [
                    "shared_with_id",
                    "node"
                ],
                "unique": True
            }
        ]
    }


# -------------------------------
# Backup Model
# -------------------------------
class BackupRecord(Document):

    backup_type = StringField(
        required=True,
        choices=["USER", "DISK"]
    )

    user_id = IntField()

    disk = ReferenceField(
        StorageDisk,
        required=False,
        null=True
    )

    backup_file = StringField(required=True)

    created_by = IntField(required=True)

    created_at = DateTimeField(
        default=datetime.datetime.utcnow
    )

    meta = {
        "collection": "backup_records",
        "indexes": [
            "backup_type",
            "created_at",
        ]
    }