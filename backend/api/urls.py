from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .auth_views import (
    google_callback,
    login_view,
    password_reset_confirm,
    password_reset_request,
    password_reset_verify,
    send_otp,
    verify_otp_register,
)
from .mt_views import MtConnectView, MtStatusView, trades_webhook
from .views import (
    AchievementHistoryViewSet,
    AchievementViewSet,
    AdminAiApisView,
    AdminChartsView,
    AdminStatsView,
    ArchivedReportViewSet,
    AuditEntryViewSet,
    CalendarDayViewSet,
    CoachGenerateView,
    CoachInsightsView,
    CoachPeriodViewSet,
    DashboardView,
    EconomicEventViewSet,
    ForexSymbolViewSet,
    GoalViewSet,
    JournalEntryViewSet,
    JournalGroupViewSet,
    NewsItemViewSet,
    NotificationViewSet,
    PaymentViewSet,
    PlanViewSet,
    PlatformUserViewSet,
    PortfolioViewSet,
    ProfileView,
    ReferralLinkViewSet,
    RoleView,
    RoleTierViewSet,
    StrategyViewSet,
    SubscriptionViewSet,
    TicketViewSet,
    TradeColumnViewSet,
    TradeViewSet,
)

router = DefaultRouter()
router.register("portfolios", PortfolioViewSet)
router.register("trades", TradeViewSet)
router.register("journal/groups", JournalGroupViewSet)
router.register("journal/entries", JournalEntryViewSet)
router.register("goals", GoalViewSet)
router.register("achievements", AchievementViewSet)
router.register("achievement-history", AchievementHistoryViewSet)
router.register("role-tiers", RoleTierViewSet)
router.register("plans", PlanViewSet)
router.register("subscription", SubscriptionViewSet)
router.register("admin/users", PlatformUserViewSet, basename="admin-user")
router.register("admin/payments", PaymentViewSet)
router.register("admin/referrals", ReferralLinkViewSet)
router.register("news", NewsItemViewSet)
router.register("tickets", TicketViewSet)
router.register("notifications", NotificationViewSet)
router.register("audit", AuditEntryViewSet)
router.register("economic-events", EconomicEventViewSet)
router.register("calendar", CalendarDayViewSet, basename="calendarday")
router.register("forex-symbols", ForexSymbolViewSet)
router.register("strategies", StrategyViewSet)
router.register("trade-columns", TradeColumnViewSet)
router.register("coach/periods", CoachPeriodViewSet)
router.register("coach/archive", ArchivedReportViewSet)

urlpatterns = [
    # Auth endpoints
    path("auth/send-otp/", send_otp, name="send-otp"),
    path("auth/verify-otp/", verify_otp_register, name="verify-otp"),
    path("auth/login/", login_view, name="login"),
    path("auth/google/", google_callback, name="google-callback"),
    path("auth/password-reset-request/", password_reset_request, name="password-reset-request"),
    path("auth/password-reset-verify/", password_reset_verify, name="password-reset-verify"),
    path("auth/password-reset-confirm/", password_reset_confirm, name="password-reset-confirm"),
    path("mt/connect/", MtConnectView.as_view(), name="mt-connect"),
    path("mt/status/", MtStatusView.as_view(), name="mt-status"),
    path("trades/webhook/", trades_webhook, name="trades-webhook"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("coach/insights/", CoachInsightsView.as_view(), name="coach-insights"),
    path("coach/generate/", CoachGenerateView.as_view(), name="coach-generate"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("role/", RoleView.as_view(), name="role"),
    path("admin/stats/", AdminStatsView.as_view(), name="admin-stats"),
    path("admin/charts/", AdminChartsView.as_view(), name="admin-charts"),
    path("admin/ai-apis/", AdminAiApisView.as_view(), name="admin-ai-apis"),
    path("", include(router.urls)),
]
