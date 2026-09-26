"""Migration tests (moved from the legacy api/tests.py)."""

from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.test import TransactionTestCase

from api.models import ArchivedReport, CoachPeriod, Portfolio

TARGET_0013 = ("api", "0013_coachinsights_portfolio_coachperiod_portfolio_and_more")
TARGET_0020 = ("api", "0020_backfill_plan_features")
TARGET_0021 = ("api", "0021_normalize_coach_numbers")


class PortfolioActiveMigrationTests(TransactionTestCase):
    """Migration 0014 repairs legacy data where several portfolios were active."""

    def test_0014_normalizes_single_active_portfolio(self):
        executor = MigrationExecutor(connection)
        # Move the test DB back to the pre-fix state.
        executor.migrate([TARGET_0013])

        old_apps = executor.loader.project_state([TARGET_0013]).apps
        OldPortfolio = old_apps.get_model("api", "Portfolio")
        OldUser = old_apps.get_model("auth", "User")

        u1 = OldUser.objects.create_user(username="u1", password="x")
        u2 = OldUser.objects.create_user(username="u2", password="x")

        def mk(name, user, active):
            return OldPortfolio.objects.create(
                name=name, broker="B", balance=100, initial=100,
                leverage="1:100", user=user, is_active=active,
            )

        # User 1: two active portfolios (legacy bug) -> keep lowest id
        mk("u1-a", u1, True)
        mk("u1-b", u1, True)
        mk("u1-c", u1, False)
        # User 2: none active -> activate the lowest id
        mk("u2-a", u2, False)
        mk("u2-b", u2, False)
        # Demo owner (user=None): both active -> keep lowest id
        mk("demo-a", None, True)
        mk("demo-b", None, True)

        # Apply the normalization migration.
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())

        state = {(p.user_id, p.name): p.is_active for p in Portfolio.objects.all()}
        self.assertIs(state[(u1.id, "u1-a")], True)
        self.assertIs(state[(u1.id, "u1-b")], False)
        self.assertIs(state[(u1.id, "u1-c")], False)
        self.assertIs(state[(u2.id, "u2-a")], True)
        self.assertIs(state[(u2.id, "u2-b")], False)
        self.assertIs(state[(None, "demo-a")], True)
        self.assertIs(state[(None, "demo-b")], False)
        self.assertEqual(Portfolio.objects.filter(is_active=True).count(), 3)


class CoachNumberMigrationTests(TransactionTestCase):
    """Migration 0021 repairs reports saved with Persian digits and a `$` at the end."""

    def test_0021_normalizes_stored_coach_numbers(self):
        executor = MigrationExecutor(connection)
        executor.migrate([TARGET_0020])

        old_apps = executor.loader.project_state([TARGET_0020]).apps
        OldPeriod = old_apps.get_model("api", "CoachPeriod")
        OldArchive = old_apps.get_model("api", "ArchivedReport")

        OldPeriod.objects.create(
            id="AI-W-1405-7-1",
            scope="weekly",
            sort_key=1,
            label="هفته ۱ مهر",
            range="۱۴۰۵/۰۷/۰۲ تا ۱۴۰۵/۰۷/۰۳",
            summary="خلاصه",
            net="+۱۰$",
            win_rate="۳۳.۳٪",
            scores=[],
            stats=[
                {"label": "سود خالص", "value": "+۱۰$"},
                {"label": "تعداد معامله", "value": "۹"},
                {"label": "Win Rate", "value": "۳۳.۳٪"},
            ],
            weaknesses=[],
            strengths=[],
            highlights=[],
            action_plan=[],
        )
        OldArchive.objects.create(
            id="W-1405-07-1",
            kind="weekly",
            year="۱۴۰۵",
            month="مهر",
            title="گزارش هفته ۱ مهر",
            range="۱۴۰۵/۰۷/۰۲ تا ۱۴۰۵/۰۷/۰۳",
            net="+۹۹۰$",
            win_rate="۴۰٪",
            lines=[],
            sort_key=1,
        )

        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())

        period = CoachPeriod.objects.get(id="AI-W-1405-7-1")
        self.assertEqual(period.net, "+$10")
        self.assertEqual(period.win_rate, "33.3%")
        self.assertEqual([s["value"] for s in period.stats], ["+$10", "9", "33.3%"])
        # Jalali labels and ranges keep their Persian form.
        self.assertEqual(period.label, "هفته ۱ مهر")
        self.assertEqual(period.range, "۱۴۰۵/۰۷/۰۲ تا ۱۴۰۵/۰۷/۰۳")

        report = ArchivedReport.objects.get(id="W-1405-07-1")
        self.assertEqual(report.net, "+$990")
        self.assertEqual(report.win_rate, "40%")
        self.assertEqual(report.year, "۱۴۰۵")


class CoachPlanScoreMigrationTests(TransactionTestCase):
    """Migration 0022 syncs the score card with the «آمار بازه» row.

    Those reports were generated while the card was still the model's own
    estimate — 35/100 next to a computed 100% — so the stored card is brought
    in line with the stored percentage.
    """

    def _old_period(self, OldPeriod, **extra):
        defaults = {
            "scope": "monthly",
            "sort_key": 1,
            "label": "مهر ۱۴۰۵",
            "range": "۱۴۰۵/۰۶/۰۱ تا ۱۴۰۵/۰۶/۳۰",
            "summary": "خلاصه",
            "net": "+$10",
            "win_rate": "30%",
            "scores": [],
            "stats": [],
            "weaknesses": [],
            "strengths": [],
            "highlights": [],
            "action_plan": [],
        }
        defaults.update(extra)
        return OldPeriod.objects.create(**defaults)

    def test_0022_makes_the_stored_plan_numbers_agree(self):
        executor = MigrationExecutor(connection)
        executor.migrate([TARGET_0021])

        old_apps = executor.loader.project_state([TARGET_0021]).apps
        OldPeriod = old_apps.get_model("api", "CoachPeriod")

        self._old_period(
            OldPeriod,
            id="AI-M-1405-06",
            scores=[
                {"label": "نظم معاملاتی", "value": 30},
                {"label": "پایبندی به پلن", "value": 35},
            ],
            stats=[
                {"label": "سود خالص", "value": "+$8"},
                {"label": "پایبندی به پلن", "value": "100%"},
            ],
        )
        # Persian digits are what the oldest rows carry; a report without the
        # card has no second number to disagree with.
        self._old_period(
            OldPeriod,
            id="AI-M-1405-05",
            scores=[{"label": "نظم معاملاتی", "value": 30}],
            stats=[{"label": "پایبندی به پلن", "value": "۷۵٪"}],
        )

        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())

        period = CoachPeriod.objects.get(id="AI-M-1405-06")
        self.assertEqual([s["value"] for s in period.scores], [30, 100])
        self.assertEqual(period.scores[0]["label"], "نظم معاملاتی")
        # The «آمار بازه» row is the source and stays as it was.
        self.assertEqual([s["value"] for s in period.stats], ["+$8", "100%"])

        untouched = CoachPeriod.objects.get(id="AI-M-1405-05")
        self.assertEqual([s["value"] for s in untouched.scores], [30])