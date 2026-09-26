"""Make every stored coach report agree with itself about «پایبندی به پلن».

Reports generated before the coach defined plan adherence once carried two
different numbers for the same thing: the AI's own estimate in the score card
(35/100) and the computed value in the «آمار بازه» row (100%). The score card
is now derived from the computed number instead of the model's opinion, so the
rows already saved have to be brought in line as well.

The stored stat wins: it is the number the generator itself computed for that
report. Older periods cannot be recomputed exactly — the risk caps live in the
trader's browser and were never saved — so a regenerated report is the way to
refresh one with the current formula.

Only the two fields that disagreed are touched, and the function is
idempotent, so re-running it on a synced row changes nothing.
"""

import re

from django.db import migrations

FA_DIGITS = str.maketrans("۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩", "01234567890123456789")
PLAN_LABEL = "پایبندی به پلن"
PERCENT = re.compile(r"^([0-9]+(?:\.[0-9]+)?)%$")


def _stored_adherence(stats):
    """`«پایبندی به پلن»` of the «آمار بازه» rows (`۳۵٪` / `35%`) as an int."""
    for item in stats or []:
        if not isinstance(item, dict) or str(item.get("label", "")).strip() != PLAN_LABEL:
            continue
        text = str(item.get("value", "")).translate(FA_DIGITS).replace("٪", "%").strip()
        match = PERCENT.match(text)
        if match:
            return int(round(float(match.group(1))))
    return None


def sync_plan_scores(apps, schema_editor):
    CoachPeriod = apps.get_model("api", "CoachPeriod")

    for period in CoachPeriod.objects.all().iterator():
        value = _stored_adherence(period.stats)
        if value is None:
            continue
        scores = []
        matched = False
        for item in period.scores or []:
            if isinstance(item, dict) and str(item.get("label", "")).strip() == PLAN_LABEL:
                item = {**item, "value": value}
                matched = True
            scores.append(item)
        # A report without that card has no second number to disagree with.
        if not matched:
            continue
        period.scores = scores
        period.save(update_fields=["scores"])


def noop(apps, schema_editor):
    """Nothing to undo — the old split was the bug this repairs."""


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0021_normalize_coach_numbers"),
    ]

    operations = [
        migrations.RunPython(sync_plan_scores, noop),
    ]
