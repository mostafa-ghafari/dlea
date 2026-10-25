"""Repair the badge catalogue: one capital-doubling title, four descriptions.

The badge titles and descriptions come from `seed_data`, but a database that was
seeded once already holds them as rows — editing the seed alone would leave the
running site showing the old copy. Three descriptions were rewritten, and
«دابل کردن سرمایه» is renamed to «دو برابر کردن سرمایه»; the rename happens in
place because `AchievementSerializer` keys its earned rules on the title, so
inserting a second row would leave the real one permanently locked.

A duplicate «۳۰ روز متوالی ژورنال‌نویسی» row is *not* deleted here: the section
rendered it twice only because the frontend catalogue spelled the title
«ژورال», which kept the API row from matching. The catalogue now matches, and
the merge collapses duplicates by title, so any extra row stays invisible while
nothing a user earned is thrown away.

Matching is done on the normalized title (ZWNJ → space, no trailing period), the
same normalization `fix_achievements` applies, so this is idempotent and works
against rows written before or after that command ran.
"""

from django.db import migrations

ZWNJ = "\u200c"

# normalized old title -> (new title, new description or None to keep it)
CATALOGUE_FIXES = {
    "کاهش دراودان ۵٪": ("کاهش دراودان ۵٪", "ریسک حسابت را کم کردی"),
    "بدون Overtrading در ۲ هفته": (
        "بدون Overtrading در ۲ هفته",
        "حفظ سرمایه در بلندمدت",
    ),
    "۱۰ معامله A+ متوالی": (
        "۱۰ معامله A+ متوالی",
        "ورود دقیقا طبق پلن معاملاتی",
    ),
    "دابل کردن سرمایه": (
        "دو برابر کردن سرمایه",
        "سرمایه اولیه‌ات را دو برابر کردی",
    ),
}


def _normalize(text: str) -> str:
    return text.replace(ZWNJ, " ").rstrip(".").strip()


def repair_badges(apps, schema_editor):
    Achievement = apps.get_model("api", "Achievement")

    for achievement in Achievement.objects.all().iterator():
        fix = CATALOGUE_FIXES.get(_normalize(achievement.title))
        if fix is None:
            continue
        title, desc = fix
        fields = []
        if achievement.title != title:
            achievement.title = title
            fields.append("title")
        if desc is not None and achievement.desc != desc:
            achievement.desc = desc
            fields.append("desc")
        if fields:
            achievement.save(update_fields=fields)


def noop(apps, schema_editor):
    """Nothing to undo — the old copy was the bug this repairs."""


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0024_coupon_payment_coupon_code_payment_discount_rial"),
    ]

    operations = [
        migrations.RunPython(repair_badges, noop),
    ]
