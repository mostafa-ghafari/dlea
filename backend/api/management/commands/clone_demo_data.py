"""Hand one account its own copy of the shared demo dataset.

The seed commands build a single dataset that nobody owns (`user IS NULL`), and
the API serves those rows to anonymous visitors as a demo. A signed-in account
only ever sees its own rows, so a brand new account opens onto an empty app —
which reads as "all my data disappeared" rather than "the demo is not yours".

This command copies that dataset onto a real account: the portfolios first, then
everything hanging off them, with foreign keys remapped to the copies. The
original rows stay exactly where they are, so the public demo keeps working.

    python manage.py clone_demo_data --email admin@dlea.ir
    python manage.py clone_demo_data --email admin@dlea.ir --replace
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from api.models import (
    AchievementHistory,
    ArchivedReport,
    CalendarDay,
    CoachInsights,
    CoachPeriod,
    EquityCurvePoint,
    Goal,
    JournalEntry,
    JournalGroup,
    MonthlyPerformance,
    Notification,
    Portfolio,
    Trade,
)

# A row may only be copied once the rows it points at exist, because the
# old-id -> new-id map is read while copying. Portfolios first, then the journal
# groups an entry can point at, and so on.
CLONE_ORDER = [
    Portfolio,
    Trade,
    JournalGroup,
    JournalEntry,
    Goal,
    AchievementHistory,
    EquityCurvePoint,
    MonthlyPerformance,
    CalendarDay,
    CoachInsights,
    CoachPeriod,
    ArchivedReport,
    Notification,
]


def _has_user(model) -> bool:
    return any(field.name == "user" for field in model._meta.concrete_fields)


class Command(BaseCommand):
    help = "Give one account its own copy of the shared demo dataset."

    def add_arguments(self, parser):
        parser.add_argument(
            "--email",
            required=True,
            help="email of the account that receives the copy",
        )
        parser.add_argument(
            "--replace",
            action="store_true",
            help="delete whatever the account already has before copying",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        user_model = get_user_model()
        email = options["email"]
        try:
            user = user_model.objects.get(email=email)
        except user_model.DoesNotExist:
            raise CommandError(f"No account with email {email}")

        if options["replace"]:
            self._wipe(user)

        # (model, old pk) -> new pk, so a copy's foreign keys land on copies.
        id_map: dict[tuple[type, int], int] = {}
        for model in CLONE_ORDER:
            rows = list(self._demo_rows(model))
            if not rows:
                continue
            for row in rows:
                clone = self._copy(model, row, user, id_map)
                id_map[(model, row.pk)] = clone.pk
            self.stdout.write(f"  {model.__name__:<20} {len(rows)}")

        self._ensure_single_active(user)

        portfolios = Portfolio.objects.filter(user=user).count()
        trades = Trade.objects.filter(portfolio__user=user).count()
        self.stdout.write(
            self.style.SUCCESS(
                f"{email} now owns {portfolios} portfolios, {trades} trades"
            )
        )

    @staticmethod
    def _demo_rows(model):
        """The rows the anonymous demo owns."""
        if model is Trade:
            # Trades carry no owner of their own; they follow their portfolio.
            return Trade.objects.filter(portfolio__user__isnull=True)
        return model.objects.filter(user__isnull=True)

    @staticmethod
    def _copy(model, row, user, id_map):
        clone = model()
        for field in model._meta.concrete_fields:
            if field.primary_key or field.name == "user":
                continue
            value = getattr(row, field.attname)
            if field.is_relation and value is not None:
                # A relation we did not copy (or that was null) becomes null
                # rather than pointing back at the demo owner's row.
                value = id_map.get((field.related_model, value))
            setattr(clone, field.attname, value)
        if _has_user(model):
            clone.user = user
        clone.save()
        return clone

    @staticmethod
    def _wipe(user):
        """Drop the account's own data so the copy is the only thing left."""
        Portfolio.objects.filter(user=user).delete()  # cascades its trades
        for model in CLONE_ORDER:
            if model is Portfolio or not _has_user(model):
                continue
            model.objects.filter(user=user).delete()

    @staticmethod
    def _ensure_single_active(user):
        """The app assumes exactly one active portfolio per owner."""
        owned = Portfolio.objects.filter(user=user).order_by("id")
        active = list(owned.filter(is_active=True))
        if len(active) > 1:
            keep = active[0]
            owned.filter(is_active=True).exclude(pk=keep.pk).update(is_active=False)
        elif not active:
            first = owned.first()
            if first is not None:
                Portfolio.objects.filter(pk=first.pk).update(is_active=True)
