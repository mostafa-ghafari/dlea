"""API viewsets for the Dlea platform."""

import json
import urllib.request
import urllib.error
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.db.models import Q, Sum
User = get_user_model()
from rest_framework import parsers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from . import gemini, jutils
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
    AiApiCall,
    ReferralLink,
    RoleTier,
    Strategy,
    Subscription,
    Ticket,
    TicketMessage,
    Trade,
    TradeColumn,
    UserProfile,
)
from .serializers import (
    AchievementHistorySerializer,
    AchievementSerializer,
    ArchivedReportSerializer,
    AuditEntrySerializer,
    CalendarDaySerializer,
    CoachInsightsSerializer,
    CoachPeriodSerializer,
    EconomicEventSerializer,
    EquityCurvePointSerializer,
    ForexSymbolSerializer,
    GoalSerializer,
    JournalEntrySerializer,
    JournalGroupSerializer,
    MonthlyPerformanceSerializer,
    NewsItemSerializer,
    NotificationSerializer,
    PaymentSerializer,
    PlanSerializer,
    PlatformUserSerializer,
    PortfolioSerializer,
    ReferralLinkSerializer,
    RoleTierSerializer,
    StrategySerializer,
    SubscriptionSerializer,
    TicketSerializer,
    TradeColumnSerializer,
    TradeSerializer,
)


class UserScopedMixin:
    """Restrict querysets to the authenticated user (demo rows when anonymous)."""

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_authenticated:
            return qs.filter(user=self.request.user)
        return qs.filter(user__isnull=True)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


class PortfolioViewSet(UserScopedMixin, viewsets.ModelViewSet):
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        """Set this portfolio as active, deactivate all others for the user."""
        portfolio = self.get_object()
        user = request.user
        if user.is_authenticated:
            Portfolio.objects.filter(user=user).update(is_active=False)
        else:
            Portfolio.objects.filter(user__isnull=True).update(is_active=False)
        portfolio.is_active = True
        portfolio.save(update_fields=["is_active", "updated_at"])
        return Response(PortfolioSerializer(portfolio).data)


class TradeViewSet(viewsets.ModelViewSet):
    queryset = Trade.objects.select_related("portfolio").all()
    serializer_class = TradeSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_authenticated:
            qs = qs.filter(portfolio__user=self.request.user)
        else:
            qs = qs.filter(portfolio__user__isnull=True)
        symbol = self.request.query_params.get("symbol")
        portfolio = self.request.query_params.get("portfolio")
        if symbol:
            qs = qs.filter(symbol__iexact=symbol)
        if portfolio:
            qs = qs.filter(portfolio__name__icontains=portfolio)
        return qs

    @action(detail=False, methods=["post"], url_path="import")
    def bulk_import(self, request):
        """Create many trades at once (MetaTrader statement import).

        Accepts a JSON array of trade objects; each item is validated with the
        regular TradeSerializer so the exact same field contract applies.
        """
        items = request.data
        if not isinstance(items, list) or not items:
            return Response({"detail": "a non-empty list of trades is required"}, status=400)
        created = 0
        errors = []
        for idx, item in enumerate(items):
            if not isinstance(item, dict):
                errors.append({"index": idx, "detail": "trade must be an object"})
                continue
            ser = TradeSerializer(data=item)
            if not ser.is_valid():
                errors.append({"index": idx, "detail": ser.errors})
                continue
            try:
                ser.save()
                created += 1
            except Exception as exc:  # e.g. invalid portfolio FK
                errors.append({"index": idx, "detail": str(exc)})
        status = 201 if created else 400
        payload = {"created": created, "total": len(items)}
        if errors:
            payload["errors"] = errors[:10]
        return Response(payload, status=status)


class JournalGroupViewSet(UserScopedMixin, viewsets.ModelViewSet):
    queryset = JournalGroup.objects.all()
    serializer_class = JournalGroupSerializer


class JournalEntryViewSet(UserScopedMixin, viewsets.ModelViewSet):
    queryset = JournalEntry.objects.select_related("group").all()
    serializer_class = JournalEntrySerializer


