"""Telling buyers about a discount code.

A code only earns money once somebody knows it exists, and the admin panel has
two ways to say so (DEV-157):

* ``news``  — a public item in the اخبار feed. The news feed already notifies
  every active account, so the code reaches the bell too.
* ``private`` — a notification only for the accounts already on the plan the
  code was minted for. A Pro Max code in a Pro buyer's bell is noise.

Both paths are driven from one place so the Django admin and the in-app admin
panel cannot word the same campaign differently.
"""

from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Coupon, NewsItem, Notification, Subscription, UserProfile

CHANNEL_NEWS = "news"
CHANNEL_PRIVATE = "private"
CHANNELS = (CHANNEL_NEWS, CHANNEL_PRIVATE)


def discount_label(coupon: Coupon) -> str:
    """`۳۰٪ تخفیف` or `۵۰,۰۰۰ تومان تخفیف` — how the code's worth is read."""
    if coupon.percent:
        return f"{coupon.percent}٪ تخفیف"
    return f"{coupon.amount:,} تومان تخفیف"


def plan_label(coupon: Coupon) -> str:
    """Which plans the code covers: its own plan, or all of them."""
    return coupon.plan.name if coupon.plan_id else "همهٔ پلن‌ها"


def coupon_message(coupon: Coupon) -> tuple[str, str, str]:
    """``(title, summary, body)`` for a campaign around `coupon`."""
    label = plan_label(coupon)
    off = discount_label(coupon)
    title = f"کد تخفیف {coupon.code} برای {label}"
    summary = f"با کد {coupon.code} روی اشتراک {label} {off} بگیر."
    lines = [
        f"کد تخفیف {coupon.code} برای اشتراک {label} فعال شد: {off} روی پرداخت ماهانه و سالانه.",
        "کافی است در صفحه «خرید اشتراک» کد را در کادر تخفیف وارد کنی و روی «اعمال» بزنی؛ "
        "مبلغ روی همان کارت پلن به‌روز می‌شود و با همین مبلغ به درگاه می‌روی.",
    ]
    if coupon.expires_at:
        lines.append(f"این کد تا {coupon.expires_at:%Y-%m-%d} معتبر است.")
    if coupon.max_uses:
        left = max(0, coupon.max_uses - coupon.used_count)
        lines.append(f"ظرفیت این کد {coupon.max_uses} استفاده است ({left} استفاده باقی مانده).")
    return title, summary, "\n\n".join(lines)


def _target_users(coupon: Coupon):
    """Accounts the private notification goes to.

    Plan-specific code → the accounts whose profile sits on that plan. A
    campaign code with no plan goes to every active account instead, which is
    also the audience the news feed notifies.
    """
    User = get_user_model()
    active = User.objects.filter(is_active=True)
    if coupon.plan_id is None:
        return active
    name = coupon.plan.name
    # The profile is the fast path (it mirrors the last purchase); the
    # subscription table catches accounts whose profile never got synced, so a
    # paying user is not skipped just because one row drifted.
    on_profile = set(UserProfile.objects.filter(plan=name).values_list("user_id", flat=True))
    on_subscription = set(
        Subscription.objects.filter(plan=name, end_date__gte=timezone.localdate()).values_list(
            "user_id", flat=True
        )
    )
    return active.filter(pk__in=on_profile | on_subscription)


def announce(coupon: Coupon, channel: str = CHANNEL_NEWS, pinned: bool = False) -> dict:
    """Publish `coupon` on `channel` and report what was created.

    Raises ``ValueError`` for a channel nobody serves, so the caller can turn it
    into a 400 instead of silently doing nothing.
    """
    if channel not in CHANNELS:
        raise ValueError(f"کانال اعلام نامعتبر است: {channel}")

    title, summary, body = coupon_message(coupon)
    today = timezone.localdate()

    if channel == CHANNEL_NEWS:
        news = NewsItem.objects.create(
            title=title,
            summary=summary[:320],
            body=body,
            category="تخفیف",
            date=today,
            pinned=pinned,
        )
        sent = 0
        for user in get_user_model().objects.filter(is_active=True):
            Notification.objects.create(
                user=user,
                kind="news",
                title=title,
                desc=summary[:120],
                time=today,
                link=f"/app/news/{news.pk}",
            )
            sent += 1
        return {"channel": channel, "newsId": news.pk, "sent": sent, "title": title}

    sent = 0
    for user in _target_users(coupon):
        Notification.objects.create(
            user=user,
            kind="system",
            title=title,
            desc=summary[:120],
            time=today,
            link="/app/billing",
        )
        sent += 1
    return {"channel": channel, "newsId": None, "sent": sent, "title": title}
