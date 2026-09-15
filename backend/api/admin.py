from django.contrib import admin, messages
from django.db.models import Q

from .mt_stops import missing_levels, repair_missing_stops
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

admin.site.register(Portfolio)


@admin.register(Trade)
class TradeAdmin(admin.ModelAdmin):
    """Trade admin with a bulk repair for stops MT only left in comments."""

    list_display = ("ticket", "symbol", "side", "sl", "tp", "rr", "portfolio", "close_time")
    # `portfolio` matters: trades pushed while the MT connection pointed at a
    # different portfolio are invisible on the dashboard, which reads as
    # "MetaTrader shows more positions than Dlea".
    list_filter = ("portfolio", "symbol", "side")
    search_fields = ("ticket", "symbol", "comment")
    date_hierarchy = "close_time"
    actions = ["repair_missing_stops", "recompute_rr"]

    @admin.action(description="ترمیم SL/TP گم‌شده از کامنت متاتریدر")
    def repair_missing_stops(self, request, queryset):
        """Fill empty SL/TP from MT5's own "[sl ...]" / "[tp ...]" markers.

        MetaTrader emits only a position change when a stop is edited on a
        live position, so an older EA could send the trade with sl=0 while
        the level survived in the comment. Only gaps are filled — a stored
        level is never overwritten.
        """
        candidates = queryset.filter(comment__contains="[").filter(Q(sl=0) | Q(tp=0))
        repairable = [t for t in candidates if missing_levels(t)]
        if not repairable:
            self.message_user(
                request,
                "هیچ معامله‌ای از بین موارد انتخاب‌شده قابل ترمیم نبود "
                "(نه علامت [sl ...] یا [tp ...] هست، نه جای خالی).",
                level=messages.WARNING,
            )
            return

        result = repair_missing_stops(repairable)
        self.message_user(
            request,
            f"{result.repaired} معامله ترمیم شد "
            f"(SL: {result.filled_sl}، TP: {result.filled_tp}).",
            level=messages.SUCCESS,
        )
        skipped = queryset.count() - result.repaired
        if skipped:
            self.message_user(
                request,
                f"{skipped} معاملهٔ دیگر دست‌نخورده ماند "
                "(استاپ کامل بوده یا علامتی برای ترمیم نداشته).",
                level=messages.INFO,
            )

    @admin.action(description="بازمحاسبه R:R غیرمنطقی از ورود/خروج/استاپ")
    def recompute_rr(self, request, queryset):
        """Recompute R:R for values that cannot be a real ratio.

        Older EA builds divided profit by (price distance x volume x 100),
        so a normal EURUSD trade landed around 617. R:R is defined here as
        |exit - entry| / |entry - sl|, and stays untouched when the stop is
        missing (there is no ratio to compute).
        """
        result = repair_missing_stops(queryset, fix_rr=True)
        if not result.fixed_rr:
            self.message_user(
                request,
                "R:R هیچ‌کدام از موارد انتخاب‌شده نیاز به بازمحاسبه نداشت "
                "(یا مقدار فعلی منطقی است، یا استاپی برای محاسبه وجود ندارد).",
                level=messages.WARNING,
            )
            return
        detail = f"R:R برای {result.fixed_rr} معامله بازمحاسبه شد"
        extra = result.filled_sl + result.filled_tp
        if extra:
            # The same pass fills gaps, so say so instead of doing it silently.
            detail += (
                f" و {extra} سطح استاپ/تارگت گم‌شده هم از کامنت متاتریدر پر شد"
            )
        self.message_user(request, detail + ".", level=messages.SUCCESS)


admin.site.register(JournalGroup)
admin.site.register(JournalEntry)
admin.site.register(Goal)
admin.site.register(Achievement)
admin.site.register(AchievementHistory)
admin.site.register(RoleTier)
admin.site.register(Plan)
admin.site.register(Subscription)
admin.site.register(PlatformUser)
admin.site.register(Payment)
admin.site.register(ReferralLink)
admin.site.register(NewsItem)
admin.site.register(Ticket)
admin.site.register(TicketMessage)
admin.site.register(Notification)
admin.site.register(AuditEntry)
admin.site.register(EconomicEvent)
admin.site.register(EquityCurvePoint)
admin.site.register(MonthlyPerformance)
admin.site.register(CalendarDay)
admin.site.register(CoachInsights)
admin.site.register(CoachPeriod)
admin.site.register(ArchivedReport)
admin.site.register(ForexSymbol)
admin.site.register(Strategy)
admin.site.register(TradeColumn)