class GoalViewSet(UserScopedMixin, viewsets.ModelViewSet):
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer


class AchievementHistoryViewSet(UserScopedMixin, viewsets.ReadOnlyModelViewSet):
    queryset = AchievementHistory.objects.all()
    serializer_class = AchievementHistorySerializer


class RoleTierViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RoleTier.objects.order_by("level")
    serializer_class = RoleTierSerializer


class PlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Plan.objects.all()
    serializer_class = PlanSerializer


class SubscriptionViewSet(UserScopedMixin, viewsets.ReadOnlyModelViewSet):
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer


class AdminStatsView(APIView):
    """Return real-time KPI stats for the admin dashboard."""
    def get(self, request):
        from .models import Payment, Trade, AiApiCall
        total_users = User.objects.count()
        active_subs = Payment.objects.filter(status="موفق").values("user").distinct().count()
        payments = Payment.objects.filter(status="موفق")
        monthly_revenue = 0
        for p in payments:
            try:
                monthly_revenue += int(str(p.amount).replace(",", "").replace(".", "").strip())
            except (ValueError, AttributeError):
                pass
        total_trades = Trade.objects.count()
        ai_calls = AiApiCall.objects.count()
        return Response({
            "total_users": total_users,
            "active_subscriptions": active_subs,
            "monthly_revenue": monthly_revenue,
            "total_trades": total_trades,
            "ai_calls": ai_calls,
        })


class AdminAiApisView(APIView):
    """Return real AI API usage grouped by model_name."""
    def get(self, request):
        from .models import AiApiCall
        from django.db.models import Sum
        calls = (
            AiApiCall.objects
            .values("model_name", "endpoint")
            .annotate(total_calls=Sum("tokens_in", default=0), total_tokens_out=Sum("tokens_out", default=0))
            .order_by("-total_calls")
        )
        apis = []
        for c in calls:
            count = AiApiCall.objects.filter(model_name=c["model_name"]).count()
            apis.append({
                "name": c["model_name"],
                "endpoint": c["endpoint"],
                "requests": count,
                "tokens_in": c["total_calls"] or 0,
                "tokens_out": c["total_tokens_out"] or 0,
            })
        # Also check if Gemini API key exists
        from . import gemini
        api_key = gemini.get_api_key()
        return Response({
            "apis": apis,
            "gemini_configured": bool(api_key),
        })


