from .models import StorageDisk, Node, UserStorageMapping
import os
import shutil
from datetime import datetime


BACKUP_ROOT = "backups"

# ------------------------------------------------
# CHECK USER DISK STATUS
# ------------------------------------------------
def get_user_disk_status(user_id):

    mappings = UserStorageMapping.objects.filter(
        user_id=user_id
    )

    disks_data = []

    has_active_disk = False

    for mapping in mappings:

        disk = mapping.disk

        if not disk:
            continue

        disk_online = False

        disk_writable = False

        try:

            disk_online = os.path.exists(
                disk.mount_path
            )

            disk_writable = os.access(
                disk.mount_path,
                os.W_OK
            )

            if disk_online and disk_writable:
                has_active_disk = True

            usage = shutil.disk_usage(
                disk.mount_path
            )

            disks_data.append({
                "disk_id": str(disk.id),
                "disk_name": disk.name,
                "mount_path": disk.mount_path,

                "is_active": disk.is_active,

                "is_online": disk_online,

                "is_writable": disk_writable,

                "is_primary": mapping.is_primary,

                "total_space": usage.total,
                "used_space": usage.used,
                "free_space": usage.free,
            })

        except Exception:

            disks_data.append({
                "disk_id": str(disk.id),
                "disk_name": disk.name,
                "mount_path": disk.mount_path,

                "is_active": disk.is_active,

                "is_online": False,

                "is_writable": False,

                "is_primary": mapping.is_primary,

                "total_space": None,
                "used_space": None,
                "free_space": None,
            })

    return {
        "has_active_disk": has_active_disk,
        "disks": disks_data
    }



# ------------------------------------------------
# GET BEST AVAILABLE DISK
# ------------------------------------------------
def get_available_disk(user_id, required_size=0):

    MIN_FREE_SPACE = 1024 * 1024 * 500

    # ----------------------------------------
    # CHECK EXISTING USER DISKS
    # ----------------------------------------
    mappings = UserStorageMapping.objects.filter(
        user_id=user_id
    )

    for mapping in mappings:

        disk = mapping.disk

        if not disk or not disk.is_active:
            continue

        try:

            if not os.path.exists(
                disk.mount_path
            ):
                continue

            if not os.access(
                disk.mount_path,
                os.W_OK
            ):
                continue

            usage = shutil.disk_usage(
                disk.mount_path
            )

            free_needed = (
                required_size +
                MIN_FREE_SPACE
            )

            if usage.free > free_needed:

                return disk

        except Exception:
            continue

    # ----------------------------------------
    # FIND NEW DISK
    # ----------------------------------------
    disks = StorageDisk.objects.filter(
        is_active=True
    )

    best_disk = None
    best_free = 0

    for disk in disks:

        try:

            if not os.path.exists(
                disk.mount_path
            ):
                continue

            if not os.access(
                disk.mount_path,
                os.W_OK
            ):
                continue

            usage = shutil.disk_usage(
                disk.mount_path
            )

            if usage.free > best_free:

                best_free = usage.free
                best_disk = disk

        except Exception:
            continue

    if not best_disk:

        raise Exception(
            "No writable disks available"
        )

    # ----------------------------------------
    # CREATE NEW USER STORAGE
    # ----------------------------------------
    existing_count = UserStorageMapping.objects.filter(
        user_id=user_id
    ).count()

    storage_path = os.path.join(
        best_disk.mount_path,
        "nas_storage",
        "users",
        f"user_{user_id}",
        f"storage_{existing_count + 1}"
    )

    UserStorageMapping(
        user_id=user_id,
        disk=best_disk,
        storage_path=storage_path,
        is_primary=(existing_count == 0)
    ).save()

    return best_disk


# ------------------------------------------------
# REFRESH DISK USAGE
# ------------------------------------------------
def refresh_disk_usage(disk):

    usage = shutil.disk_usage(
        disk.mount_path
    )

    nas_used = 0

    nodes = Node.objects.filter(
        disk=disk,
        type="FILE"
    )

    for node in nodes:
        nas_used += node.size

    disk.total_space = usage.total

    disk.system_used_space = usage.used

    disk.nas_used_space = nas_used

    disk.last_checked = datetime.utcnow()

    disk.save()


# ------------------------------------------------
# DELETE NODE RECURSIVELY
# ------------------------------------------------
def delete_node_recursive(node):

    if node.type == "FILE":

        disk = node.disk

        if node.file_path and os.path.exists(node.file_path):
            try:
                os.remove(node.file_path)
            except Exception:
                pass

        node.delete()

        if disk:
            refresh_disk_usage(disk)

        return

    children = Node.objects.filter(parent=node)

    for child in children:
        delete_node_recursive(child)

    node.delete()


# ------------------------------------------------
# CHECK DISK EMPTY
# ------------------------------------------------
def is_disk_empty(disk):

    return Node.objects.filter(
        disk=disk
    ).count() == 0


# ------------------------------------------------
# DELETE USER DATA
# ------------------------------------------------
def delete_user_and_data(user):

    root_nodes = Node.objects.filter(
        owner_id=user.id
    )

    for node in root_nodes:
        delete_node_recursive(node)

    user.delete()


# ------------------------------------------------
# USER BACKUP
# ------------------------------------------------
def create_user_backup(user_id):

    os.makedirs(BACKUP_ROOT, exist_ok=True)

    nodes = Node.objects.filter(
        owner_id=user_id
    )

    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    backup_name = f"user_{user_id}_{timestamp}"

    temp_dir = os.path.join(
        BACKUP_ROOT,
        backup_name
    )

    os.makedirs(temp_dir, exist_ok=True)

    for node in nodes:

        if node.type != "FILE":
            continue

        if not os.path.exists(node.file_path):
            continue

        filename = os.path.basename(
            node.file_path
        )

        shutil.copy2(
            node.file_path,
            os.path.join(temp_dir, filename)
        )

    zip_path = shutil.make_archive(
        temp_dir,
        "zip",
        temp_dir
    )

    shutil.rmtree(temp_dir)

    return zip_path


# ------------------------------------------------
# DISK BACKUP
# ------------------------------------------------
def create_disk_backup(disk):

    os.makedirs(BACKUP_ROOT, exist_ok=True)

    timestamp = datetime.now().strftime(
        "%Y%m%d_%H%M%S"
    )

    backup_name = f"disk_{disk.name}_{timestamp}"

    backup_path = os.path.join(
        BACKUP_ROOT,
        backup_name
    )

    zip_path = shutil.make_archive(
        backup_path,
        "zip",
        disk.mount_path
    )

    return zip_path