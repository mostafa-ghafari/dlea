"""Normalize portfolios so exactly one is active per owner.

Before the single-active enforcement was added, every portfolio was created
with is_active=True by default (serializer + model defaults) and creation
never deactivated the previous portfolio. Existing databases can therefore
contain several active portfolios (and the "active" card highlight showed
more than one card as active).

Rule per owner (each user, plus the anonymous demo owner user__isnull=True):
- more than one active  -> keep the lowest-id active one, deactivate the rest
- exactly one active     -> no change
- none active            -> activate the lowest-id portfolio, so the app
                            always has a default active portfolio
"""

from django.db import migrations


def normalize_single_active(apps, schema_editor):
    Portfolio = apps.get_model("api", "Portfolio")

    owners = set(Portfolio.objects.values_list("user_id", flat=True))
    for owner in owners:
        owned = Portfolio.objects.filter(user_id=owner).order_by("id")
        actives = list(owned.filter(is_active=True))
        if len(actives) > 1:
            keep = actives[0]
            Portfolio.objects.filter(user_id=owner, is_active=True).exclude(id=keep.id).update(is_active=False)
        elif len(actives) == 0:
            first = owned.first()
            if first is not None:
                first.is_active = True
                first.save(update_fields=["is_active"])


class Migration(migrations.Migration):
    dependencies = [
        ("api", "0013_coachinsights_portfolio_coachperiod_portfolio_and_more"),
    ]

    operations = [
        migrations.RunPython(normalize_single_active, migrations.RunPython.noop),
    ]