class AdminChartsView(APIView):
    """Return chart data from real database records."""
    def get(self, request):
        from .models import Payment, UserProfile
        from collections import Counter
        from datetime import datetime, timedelta
        from calendar import month_name

        now = datetime.now()

        # 1. User growth by month (last 7 months)
        user_growth = []
        cumulative = 0
        for i in range(6, -1, -1):
            dt = now - timedelta(days=30 * i)
            year, month = dt.year, dt.month
            count = User.objects.filter(date_joined__year=year, date_joined__month=month).count()
            cumulative += count
            user_growth.append({"month": month_name[month], "users": cumulative})

        # 2. Monthly revenue (last 7 months)
        revenue = []
        for i in range(6, -1, -1):
            dt = now - timedelta(days=30 * i)
            year, month = dt.year, dt.month
            month_payments = Payment.objects.filter(date__year=year, date__month=month, status="\u0645\u0648\u0641\u0642")
            total = 0
            for p in month_payments:
                try:
                    total += int(str(p.amount).replace(",", "").replace(".", "").strip())
                except (ValueError, AttributeError):
                    pass
            revenue.append({"month": month_name[month], "revenue": total // 1000000})

        # 3. Plan distribution (from UserProfile)
        plan_counts = Counter(UserProfile.objects.values_list("plan", flat=True))
        plan_colors = {"\u0631\u0627\u06cc\u06af\u0627\u0646": "#6b7280", "Pro": "#22c55e", "Pro Max": "#f59e0b", "VIP": "#ef4444"}
        plan_distribution = []
        for name, count in plan_counts.most_common():
            plan_distribution.append({"name": name, "value": count, "color": plan_colors.get(name, "#3b82f6")})

        return Response({
            "user_growth": user_growth,
            "revenue": revenue,
            "plan_distribution": plan_distribution,
        })


class PlatformUserViewSet(viewsets.ModelViewSet):
    """Admin users endpoint backed by real Django users."""
    serializer_class = PlatformUserSerializer
    pagination_class = None  # Custom pagination in list()

    def get_queryset(self):
        return User.objects.all().order_by("-date_joined")

    def list(self, request, *args, **kwargs):
        page = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 20))
        search = request.query_params.get("search", "").strip().lower()

        qs = User.objects.all().order_by("-date_joined")
        if search:
            qs = qs.filter(Q(email__icontains=search) | Q(first_name__icontains=search) | Q(last_name__icontains=search) | Q(username__icontains=search))

        total = qs.count()
        start = (page - 1) * page_size
        users_page = qs[start : start + page_size]

        rows = []
        for u in users_page:
            profile, _ = UserProfile.objects.get_or_create(user=u)
            auto_role = _compute_auto_role(u)
            effective = _effective_role(auto_role, profile.role)
            rows.append({
                "id": str(u.id),
                "name": f"{u.first_name} {u.last_name}".strip() or u.username,
                "email": u.email,
                "plan": getattr(profile, "plan", "رایگان"),
                "status": "فعال" if u.is_active else "غیرفعال",
                "role": effective,
                "joined": jutils.to_jalali_date(u.date_joined.date() if hasattr(u.date_joined, 'date') else u.date_joined),
            })

        return Response({
            "count": total,
            "page": page,
            "page_size": page_size,
            "results": rows,
        })

    def update(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "کاربر یافت نشد"}, status=404)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        data = request.data
        changes = []
        if "plan" in data:
            profile.plan = data["plan"]
            changes.append(f"plan: {data['plan']}")
            # Also create/update Subscription so the sidebar shows the plan
            from .models import Subscription
            from datetime import date, timedelta
            today = date.today()
            plan = data["plan"]
            if plan == "رایگان":
                Subscription.objects.filter(user=user).delete()
            else:
                sub, _ = Subscription.objects.get_or_create(user=user, defaults={"plan": plan, "start_date": today, "end_date": today + timedelta(days=30), "total_days": 30, "days_left": 30, "price": "0"})
                sub.plan = plan
                sub.start_date = today
                sub.end_date = today + timedelta(days=30)
                sub.total_days = 30
                sub.days_left = 30
                sub.save()
        if "status" in data:
            user.is_active = data["status"] == "فعال"
            changes.append(f"status: {data['status']}")
        if "email" in data:
            user.email = data["email"]
            changes.append(f"email: {data['email']}")
        if "role" in data:
            profile.role = data["role"]
            changes.append(f"role: {data['role']}")
        user.save()
        profile.save()
        if changes:
            AuditEntry.objects.create(
                actor="مدیر سیستم",
                action="ویرایش کاربر",
                target=user.email,
                details="، ".join(changes),
            )
        auto_role = _compute_auto_role(user)
        effective = _effective_role(auto_role, profile.role)
        return Response({
            "id": str(user.id),
            "name": f"{user.first_name} {user.last_name}".strip() or user.username,
            "email": user.email,
            "plan": profile.plan,
            "status": "فعال" if user.is_active else "غیرفعال",
            "role": effective,
            "joined": jutils.to_jalali_date(user.date_joined.date() if hasattr(user.date_joined, 'date') else user.date_joined),
        })

    partial_update = update

    def destroy(self, request, *args, **kwargs):
        pk = kwargs.get("pk")
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "کاربر یافت نشد"}, status=404)
        AuditEntry.objects.create(
            actor="مدیر سیستم",
            action="حذف کاربر",
            target=user.email,
            details=str(user.id),
        )
        user.delete()
        return Response(status=204)


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer


class ReferralLinkViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReferralLink.objects.all()
    serializer_class = ReferralLinkSerializer


