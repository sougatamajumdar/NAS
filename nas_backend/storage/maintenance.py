import os
import shutil
import logging

from datetime import timedelta

from django.utils import timezone

from .models import (
    UploadSession,
    StorageDisk,
)

logger = logging.getLogger("nas")


def cleanup_uploads():

    cutoff = (
        timezone.now()
        - timedelta(hours=24)
    )

    sessions = UploadSession.objects.filter(
        is_completed=False,
        created_at__lt=cutoff
    )

    count = 0

    for session in sessions:

        try:

            shutil.rmtree(
                session.temp_path,
                ignore_errors=True
            )

            session.delete()

            count += 1

        except Exception as e:

            logger.error(
                f"Upload cleanup failed: {e}"
            )

    logger.info(
        f"Removed {count} stale uploads"
    )


def verify_disks():

    for disk in StorageDisk.objects.all():

        try:

            if (
                disk.is_active and
                not os.path.exists(
                    disk.mount_path
                )
            ):

                logger.warning(
                    f"Disk offline: {disk.name}"
                )

        except Exception as e:

            logger.error(
                f"Disk verification failed: {e}"
            )


def cleanup_backups():

    backup_dir = "backups"

    if not os.path.exists(
        backup_dir
    ):
        return

    cutoff = (
        timezone.now()
        - timedelta(days=30)
    )

    removed = 0

    for filename in os.listdir(
        backup_dir
    ):

        path = os.path.join(
            backup_dir,
            filename
        )

        try:

            modified = timezone.datetime.fromtimestamp(
                os.path.getmtime(path),
                tz=timezone.get_current_timezone()
            )

            if modified < cutoff:

                os.remove(path)

                removed += 1

        except Exception as e:

            logger.error(
                f"Backup cleanup failed: {e}"
            )

    logger.info(
        f"Removed {removed} old backups"
    )


def run_maintenance():

    logger.info(
        "Maintenance started"
    )

    cleanup_uploads()

    verify_disks()

    cleanup_backups()

    logger.info(
        "Maintenance completed"
    )