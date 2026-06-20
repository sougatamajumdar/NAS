from django.core.management.base import BaseCommand
from storage.services import cleanup_old_uploads

class Command(BaseCommand):

    help = "Cleanup stale upload sessions"

    def handle(self, *args, **kwargs):
        cleanup_old_uploads()

        self.stdout.write(
            self.style.SUCCESS(
                "Old uploads cleaned"
            )
        )