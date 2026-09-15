"""Resolve a user's plan and the limits that follow from it.

Plans are matched by slug *or* display name, because `Subscription.plan`
stores what the admin typed ("Pro Max") rather than the slug the API uses
("promax"). Everything that gates on a plan — the AI coach quota, image
uploads, the limits the frontend shows — resolves through here so they
cannot drift apart.
"""

from datetime import timedelta

from django.utils import timezone

from .models import AiApiCall, Plan, Subscription, UserProfile

PERIOD_DAYS = {"day": 1, "week": 7, "month": 30}
PERIOD_LABELS = {"day": "روزانه", "week": "هفتگی", "month": "ماهانه"}
UNLIMITED = -1


def _match(plans, value):
    """Find a plan by slug or name (case/space insensitive)."""
    if not value:
        return None
    needle = str(value).strip().lower().replace("‌", "")
    for plan in plans:
        if plan.slug.strip().lower() == needle:
            return plan
        if plan.name.strip().lower().replace("‌", "") == needle:
            return plan
    return None


def find_plan(value):
    """A plan by slug or display name, or None when nothing matches."""
    return _match(list(Plan.objects.all()), value)


def resolve_plan(user):
    """The plan that governs `user`, falling back to the free plan.

    Anonymous visitors (the demo portfolio) get the free plan too, so a
    logged-out session can never out-rank a paying one.
    """
    plans = list(Plan.objects.all())
    if not plans:
        return None
    free = _match(plans, "free") or plans[0]
    if user is None or not getattr(user, "is_authenticated", False):
        return free

    subscription = Subscription.objects.filter(user=user).order_by("-id").first()
    plan = _match(plans, subscription.plan) if subscription else None
    if plan is not None:
        return plan

    try:
        profile_plan = user.profile.plan
    except UserProfile.DoesNotExist:
        profile_plan = None
    return _match(plans, profile_plan) or free


def ai_quota_for_user(user):
    """How many AI coach requests `user` has left in the current window.

    Usage is counted from the existing `AiApiCall` audit rows, so the quota
    is derived from what actually happened rather than a counter that can
    drift. The window rolls: it starts at the oldest call still inside the
    period, and `resetsAt` is when that call ages out.
    """
    plan = resolve_plan(user)
    limit = plan.ai_requests_limit if plan else UNLIMITED
    period = (plan.ai_requests_period if plan else "month") or "month"
    if period not in PERIOD_DAYS:
        period = "month"

    quota = {
        "plan": plan.slug if plan else None,
        "planName": plan.name if plan else "",
        "limit": limit,
        "period": period,
        "periodLabel": PERIOD_LABELS[period],
        "used": 0,
        "remaining": -1,
        "allowed": True,
        "resetsAt": None,
    }

    email = getattr(user, "email", "") if user is not None else ""
    if not email:
        return quota

    now = timezone.now()
    window_start = now - timedelta(days=PERIOD_DAYS[period])
    calls = AiApiCall.objects.filter(user_email=email, created_at__gte=window_start)
    quota["used"] = calls.count()
    if limit < 0:
        return quota

    quota["remaining"] = max(0, limit - quota["used"])
    quota["allowed"] = quota["used"] < limit
    oldest = calls.order_by("created_at").first()
    if oldest is not None:
        quota["resetsAt"] = (oldest.created_at + timedelta(days=PERIOD_DAYS[period])).isoformat()
    return quota


def max_images_for_user(user):
    """How many screenshots a trade/journal entry may hold (-1 = unlimited)."""
    plan = resolve_plan(user)
    if plan is None:
        return UNLIMITED
    return plan.max_images_per_entry
