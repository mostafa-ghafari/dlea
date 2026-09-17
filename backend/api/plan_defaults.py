"""The feature lists each plan ships with.

`Plan.plan_features` is the list the frontend gates on: an item in the sidebar
locks when the user's plan does not include its feature. Migration 0015 added
the column with an empty default and backfilled nothing, so a database that was
never seeded handed *every* plan `features: []` — and the first purchase, which
is what puts a real plan name on a subscription, locked every page of the app
at once.

The lists live here so `seed_data` (a fresh database) and `sync_plans` (a
database that is already deployed) cannot drift apart.
"""

# Gating keys — must be spelled exactly like `PlanFeature` in src/lib/api.ts,
# because the client compares them literally.
PLAN_FEATURES = {
    "free": [
        "portfolios",
        "trades",
        "journal",
        "calendar",
        "goals",
        "achievements",
        "news",
        "support",
        "settings",
        "ai-coach",
        "risk",
    ],
    "pro": [
        "portfolios",
        "trades",
        "journal",
        "calendar",
        "goals",
        "achievements",
        "news",
        "support",
        "settings",
        "ai-coach",
        "risk",
        "mt-connection",
        "reports",
    ],
    "promax": [
        "portfolios",
        "trades",
        "journal",
        "calendar",
        "goals",
        "achievements",
        "news",
        "support",
        "settings",
        "ai-coach",
        "risk",
        "mt-connection",
        "reports",
        "psychology",
    ],
    "vip": [
        "portfolios",
        "trades",
        "journal",
        "calendar",
        "goals",
        "achievements",
        "news",
        "support",
        "settings",
        "ai-coach",
        "risk",
        "mt-connection",
        "reports",
        "psychology",
    ],
}

# `Plan.features` is marketing copy on the pricing table, not gating.
PLAN_BULLETS = {
    "free": ["۱ پرتفولیو", "۵۰ معامله در ماه", "ژورنال ساده", "آمار پایه"],
    "pro": [
        "پرتفولیو نامحدود",
        "معاملات نامحدود",
        "اتصال MetaTrader",
        "تحلیل هوش مصنوعی",
        "گزارش‌های حرفه‌ای",
        "نمودارهای کامل",
    ],
    "promax": [
        "پرتفولیو نامحدود",
        "تمامی امکانات Pro",
        "AI پیشرفته + مربی شخصی",
        "تحلیل روانشناسی",
        "گزارش‌های اختصاصی",
        "دسترسی زودهنگام به قابلیت‌های جدید",
    ],
    "vip": [
        "پرتفولیو نامحدود",
        "تمامی امکانات Pro Max",
        "پشتیبانی اختصاصی",
    ],
}


def features_for(slug: str) -> list:
    """A copy — callers store the result on a model field."""
    return list(PLAN_FEATURES.get(slug, []))


def bullets_for(slug: str) -> list:
    return list(PLAN_BULLETS.get(slug, []))


def has_defaults(slug: str) -> bool:
    return slug in PLAN_FEATURES
