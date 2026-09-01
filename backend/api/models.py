"""Data models for the Dlea trading-journal platform.

Field names deliberately mirror the JSON contract the React app consumes so
serializers stay thin and the frontend types map 1:1.
"""

from django.conf import settings
from django.db import models


def fa(n: int | float) -> str:
    """Convert a number to Persian digits."""
    return str(n).replace("0", "۰").replace("1", "۱").replace("2", "۲").replace("3", "۳").replace("4", "۴").replace("5", "۵").replace("6", "۶").replace("7", "۷").replace("8", "۸").replace("9", "۹")


class Timestamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ---------------------------------------------------------------------------
# Catalog / static reference data
# ---------------------------------------------------------------------------

class ForexSymbol(models.Model):
    code = models.CharField(max_length=12, unique=True)

    def __str__(self):
        return self.code


class Strategy(models.Model):
    name = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return self.name


class TradeColumn(models.Model):
    """Column catalog for the trades table (admin-toggleable)."""

    key = models.CharField(max_length=32, unique=True)
    label = models.CharField(max_length=64)
    default_visible = models.BooleanField(default=True)
    admin_enabled = models.BooleanField(default=True)
    numeric = models.BooleanField(default=False)

    def __str__(self):
        return self.label


class RoleTier(models.Model):
    level = models.PositiveIntegerField(unique=True)
    min_pct = models.PositiveIntegerField()
    max_pct = models.PositiveIntegerField()
    name = models.CharField(max_length=64)

    def __str__(self):
        return f"L{self.level} {self.name}"


class EconomicEvent(models.Model):
    time = models.CharField(max_length=16)
    currency = models.CharField(max_length=8)
    title = models.CharField(max_length=128)
    impact = models.CharField(max_length=8, choices=[("high", "high"), ("medium", "medium"), ("low", "low")])
    forecast = models.CharField(max_length=24)
    previous = models.CharField(max_length=24)

    def __str__(self):
        return self.title


# ---------------------------------------------------------------------------
# Trading domain
# ---------------------------------------------------------------------------

class Portfolio(Timestamped):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    name = models.CharField(max_length=64)
    broker = models.CharField(max_length=64)
    type = models.CharField(max_length=32)
    balance = models.DecimalField(max_digits=14, decimal_places=2)
    initial = models.DecimalField(max_digits=14, decimal_places=2)
    leverage = models.CharField(max_length=16)
    currency = models.CharField(max_length=8, default="USD")
    trades = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=16, default="فعال")
    strategy = models.CharField(max_length=64, default="")

    def __str__(self):
        return self.name


class Trade(Timestamped):
    SIDE = [("buy", "buy"), ("sell", "sell")]

    ticket = models.CharField(max_length=24)
    symbol = models.CharField(max_length=12)
    side = models.CharField(max_length=4, choices=SIDE)
    entry = models.DecimalField(max_digits=14, decimal_places=5)
    exit = models.DecimalField(max_digits=14, decimal_places=5)
    sl = models.DecimalField(max_digits=14, decimal_places=5)
    tp = models.DecimalField(max_digits=14, decimal_places=5)
    volume = models.DecimalField(max_digits=8, decimal_places=2)
    pnl = models.DecimalField(max_digits=14, decimal_places=2)
    rr = models.DecimalField(max_digits=6, decimal_places=2)
    pips = models.DecimalField(max_digits=8, decimal_places=1)
    commission = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    swap = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    taxes = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    open_time = models.DateTimeField()
    close_time = models.DateTimeField()
    magic = models.PositiveIntegerField(default=0)
    comment = models.CharField(max_length=128, default="")
    reason = models.CharField(max_length=32, default="Client")
    strategy = models.CharField(max_length=64, default="")
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name="trade_set")
    followed_plan = models.BooleanField(default=True)
    emotion = models.CharField(max_length=32, default="آرام")
    screenshots = models.JSONField(default=list)

    class Meta:
        ordering = ["-close_time"]

    def __str__(self):
        return f"{self.ticket} {self.symbol}"


# ---------------------------------------------------------------------------
# Journal
# ---------------------------------------------------------------------------

