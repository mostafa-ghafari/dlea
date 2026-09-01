"""DRF serializers.

Field names deliberately match the TypeScript types in `src/lib/mock-data.ts`
and `src/lib/platform-store.tsx` so the React app can consume the API with
zero contract changes. Dates/times are emitted as Persian (Jalali) strings.
"""

from django.db.models import Count, Q, Sum
from rest_framework import serializers

from . import jutils
from .models import (
    Achievement,
    AchievementHistory,
    ArchivedReport,
    AuditEntry,
    CalendarDay,
    CoachInsights,
    CoachPeriod,
    EconomicEvent,
    EquityCurvePoint,
    ForexSymbol,
    Goal,
    JournalEntry,
    JournalGroup,
    MonthlyPerformance,
    NewsItem,
    Notification,
    Payment,
    Plan,
    PlatformUser,
    Portfolio,
    ReferralLink,
    RoleTier,
    Strategy,
    Subscription,
    Ticket,
    TicketMessage,
    Trade,
    TradeColumn,
)


# ---------------------------------------------------------------------------
# Catalog
# ---------------------------------------------------------------------------

class ForexSymbolSerializer(serializers.ModelSerializer):
    class Meta:
        model = ForexSymbol
        fields = ["code"]


class StrategySerializer(serializers.ModelSerializer):
    class Meta:
        model = Strategy
        fields = ["name"]


class TradeColumnSerializer(serializers.ModelSerializer):
    defaultVisible = serializers.BooleanField(source="default_visible")
    adminEnabled = serializers.BooleanField(source="admin_enabled")

    class Meta:
        model = TradeColumn
        fields = ["key", "label", "defaultVisible", "adminEnabled", "numeric"]


class RoleTierSerializer(serializers.ModelSerializer):
    minPct = serializers.IntegerField(source="min_pct")
    maxPct = serializers.IntegerField(source="max_pct")

    class Meta:
        model = RoleTier
        fields = ["level", "minPct", "maxPct", "name"]


class EconomicEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = EconomicEvent
        fields = ["id", "time", "currency", "title", "impact", "forecast", "previous"]


# ---------------------------------------------------------------------------
# Trading domain
# ---------------------------------------------------------------------------

class PortfolioSerializer(serializers.ModelSerializer):
    """Portfolio card. Trades/PnL/balance are computed live from the trades."""

    id = serializers.CharField(source="pk", read_only=True)
    strategy = serializers.CharField(required=False, allow_blank=True)
    initial = serializers.FloatField()
    balance = serializers.SerializerMethodField()
    trades = serializers.SerializerMethodField()
    pnl = serializers.SerializerMethodField()
    winRate = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = [
            "id", "name", "broker", "type", "balance", "initial", "leverage",
            "currency", "trades", "status", "strategy", "pnl", "winRate",
        ]
        read_only_fields = ["balance", "trades", "pnl", "winRate"]

    def _agg(self, obj):
        cached = getattr(obj, "_dlea_agg", None)
        if cached is None:
            cached = obj.trade_set.aggregate(
                total=Sum("pnl"),
                wins=Count("id", filter=Q(pnl__gt=0)),
                count=Count("id"),
            )
            obj._dlea_agg = cached
        return cached

    def get_trades(self, obj):
        return self._agg(obj)["count"] or 0

    def get_pnl(self, obj):
        return round(float(self._agg(obj)["total"] or 0), 2)

    def get_balance(self, obj):
        return round(float(obj.initial or 0) + self.get_pnl(obj), 2)

    def get_winRate(self, obj):
        agg = self._agg(obj)
        count = agg["count"] or 0
        if not count:
            return 0.0
        return round((agg["wins"] or 0) / count * 100, 1)

    def create(self, validated_data):
        # `balance` is now a computed field; seed the model column from `initial`
        # so the required column is populated at creation time.
        validated_data.setdefault("balance", validated_data.get("initial", 0))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        # balance is derived from trades — ignore manual balance edits.
        validated_data.pop("balance", None)
        return super().update(instance, validated_data)


class TradeSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    openTime = serializers.SerializerMethodField()
    closeTime = serializers.SerializerMethodField()
    duration = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    portfolio = serializers.SerializerMethodField()
    followedPlan = serializers.BooleanField(source="followed_plan", required=False)
    comment = serializers.CharField(required=False, allow_blank=True)
    entry = serializers.FloatField()
    exit = serializers.FloatField()
    sl = serializers.FloatField()
    tp = serializers.FloatField()
    volume = serializers.FloatField()
    pnl = serializers.FloatField()
    rr = serializers.FloatField()
    pips = serializers.FloatField()
    commission = serializers.FloatField(required=False)
    swap = serializers.FloatField(required=False)
    taxes = serializers.FloatField(required=False)
    strategy = serializers.CharField(required=False, allow_blank=True)
    # write-only fields used when creating/importing trades
    open_time = serializers.DateTimeField(write_only=True, required=False)
    close_time = serializers.DateTimeField(write_only=True, required=False)
    portfolio_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = Trade
        fields = [
            "id", "ticket", "symbol", "side", "entry", "exit", "sl", "tp", "volume",
            "pnl", "rr", "pips", "commission", "swap", "taxes", "openTime", "closeTime",
            "duration", "magic", "comment", "reason", "strategy", "date", "portfolio",
            "followedPlan", "emotion", "screenshots", "open_time", "close_time", "portfolio_id",
        ]

    def get_openTime(self, obj):
        return jutils.to_jalali(obj.open_time)

    def get_closeTime(self, obj):
        return jutils.to_jalali(obj.close_time)

    def get_duration(self, obj):
        return jutils.duration_fa(obj.open_time, obj.close_time)

    def get_date(self, obj):
        return jutils.to_jalali_date(obj.close_time.date())

    def get_portfolio(self, obj):
        return obj.portfolio.name if obj.portfolio else None


