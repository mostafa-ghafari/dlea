"""Fill in the plan feature lists a deployed database is missing.

`Plan.plan_features` decides which pages a user's plan unlocks, and migration
0015 added it with an empty default and no backfill — only `seed_data` ever
filled it. A database that was not seeded therefore answered
`/api/plans/limits/` with `features: []` for every plan, and because the
frontend gates on that list, **every** paid page locked the moment a purchase
put a real plan name on a subscription.

    python manage.py sync_plans            # fill blanks (safe to re-run)
    python manage.py sync_plans --force    # overwrite lists an admin curated

Only empty lists are filled unless `--force` is given, so a list an admin has
edited on purpose is never thrown away.
"""

from django.core.management.base import BaseCommand

from api.models import Plan
from api.plan_defaults import PLAN_FEATURES, bullets_for, features_for


class Command(BaseCommand):
    help = "Fill in missing plan feature lists (safe to run repeatedly)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="also overwrite lists that already hold something",
        )

    def handle(self, *args, **options):
        force = options["force"]
        updated = 0
        unknown = []

        for plan in Plan.objects.order_by("slug"):
            if plan.slug not in PLAN_FEATURES:
                unknown.append(plan.slug)
                continue

            fields = []
            if force or not plan.plan_features:
                plan.plan_features = features_for(plan.slug)
                fields.append("plan_features")
            if force or not plan.features:
                plan.features = bullets_for(plan.slug)
                fields.append("features")

            if not fields:
                self.stdout.write(f"  {plan.slug}: already complete, left alone")
                continue

            plan.save(update_fields=fields)
            updated += 1
            self.stdout.write(f"  {plan.slug}: filled {', '.join(fields)}")

        if unknown:
            self.stdout.write(
                self.style.WARNING(
                    "No defaults for: " + ", ".join(unknown) + " — left untouched."
                )
            )
        if updated:
            self.stdout.write(
                self.style.SUCCESS(f"Updated {updated} plan(s).")
            )
            self.stdout.write(
                "The frontend reads this list live; a refresh is enough."
            )
        else:
            self.stdout.write(self.style.SUCCESS("Every plan already has its features."))