class JournalGroup(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    name = models.CharField(max_length=64)
    color = models.CharField(max_length=32, default="primary")

    def __str__(self):
        return self.name


class JournalEntry(Timestamped):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    date = models.DateField()
    week = models.CharField(max_length=32)
    month = models.CharField(max_length=32)
    trade_id = models.CharField(max_length=24, blank=True)
    symbol = models.CharField(max_length=12, blank=True)
    title = models.CharField(max_length=160)
    mistakes = models.TextField(blank=True)
    lesson = models.TextField(blank=True)
    emotion = models.CharField(max_length=32, default="")
    plan = models.BooleanField(default=True)
    favorite = models.BooleanField(default=False)
    group = models.ForeignKey(JournalGroup, null=True, blank=True, on_delete=models.SET_NULL)
    html = models.TextField(blank=True)
    blocks = models.JSONField(default=list)
    images = models.JSONField(default=list)

    class Meta:
        ordering = ["-date"]

    def __str__(self):
        return self.title


class Goal(Timestamped):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    title = models.CharField(max_length=160)
    progress = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.title


# ---------------------------------------------------------------------------
# Achievements
# ---------------------------------------------------------------------------

class Achievement(models.Model):
    title = models.CharField(max_length=160)
    desc = models.TextField()
    earned = models.BooleanField(default=False)
    rule = models.TextField()

    def __str__(self):
        return self.title


class AchievementHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    month = models.CharField(max_length=32)
    earned = models.JSONField(default=list)
    count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return self.month


# ---------------------------------------------------------------------------
# Plans / subscriptions / admin
# ---------------------------------------------------------------------------

class Plan(models.Model):
    # stable string id exposed to the frontend (free / pro / promax / vip)
    slug = models.SlugField(max_length=16, unique=True, default="")
    name = models.CharField(max_length=32)
    price = models.CharField(max_length=32)
    unit = models.CharField(max_length=32)
    tagline = models.CharField(max_length=160)
    portfolio_limit = models.CharField(max_length=64)
    features = models.JSONField(default=list)
    cta = models.CharField(max_length=64)
    highlight = models.BooleanField(default=False)
    sellable = models.BooleanField(default=True)
    users = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name


class Subscription(Timestamped):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    plan = models.CharField(max_length=32)
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.PositiveIntegerField()
    days_left = models.PositiveIntegerField()
    price = models.CharField(max_length=64)

    def __str__(self):
        return self.plan


ROLE_CHOICES = [
    ("trader", "تریدر"),
    ("professional", "حرفه‌ای"),
    ("master", "استاد"),
    ("admin", "مدیر"),
    ("vip", "ویژه"),
    ("trader-vip", "تریدر ویژه"),
    ("professional-vip", "حرفه‌ای ویژه"),
    ("master-vip", "استاد ویژه"),
]


class UserProfile(Timestamped):
    """Per-user profile extension (avatar, phone, role, plan, etc.)."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=16, blank=True, default="")
    avatar = models.FileField(upload_to="avatars/", blank=True, null=True)
    role = models.CharField(max_length=24, choices=ROLE_CHOICES, default="trader")
    plan = models.CharField(max_length=32, default="رایگان")

    def __str__(self):
        return f"Profile: {self.user.email}"


class MTConnection(Timestamped):
    """MetaTrader connection settings + webhook token for EA sync."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="mt_connections")
    portfolio = models.ForeignKey("Portfolio", null=True, blank=True, on_delete=models.SET_NULL, related_name="+")
    broker = models.CharField(max_length=64, default="")
    server = models.CharField(max_length=128, default="")
    account = models.CharField(max_length=32, default="")
    platform = models.CharField(max_length=8, choices=[("mt4", "MT4"), ("mt5", "MT5")], default="mt5")
    token = models.CharField(max_length=64, unique=True)

    def __str__(self):
        return f"{self.user_id} {self.account} ({self.platform})"


class PlatformUser(Timestamped):
    name = models.CharField(max_length=64)
    email = models.EmailField()
    plan = models.CharField(max_length=32)
    status = models.CharField(max_length=16, default="فعال")
    role = models.CharField(max_length=24, choices=ROLE_CHOICES, default="trader")
    joined = models.DateField()

    def __str__(self):
        return self.name


class Payment(models.Model):
    user = models.CharField(max_length=64)
    plan = models.CharField(max_length=32)
    amount = models.CharField(max_length=64)
    date = models.DateField()
    status = models.CharField(max_length=16, default="موفق")

    def __str__(self):
        return f"{self.user} — {self.plan}"


class AiApiCall(models.Model):
    user_email = models.EmailField()
    endpoint = models.CharField(max_length=128)
    model_name = models.CharField(max_length=64)
    tokens_in = models.PositiveIntegerField(default=0)
    tokens_out = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user_email} — {self.model_name}"


class ReferralLink(models.Model):
    name = models.CharField(max_length=128)
    code = models.CharField(max_length=64)
    clicks = models.PositiveIntegerField(default=0)
    signups = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name


# ---------------------------------------------------------------------------
# Platform content (news / support / notifications / audit)
# ---------------------------------------------------------------------------

