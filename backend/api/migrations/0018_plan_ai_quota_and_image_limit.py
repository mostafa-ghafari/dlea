"""Per-plan AI quota and image limit, so the admin panel can manage them.

Feature gating used to live entirely in `plan_features` (a flat list of
strings), which cannot express "3 requests per week". These fields make the
quotas real numbers the server can enforce.

    free    1 request / month      2 images per entry
    pro     3 requests / week      10 images per entry
    promax  3 requests / day       unlimited images
    vip     unlimited              unlimited images
"""

from django.db import migrations, models


SLUG_DEFAULTS = {
    "free": (1, "month", 2),
    "pro": (3, "week", 10),
    "promax": (3, "day", -1),
    "vip": (-1, "month", -1),
}


def apply_defaults(apps, schema_editor):
    Plan = apps.get_model("api", "Plan")
    for slug, (limit, period, images) in SLUG_DEFAULTS.items():
        Plan.objects.filter(slug=slug).update(
            ai_requests_limit=limit,
            ai_requests_period=period,
            max_images_per_entry=images,
        )


def clear(apps, schema_editor):
    # Nothing to undo beyond the field removal.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0017_goal_portfolio_journalentry_portfolio_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="plan",
            name="ai_requests_limit",
            field=models.IntegerField(default=-1),
        ),
        migrations.AddField(
            model_name="plan",
            name="ai_requests_period",
            field=models.CharField(
                choices=[("day", "روزانه"), ("week", "هفتگی"), ("month", "ماهانه")],
                default="month",
                max_length=8,
            ),
        ),
        migrations.AddField(
            model_name="plan",
            name="max_images_per_entry",
            field=models.IntegerField(default=-1),
        ),
        migrations.RunPython(apply_defaults, clear),
    ]