class NewsItemViewSet(viewsets.ModelViewSet):
    queryset = NewsItem.objects.all()
    serializer_class = NewsItemSerializer


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.prefetch_related("messages").all()
    serializer_class = TicketSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.request.user.is_authenticated:
            return qs.filter(email=self.request.user.email)
        return qs.none()

    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        author = request.data.get("author", "user")
        body = request.data.get("body", "").strip()
        if not body:
            return Response({"detail": "body is required"}, status=400)
        author_name = request.data.get("authorName") or (
            "پشتیبانی" if author == "admin" else ticket.user
        )
        msg = TicketMessage.objects.create(
            ticket=ticket,
            author=author,
            author_name=author_name,
            body=body,
            attachments=request.data.get("attachments", []),
        )
        if author == "admin":
            ticket.status = "پاسخ داده شد"
        elif ticket.status == "بسته":
            ticket.status = "باز"
        ticket.save(update_fields=["status", "updated_at"])
        from .serializers import TicketMessageSerializer

        return Response(TicketMessageSerializer(msg).data, status=201)

    @action(detail=True, methods=["post"])
    def set_status(self, request, pk=None):
        ticket = self.get_object()
        new_status = request.data.get("status")
        if new_status not in dict(Ticket.STATUSES):
            return Response({"detail": "invalid status"}, status=400)
        ticket.status = new_status
        ticket.save(update_fields=["status", "updated_at"])
        return Response(TicketSerializer(ticket).data)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    @action(detail=False, methods=["post"])
    def read_all(self, request):
        Notification.objects.update(read=True)
        return Response({"ok": True})


class AuditEntryViewSet(viewsets.ModelViewSet):
    queryset = AuditEntry.objects.all()
    serializer_class = AuditEntrySerializer


class EconomicEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = EconomicEvent.objects.all()
    serializer_class = EconomicEventSerializer

    def list(self, request, *args, **kwargs):
        """Return live economic events from ForexFactory API."""
        events = DashboardView._get_live_events()
        return Response(events)