class NewsItem(Timestamped):
    CATEGORIES = [("تخفیف", "تخفیف"), ("آپدیت", "آپدیت"), ("اطلاعیه", "اطلاعیه"), ("آموزش", "آموزش")]

    title = models.CharField(max_length=160)
    summary = models.CharField(max_length=320)
    body = models.TextField()
    category = models.CharField(max_length=16, choices=CATEGORIES)
    date = models.DateField()
    pinned = models.BooleanField(default=False)

    class Meta:
        ordering = ["-date", "-pinned"]

    def __str__(self):
        return self.title


class Ticket(Timestamped):
    TOPICS = [("فنی", "فنی"), ("پرداخت", "پرداخت"), ("حساب کاربری", "حساب کاربری"), ("اشتراک", "اشتراک"), ("سایر", "سایر")]
    STATUSES = [("باز", "باز"), ("در حال بررسی", "در حال بررسی"), ("پاسخ داده شد", "پاسخ داده شد"), ("بسته", "بسته")]

    subject = models.CharField(max_length=160)
    topic = models.CharField(max_length=16, choices=TOPICS)
    status = models.CharField(max_length=16, choices=STATUSES, default="باز")
    user = models.CharField(max_length=64)
    email = models.EmailField()

    class Meta:
        ordering = ["-id"]

    def __str__(self):
        return self.subject


class TicketMessage(Timestamped):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name="messages")
    author = models.CharField(max_length=8, choices=[("user", "user"), ("admin", "admin")])
    author_name = models.CharField(max_length=64)
    body = models.TextField()
    attachments = models.JSONField(default=list)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.ticket_id}:{self.author}"


class Notification(models.Model):
    KIND = [("news", "news"), ("ticket", "ticket"), ("system", "system")]

    kind = models.CharField(max_length=8, choices=KIND)
    title = models.CharField(max_length=160)
    desc = models.CharField(max_length=320)
    time = models.DateField()
    link = models.CharField(max_length=160, blank=True)
    read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-time", "-id"]

    def __str__(self):
        return self.title


class AuditEntry(Timestamped):
    actor = models.CharField(max_length=64)
    action = models.CharField(max_length=64)
    target = models.CharField(max_length=64)
    details = models.CharField(max_length=320, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.actor}: {self.action}"


# ---------------------------------------------------------------------------
# Analytics widgets (seeded so the UI stays deterministic)
# ---------------------------------------------------------------------------

class EquityCurvePoint(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    day = models.CharField(max_length=16)
    equity = models.DecimalField(max_digits=12, decimal_places=2)
    balance = models.DecimalField(max_digits=12, decimal_places=2)
    index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["index"]

    def __str__(self):
        return self.day


class MonthlyPerformance(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    month = models.CharField(max_length=16)
    pnl = models.DecimalField(max_digits=12, decimal_places=2)
    index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["index"]

    def __str__(self):
        return self.month


class CalendarDay(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    day = models.PositiveIntegerField(null=True, blank=True)
    pnl = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    trades = models.PositiveIntegerField(default=0)
    index = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["index"]

    def __str__(self):
        return f"day {self.day or '-'}"


# ---------------------------------------------------------------------------
# AI coach
# ---------------------------------------------------------------------------

class CoachInsights(Timestamped):
    """Singleton row holding the AI coach's composite payload as JSON."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    payload = models.JSONField(default=dict)

    class Meta:
        verbose_name_plural = "Coach insights"

    def __str__(self):
        return "AI coach insights"


class CoachPeriod(models.Model):
    id = models.CharField(max_length=32, primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    scope = models.CharField(max_length=8, choices=[("daily", "daily"), ("weekly", "weekly"), ("monthly", "monthly"), ("yearly", "yearly")])
    label = models.CharField(max_length=64)
    range = models.CharField(max_length=64)
    summary = models.TextField()
    net = models.CharField(max_length=16)
    win_rate = models.CharField(max_length=8)
    scores = models.JSONField(default=list)
    stats = models.JSONField(default=list)
    weaknesses = models.JSONField(default=list)
    strengths = models.JSONField(default=list)
    highlights = models.JSONField(default=list)
    action_plan = models.JSONField(default=list)
    generated = models.BooleanField(default=False)
    sort_key = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-sort_key"]

    def __str__(self):
        return self.label


class ArchivedReport(models.Model):
    id = models.CharField(max_length=32, primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    kind = models.CharField(max_length=8, choices=[("weekly", "weekly"), ("monthly", "monthly"), ("yearly", "yearly")])
    year = models.CharField(max_length=8)
    month = models.CharField(max_length=16, null=True, blank=True)
    title = models.CharField(max_length=128)
    range = models.CharField(max_length=64)
    net = models.CharField(max_length=16)
    win_rate = models.CharField(max_length=8)
    lines = models.JSONField(default=list)
    sort_key = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["-sort_key"]

    def __str__(self):
        return self.title
