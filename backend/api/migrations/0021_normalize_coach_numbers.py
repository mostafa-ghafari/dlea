"""Rewrite the stored coach numbers with Latin digits and a leading `$`.

Reports saved before the generator was fixed carry Persian digits with the
currency sign on the far side (`+۱۰$`, `۳۳.۳٪`), while the coach page and the
generator both spell money sign-first with Latin digits (`+$10`, `33.3%`). The
API therefore answered with a different shape than the page rendered.

Only the numeric fields are touched: `net`, `win_rate` and the `stats` values.
Jalali labels, ranges and the Persian prose keep their form, and the function
is idempotent, so re-running it on normalised rows changes nothing.
"""

import re

from django.db import migrations

FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")

# `+1,326$` — sign, grouped amount, currency sign at the end.
TRAILING_DOLLAR = re.compile(r"^([+-])([0-9][0-9,.]*)\$$")


def coach_number(text):
    """`۳۳.۳٪` → `33.3%`, `+۱,۳۲۶$` → `+$1,326`, anything else as it is."""
    if not isinstance(text, str):
        return text
    latin = text.translate(FA_DIGITS).replace("٪", "%")
    match = TRAILING_DOLLAR.match(latin)
    return f"{match.group(1)}${match.group(2)}" if match else latin


def normalize_coach_numbers(apps, schema_editor):
    CoachPeriod = apps.get_model("api", "CoachPeriod")
    ArchivedReport = apps.get_model("api", "ArchivedReport")

    for period in CoachPeriod.objects.all().iterator():
        stats = []
        for item in period.stats or []:
            if isinstance(item, dict):
                item = {**item, "value": coach_number(item.get("value"))}
            stats.append(item)
        period.net = coach_number(period.net)
        period.win_rate = coach_number(period.win_rate)
        period.stats = stats
        period.save(update_fields=["net", "win_rate", "stats"])

    for report in ArchivedReport.objects.all().iterator():
        report.net = coach_number(report.net)
        report.win_rate = coach_number(report.win_rate)
        report.save(update_fields=["net", "win_rate"])


def noop(apps, schema_editor):
    """Nothing to undo — the old shape was the bug this repairs."""


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0020_backfill_plan_features"),
    ]

    operations = [
        migrations.RunPython(normalize_coach_numbers, noop),
    ]
