"""Normalize achievement text so the UI shows a space instead of ZWNJ, no trailing period."""

from django.core.management.base import BaseCommand

from api.models import Achievement

ZWNJ = "\u200c"


def _clean(text: str) -> str:
    return text.replace(ZWNJ, " ").rstrip(".")


class Command(BaseCommand):
    help = "Replace ZWNJ half-spaces with a space and drop trailing periods"

    def handle(self, *args, **options):
        updated = 0
        for a in Achievement.objects.all():
            title = _clean(a.title)
            desc = _clean(a.desc)
            if title != a.title or desc != a.desc:
                a.title = title
                a.desc = desc
                a.save(update_fields=["title", "desc"])
                updated += 1
                self.stdout.write(f"  Fixed: {title}")
        self.stdout.write(f"Updated {updated} achievements")
