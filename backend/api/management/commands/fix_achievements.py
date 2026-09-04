"""Fix achievement descriptions with correct Persian spelling."""
from django.core.management.base import BaseCommand
from api.models import Achievement

FIXES = {
    "ژورالنویسی": "ژورنال‌نویسی",
    "ثبتشده": "ثبت‌شده",
    "اثباتشده": "اثبات‌شده",
    "قوائمث تربد": "قوانین ترید",
    "حداقل درآمدان": "حداقل درآمدتان",
    "تصیف": "تضمین",
    "اقیابیده": "ایجاد کردید",
    "تیکخورده": "تیک‌خورده",
    "ثبت شده باشد": "ثبت‌شده باشد",
    "ثبت نشده": "ثبت‌نشده",
}

class Command(BaseCommand):
    help = "Fix Persian spelling in achievement descriptions"

    def handle(self, *args, **options):
        updated = 0
        for a in Achievement.objects.all():
            original = a.desc
            for old, new in FIXES.items():
                a.desc = a.desc.replace(old, new)
            if a.desc != original:
                a.save(update_fields=["desc"])
                updated += 1
                self.stdout.write(f"  Fixed: {a.title}")
        self.stdout.write(f"Updated {updated} achievements")