class CalendarDayViewSet(viewsets.ViewSet):
    """Compute calendar from real trades, grouped by Jalali day."""

    def list(self, request):
        import jdatetime

        if request.user.is_authenticated:
            trades = Trade.objects.filter(portfolio__user=request.user).order_by("close_time")
        else:
            trades = Trade.objects.filter(portfolio__user__isnull=True).order_by("close_time")

        # Determine current Jalali year/month from latest trade, or now
        now_j = jdatetime.datetime.now()
        if trades.exists():
            last_j = jdatetime.date.fromgregorian(date=trades.last().close_time.date())
            j_year, j_month = last_j.year, last_j.month
        else:
            j_year, j_month = now_j.year, now_j.month

        # Accept ?year=...&month=... query params for navigation
        try:
            j_year = int(request.query_params.get("year", j_year))
            j_month = int(request.query_params.get("month", j_month))
        except (TypeError, ValueError):
            pass

        # Group trades by Jalali day-of-month
        daily = {}  # {day_num: {"pnl": float, "trades": int}}
        for t in trades:
            jd = jdatetime.date.fromgregorian(date=t.close_time.date())
            if jd.year == j_year and jd.month == j_month:
                dn = jd.day
                if dn not in daily:
                    daily[dn] = {"pnl": 0.0, "trades": 0}
                daily[dn]["pnl"] += float(t.pnl or 0)
                daily[dn]["trades"] += 1

        # Build grid: first day of month to find weekday offset
        first_greg = jdatetime.date(j_year, j_month, 1).togregorian()
        # Jalali weekday: Saturday=0 ... Friday=6 → map to Sun=0..Sat=6
        # jdatetime weekday(): 0=Saturday, ..., 5=Thursday, 6=Friday
        first_weekday_j = first_greg.weekday()  # Python: 0=Monday
        # For the grid we want Saturday=col0 ... Friday=col6
        # Python weekday: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
        # Sat=5→col0, Sun=6→col1, Mon=0→col2, Tue=1→col3, Wed=2→col4, Thu=3→col5, Fri=4→col6
        sat_based_offset = (first_weekday_j - 5) % 7

        # Days in month
        if j_month <= 6:
            days_in_month = 31
        elif j_month <= 11:
            days_in_month = 30
        else:
            days_in_month = 29  # simplified; leap handled below
        # Check for Esfand leap year
        if j_month == 12:
            # Larizan leap check: years 4,8,12,...,128 in 33-year cycle
            leap = ((j_year + 19) % 33) * 4 < 33
            days_in_month = 30 if leap else 29

        total_cells = sat_based_offset + days_in_month
        # Round up to multiple of 7
        total_cells = ((total_cells + 6) // 7) * 7

        result = []
        for i in range(total_cells):
            day_num = i - sat_based_offset + 1
            if 1 <= day_num <= days_in_month:
                d = daily.get(day_num, {"pnl": 0.0, "trades": 0})
                result.append({
                    "id": f"{j_year}-{j_month:02d}-{day_num:02d}",
                    "day": day_num,
                    "pnl": round(d["pnl"], 2),
                    "trades": d["trades"],
                })
            else:
                result.append({
                    "id": f"empty-{i}",
                    "day": None,
                    "pnl": 0,
                    "trades": 0,
                })

        return Response(result)

    def retrieve(self, request, pk=None):
        return Response({"detail": "not implemented"}, status=405)


class ForexSymbolViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ForexSymbol.objects.all()
    serializer_class = ForexSymbolSerializer


class StrategyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Strategy.objects.all()
    serializer_class = StrategySerializer


class TradeColumnViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = TradeColumn.objects.all()
    serializer_class = TradeColumnSerializer


class CoachInsightsView(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            obj = CoachInsights.objects.filter(user=request.user).first()
        else:
            obj = CoachInsights.objects.filter(user__isnull=True).first()
        if not obj:
            # New user with no insights yet — empty structure keeps the UI working.
            payload = {
                "scores": [],
                "strengths": [],
                "weaknesses": [],
                "suggestions": [],
                "behaviors": [],
                "models": [],
                "dailyReport": {},
                "weeklyReport": {},
            }
        else:
            payload = CoachInsightsSerializer(obj).data
        # When a Gemini key is configured, surface the real models.
        models = gemini.gemini_models()
        if models:
            payload["models"] = models
        return Response(payload)


class CoachGenerateView(APIView):
    """Generate a real coach report with Google Gemini from the stored trades.

    POST /api/coach/generate/  {"scope": "weekly", "model": "gemini-2.0-flash"}
    The report is computed from the most recent non-empty bucket of the scope
    and saved as a CoachPeriod so it appears at the top of the periods list.
    """

    def post(self, request):
        scope = request.data.get("scope", "weekly")
        if scope not in ("daily", "weekly", "monthly", "yearly"):
            return Response({"detail": "scope must be daily/weekly/monthly/yearly"}, status=400)
        if not gemini.get_api_key():
            return Response(
                {
                    "detail": (
                        "کلید Gemini تنظیم نشده است. GEMINI_API_KEY را در فایل backend/.env "
                        "یا environment variable ست کنید و سرور را ری‌استارت کنید."
                    )
                },
                status=400,
            )
        user = request.user if request.user.is_authenticated else None
        if user:
            trades = Trade.objects.filter(portfolio__user=user)
        else:
            trades = Trade.objects.filter(portfolio__user__isnull=True)
        try:
            report = gemini.generate_coach_report(scope, request.data.get("model"), trades)
        except LookupError as exc:
            return Response({"detail": f"داده‌ای برای این بازه موجود نیست ({exc})"}, status=400)
        except (ValueError, json.JSONDecodeError) as exc:
            return Response(
                {"detail": f"پاسخ Gemini قابل پردازش نبود: {exc}"}, status=502
            )
        except RuntimeError as exc:
            if str(exc) == "GEMINI_API_KEY":
                return Response(
                    {"detail": "کلید Gemini تنظیم نشده است."}, status=400
                )
            return Response({"detail": str(exc)}, status=502)

        # ── Log AI API call ──
        try:
            model_used = gemini.get_model(request.data.get("model"))
            AiApiCall.objects.create(
                user_email=user.email if user else "",
                endpoint="/api/coach/generate/",
                model_name=model_used,
                tokens_in=0,
                tokens_out=0,
            )
        except Exception:
            pass

        report_id = report["id"] + (f"-u{user.id}" if user else "")
        period, created = CoachPeriod.objects.update_or_create(
            id=report_id,
            user=user,
            defaults={
                "scope": scope,
                "label": report["label"],
                "range": report["range"],
                "summary": report["summary"],
                "net": report["net"],
                "win_rate": report["winRate"],
                "scores": report["scores"],
                "stats": report["stats"],
                "weaknesses": report["weaknesses"],
                "strengths": report["strengths"],
                "highlights": report["highlights"],
                "action_plan": report["actionPlan"],
                "generated": True,
                "sort_key": int(datetime.now().timestamp()),
            },
        )
        data = CoachPeriodSerializer(period).data
        return Response(data, status=201 if created else 200)


class CoachPeriodViewSet(UserScopedMixin, viewsets.ReadOnlyModelViewSet):
    queryset = CoachPeriod.objects.all()
    serializer_class = CoachPeriodSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        scope = self.request.query_params.get("scope")
        if scope:
            qs = qs.filter(scope=scope)
        return qs


class ArchivedReportViewSet(UserScopedMixin, viewsets.ReadOnlyModelViewSet):
    queryset = ArchivedReport.objects.all()
    serializer_class = ArchivedReportSerializer


class DashboardView(APIView):
    """Aggregate payload for the dashboard page (charts + KPI cards).

    Everything is computed from the user's real trades, so the dashboard is
    correct even without any seeded analytics rows.
    """

    def get(self, request):
        if request.user.is_authenticated:
            trades = Trade.objects.filter(portfolio__user=request.user).order_by("close_time")
            portfolios = Portfolio.objects.filter(user=request.user)
        else:
            trades = Trade.objects.filter(portfolio__user__isnull=True).order_by("close_time")
            portfolios = Portfolio.objects.filter(user__isnull=True)

        total = trades.count()
        winners = trades.filter(pnl__gt=0).count()
        win_pct = round((winners / total * 100) if total else 0, 1)

        agg = trades.aggregate(
            total_pnl=Sum("pnl"),
            gross_win=Sum("pnl", filter=Q(pnl__gt=0)),
            gross_loss=Sum("pnl", filter=Q(pnl__lt=0)),
        )
        total_pnl = round(float(agg["total_pnl"] or 0), 2)
        gross_win = float(agg["gross_win"] or 0)
        gross_loss = float(agg["gross_loss"] or 0)
        if gross_loss:
            profit_factor = round(gross_win / abs(gross_loss), 2)
        elif gross_win:
            profit_factor = 999.0
        else:
            profit_factor = 0.0

        initial = round(sum(float(p.initial or 0) for p in portfolios), 2)

        # Build the equity curve, monthly buckets and max drawdown from trades.
        equity_curve = []
        monthly_order = []
        monthly_map = {}
        cumulative = initial
        peak = cumulative
        max_drawdown = 0.0
        prev_day = None

        for t in trades:
            day = jutils.to_jalali_date(t.close_time.date())
            cumulative = round(cumulative + float(t.pnl or 0), 2)
            if cumulative > peak:
                peak = cumulative
            if peak > 0:
                dd = (cumulative - peak) / peak * 100
                if dd < max_drawdown:
                    max_drawdown = dd
            if day != prev_day:
                equity_curve.append({"day": day, "equity": cumulative, "balance": cumulative})
                prev_day = day

            month = jutils.month_label(t.close_time.date())
            if month not in monthly_map:
                monthly_map[month] = 0.0
                monthly_order.append(month)
            monthly_map[month] = round(monthly_map[month] + float(t.pnl or 0), 2)

        # Start the equity line at the initial balance.
        if equity_curve:
            first_day = equity_curve[0]["day"]
            equity_curve.insert(0, {"day": first_day, "equity": initial, "balance": initial})

        monthly_performance = [{"month": m, "pnl": monthly_map[m]} for m in monthly_order]

        win_loss = [
            {"name": "برنده", "value": round(win_pct), "color": "oklch(0.75 0.17 155)"},
            {"name": "بازنده", "value": 100 - round(win_pct), "color": "oklch(0.65 0.23 25)"},
        ]

        best = trades.order_by("-pnl").first()
        worst = trades.order_by("pnl").first()
        # Try live economic calendar first; fall back to seeded DB data
        events = self._get_live_events()

        def trade_card(t):
            if not t:
                return None
            return {
                "symbol": t.symbol,
                "pnl": round(float(t.pnl or 0), 2),
                "rr": round(float(t.rr or 0), 2),
                "date": jutils.to_jalali_date(t.close_time.date()),
            }

        return Response(
            {
                "equityCurve": equity_curve,
                "winLossData": win_loss,
                "monthlyPerformance": monthly_performance,
                "economicEvents": events,  # already dicts from _get_live_events()
                "bestTrade": trade_card(best),
                "worstTrade": trade_card(worst),
                "tradeCount": total,
                "totalPnl": total_pnl,
                "winRate": win_pct,
                "profitFactor": profit_factor,
                "maxDrawdown": round(max_drawdown, 2),
            }
        )

    # ---- Live economic calendar (cached 1 hour) ----
    _events_cache = None
    _events_cache_ts = None
    _EVENTS_URL = "https://nfs.faireconomy.media/ff_calendar_thisweek.json"

    @classmethod
    def _get_live_events(cls):
        """Fetch this week's economic events from ForexFactory free API.
        Results are cached for 1 hour so we don't hammer the API."""
        now = datetime.now()
        if (
            cls._events_cache is not None
            and cls._events_cache_ts is not None
            and (now - cls._events_cache_ts).total_seconds() < 3600
        ):
            return cls._events_cache

        try:
            req = urllib.request.Request(
                cls._EVENTS_URL,
                headers={"User-Agent": "DleaAI/1.0"},
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode())

            tehran_tz = ZoneInfo("Asia/Tehran")
            now_tehran = datetime.now(tehran_tz)
            today = now_tehran.date()
            # Filter to today's events (with ±1 day tolerance for timezone drift)
            result = []
            for ev in data:
                try:
                    ev_dt = datetime.fromisoformat(ev["date"])
                    # Convert to Tehran timezone
                    ev_dt_tehran = ev_dt.astimezone(tehran_tz)
                    ev_date = ev_dt_tehran.date()
                    if abs((ev_date - today).days) <= 1:
                        # Map impact: lowercase first letter
                        impact_raw = ev.get("impact", "Low").lower()
                        if "high" in impact_raw:
                            impact = "high"
                        elif "medium" in impact_raw:
                            impact = "medium"
                        else:
                            impact = "low"
                        time_str = ev_dt_tehran.strftime("%H:%M")
                        result.append({
                            "id": f"live-{ev_dt.timestamp()}",
                            "time": time_str,
                            "currency": ev.get("country", "USD"),
                            "title": ev.get("title", ""),
                            "impact": impact,
                            "forecast": ev.get("forecast") or "—",
                            "previous": ev.get("previous") or "—",
                        })
                except (KeyError, ValueError, TypeError):
                    continue

            # Sort by time
            result.sort(key=lambda x: x["time"])
            cls._events_cache = result
            cls._events_cache_ts = now
            return result

        except Exception:
            # On any error, return cached data if available, else empty
            return cls._events_cache or []


# ---------------------------------------------------------------------------
# Profile (avatar + phone)
# ---------------------------------------------------------------------------
from django.contrib.auth import get_user_model

def _compute_auto_role(user):
    """Compute the earned role based on trade/achievement data."""
    from .models import Trade, Portfolio, Achievement
    trades = Trade.objects.filter(portfolio__user=user)
    count = trades.count()
    total_pnl = sum(float(t.pnl or 0) for t in trades)
    win_count = trades.filter(pnl__gt=0).count()
    win_rate = (win_count / count * 100) if count else 0
    portfolio_count = Portfolio.objects.filter(user=user).count()
    has_mt = portfolio_count > 0 and count > 0
    # Compute earned achievements count
    rules = {
        113: count >= 10,
        114: total_pnl > 0,
        115: count >= 20,
        116: count >= 100,
        117: win_rate > 50 and count >= 20,
        118: count >= 30,
        119: count >= 1,
        120: count >= 30,
        121: total_pnl > 0,
        122: win_rate > 70 and count >= 20,
        123: count >= 50,
        124: count < 50,
        125: total_pnl > 0 and count >= 5,
        126: count >= 10,
        127: has_mt,
        128: count >= 50,
    }
    total_achievements = Achievement.objects.count()
    earned_count = sum(1 for v in rules.values() if v)
    pct = (earned_count / total_achievements * 100) if total_achievements else 0
    if pct >= 60:
        return "master"
    elif pct >= 20:
        return "professional"
    return "trader"


# Roles that only admins can assign (not auto-computed)
_ADMIN_ONLY_ROLES = {"admin", "vip", "trader-vip", "professional-vip", "master-vip"}


def _effective_role(auto_role: str, admin_role: str) -> str:
    """Resolve the effective role.
    - VIP / admin roles always win (admin-only).
    - If admin explicitly set professional or master, that overrides auto.
    - Default 'trader' does NOT override auto (it's just the DB default).
    """
    if admin_role in _ADMIN_ONLY_ROLES:
        return admin_role
    if admin_role in ("professional", "master"):
        return admin_role
    return auto_role


class RoleView(APIView):
    """GET user's effective role. Admin can PUT to override."""

    def get(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        auto_role = _compute_auto_role(request.user)
        admin_role = profile.role
        return Response({
            "autoRole": auto_role,
            "adminRole": admin_role,
            "effective": _effective_role(auto_role, admin_role),
        })

    def put(self, request):
        """Admin-only: set user's role."""
        if not request.user.is_staff:
            return Response({"error": "فقط مدیر اجازه تغییر نقش دارد"}, status=403)
        user_id = request.data.get("userId")
        role = request.data.get("role", "trader")
        from django.contrib.auth.models import User
        try:
            target = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "کاربر یافت نشد"}, status=404)
        profile, _ = UserProfile.objects.get_or_create(user=target)
        profile.role = role
        profile.save()
        return Response({"ok": True, "role": role})


class ProfileView(APIView):
    """GET/PUT user profile (avatar URL, phone, name, role)."""
    parser_classes = [parsers.JSONParser, parsers.MultiPartParser, parsers.FormParser]

    def get(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        avatar_url = None
        if profile.avatar:
            avatar_url = request.build_absolute_uri(profile.avatar.url)
        auto_role = _compute_auto_role(user)
        return Response({
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "phone": profile.phone,
            "avatar": avatar_url,
            "role": _effective_role(auto_role, profile.role),
        })

    def put(self, request):
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        data = request.data
        if "firstName" in data:
            user.first_name = data["firstName"]
        if "lastName" in data:
            user.last_name = data["lastName"]
        if "phone" in data:
            profile.phone = data["phone"]
        if "role" in data and user.is_staff:
            profile.role = data["role"]
        if "avatar" in request.FILES:
            profile.avatar = request.FILES["avatar"]
        user.save()
        profile.save()
        avatar_url = None
        if profile.avatar:
            avatar_url = request.build_absolute_uri(profile.avatar.url)
        auto_role = _compute_auto_role(user)
        return Response({
            "id": user.id,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "phone": profile.phone,
            "avatar": avatar_url,
            "role": _effective_role(auto_role, profile.role),
        })

    def post(self, request):
        """Also accept POST for avatar upload (multipart form)."""
        return self.put(request)
