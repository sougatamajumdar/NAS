from django.core.management.base import BaseCommand

from storage.maintenance import (
    run_maintenance
)


class Command(BaseCommand):

    help = (
        "Run NAS maintenance"
    )

    def handle(
        self,
        *args,
        **kwargs
    ):

        run_maintenance()

        self.stdout.write(
            self.style.SUCCESS(
                "Maintenance completed"
            )
        )