# ---------------------------------------------------------------------------
# Journal
# ---------------------------------------------------------------------------

class JournalGroupSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)

    class Meta:
        model = JournalGroup
        fields = ["id", "name", "color"]


class JournalEntrySerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    tradeId = serializers.CharField(source="trade_id")
    groupId = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    week = serializers.CharField(required=False)
    month = serializers.CharField(required=False)
    # write-only fields used when creating/updating entries
    entryDate = serializers.DateField(write_only=True, required=False, source="date")
    group_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = JournalEntry
        fields = [
            "id", "date", "week", "month", "tradeId", "symbol", "title", "mistakes",
            "lesson", "emotion", "plan", "favorite", "groupId", "html", "blocks", "images",
            "entryDate", "group_id",
        ]

    def create(self, validated_data):
        from django.utils import timezone

        validated_data.setdefault("date", timezone.localdate())
        validated_data.setdefault("week", "هفته جاری")
        validated_data.setdefault("month", "ماه جاری")
        return super().create(validated_data)

    def get_date(self, obj):
        return jutils.to_jalali_date(obj.date)

    def get_groupId(self, obj):
        return str(obj.group_id) if obj.group_id else None


class GoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Goal
        fields = ["id", "title", "progress"]


# ---------------------------------------------------------------------------
# Achievements
# ---------------------------------------------------------------------------

class AchievementSerializer(serializers.ModelSerializer):
    earned = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = ["id", "title", "desc", "earned", "rule"]

    def get_earned(self, obj):
        """Compute earned per-user based on actual trade/portfolio data."""
        request = self.context.get("request")
        if not request or not request.user or not request.user.is_authenticated:
            return False
        user = request.user
        from .models import Trade, Portfolio
        trades = Trade.objects.filter(portfolio__user=user)
        count = trades.count()
        if count == 0:
            return False
        # Simple heuristic: earned if user has enough activity
        # id range mapping from seed: 113-128 (16 achievements)
        obj_id = obj.id
        total_pnl = sum(float(t.pnl or 0) for t in trades)
        win_count = trades.filter(pnl__gt=0).count()
        win_rate = (win_count / count * 100) if count else 0
        portfolio_count = Portfolio.objects.filter(user=user).count()
        has_mt = portfolio_count > 0 and trades.count() > 0
        # Map achievement rules to simple checks
        rules = {
            113: count >= 10,               # 7 consecutive plan days → approx trades >= 10
            114: total_pnl > 0,              # drawdown reduction → simplified
            115: count >= 20,                 # no revenge trade → approx
            116: count >= 100,                # 100 trades
            117: win_rate > 50 and count >= 20, # PF > 2
            118: count >= 30,                 # no emotional entry → approx
            119: count >= 1,                  # first trade
            120: count >= 30,                 # 30 days journaling
            121: total_pnl > 0,               # profitable month
            122: win_rate > 70 and count >= 20, # WR > 70%
            123: count >= 50,                 # risk < 1%
            124: count < 50,                  # no overtrading (less than threshold)
            125: total_pnl > 0 and count >= 5, # double capital
            126: count >= 10,                 # 10 A+ trades
            127: has_mt,                      # MT connected
            128: count >= 50,                 # checklist master
        }
        return rules.get(obj.id, count >= 1)


class AchievementHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AchievementHistory
        fields = ["month", "earned", "count"]


# ---------------------------------------------------------------------------
# Plans / subscription / admin
# ---------------------------------------------------------------------------

class PlanSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="slug", read_only=True)
    portfolioLimit = serializers.CharField(source="portfolio_limit")

    class Meta:
        model = Plan
        fields = ["id", "name", "price", "unit", "tagline", "portfolioLimit", "features", "cta", "highlight", "sellable", "users"]


class SubscriptionSerializer(serializers.ModelSerializer):
    startDate = serializers.SerializerMethodField()
    endDate = serializers.SerializerMethodField()
    totalDays = serializers.IntegerField(source="total_days")
    daysLeft = serializers.IntegerField(source="days_left")

    class Meta:
        model = Subscription
        fields = ["plan", "startDate", "endDate", "totalDays", "daysLeft", "price"]

    def get_startDate(self, obj):
        return jutils.to_jalali_date(obj.start_date)

    def get_endDate(self, obj):
        return jutils.to_jalali_date(obj.end_date)


class PlatformUserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    joined = serializers.SerializerMethodField()

    class Meta:
        model = PlatformUser
        fields = ["id", "name", "email", "plan", "status", "role", "joined"]

    def get_joined(self, obj):
        return jutils.to_jalali_date(obj.joined)


class PaymentSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ["id", "user", "plan", "amount", "date", "status"]

    def get_date(self, obj):
        return jutils.to_jalali_date(obj.date)


class ReferralLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReferralLink
        fields = ["id", "name", "code", "clicks", "signups"]


# ---------------------------------------------------------------------------
# Platform content
# ---------------------------------------------------------------------------

class NewsItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    date = serializers.SerializerMethodField()
    entryDate = serializers.DateField(write_only=True, required=False, source="date")

    class Meta:
        model = NewsItem
        fields = ["id", "title", "summary", "body", "category", "date", "pinned", "entryDate"]

    def create(self, validated_data):
        from django.utils import timezone

        validated_data.setdefault("date", timezone.localdate())
        return super().create(validated_data)

    def get_date(self, obj):
        return jutils.to_jalali_date(obj.date)


class TicketMessageSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    authorName = serializers.CharField(source="author_name")
    time = serializers.SerializerMethodField()

    class Meta:
        model = TicketMessage
        fields = ["id", "author", "authorName", "body", "time", "attachments"]

    def get_time(self, obj):
        return jutils.to_jalali(obj.created_at)


class TicketSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    createdAt = serializers.SerializerMethodField()
    updatedAt = serializers.SerializerMethodField()
    messages = TicketMessageSerializer(many=True, read_only=True)

    class Meta:
        model = Ticket
        fields = ["id", "subject", "topic", "status", "user", "email", "createdAt", "updatedAt", "messages"]

    def get_createdAt(self, obj):
        return jutils.to_jalali(obj.created_at)

    def get_updatedAt(self, obj):
        return jutils.to_jalali(obj.updated_at)


class NotificationSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()
    entryTime = serializers.DateField(write_only=True, required=False, source="time")

    class Meta:
        model = Notification
        fields = ["id", "kind", "title", "desc", "time", "link", "read", "entryTime"]

    def create(self, validated_data):
        from django.utils import timezone

        validated_data.setdefault("time", timezone.localdate())
        return super().create(validated_data)

    def get_time(self, obj):
        return jutils.to_jalali_date(obj.time)


class AuditEntrySerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    time = serializers.SerializerMethodField()

    class Meta:
        model = AuditEntry
        fields = ["id", "time", "actor", "action", "target", "details"]

    def get_time(self, obj):
        return jutils.to_jalali(obj.created_at)


# ---------------------------------------------------------------------------
# Analytics widgets
# ---------------------------------------------------------------------------

class EquityCurvePointSerializer(serializers.ModelSerializer):
    class Meta:
        model = EquityCurvePoint
        fields = ["day", "equity", "balance"]


class MonthlyPerformanceSerializer(serializers.ModelSerializer):
    pnl = serializers.FloatField()

    class Meta:
        model = MonthlyPerformance
        fields = ["month", "pnl"]


class CalendarDaySerializer(serializers.ModelSerializer):
    pnl = serializers.FloatField()

    class Meta:
        model = CalendarDay
        fields = ["day", "pnl", "trades"]


# ---------------------------------------------------------------------------
# AI coach
# ---------------------------------------------------------------------------

class CoachInsightsSerializer(serializers.ModelSerializer):
    scores = serializers.JSONField(source="payload.scores", default=list)
    strengths = serializers.JSONField(source="payload.strengths", default=list)
    weaknesses = serializers.JSONField(source="payload.weaknesses", default=list)
    suggestions = serializers.JSONField(source="payload.suggestions", default=list)
    behaviors = serializers.JSONField(source="payload.behaviors", default=list)
    models = serializers.JSONField(source="payload.models", default=list)
    dailyReport = serializers.JSONField(source="payload.dailyReport", default=dict)
    weeklyReport = serializers.JSONField(source="payload.weeklyReport", default=dict)

    class Meta:
        model = CoachInsights
        fields = ["scores", "strengths", "weaknesses", "suggestions", "behaviors", "models", "dailyReport", "weeklyReport"]


class CoachPeriodSerializer(serializers.ModelSerializer):
    winRate = serializers.CharField(source="win_rate")
    actionPlan = serializers.JSONField(source="action_plan")

    class Meta:
        model = CoachPeriod
        fields = [
            "id", "scope", "label", "range", "summary", "net", "winRate", "scores",
            "stats", "weaknesses", "strengths", "highlights", "actionPlan", "generated",
        ]


class ArchivedReportSerializer(serializers.ModelSerializer):
    winRate = serializers.CharField(source="win_rate")

    class Meta:
        model = ArchivedReport
        fields = ["id", "kind", "year", "month", "title", "range", "net", "winRate", "lines"]
