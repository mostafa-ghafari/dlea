"""Give the existing plan rows the feature lists migration 0015 left empty.

`plan_features` is what gates the app: the frontend locks a sidebar item when
the signed-in user's plan does not list that feature. The column was added with
`default=list` and nothing backfilled it, so any database that never ran
`seed_data` served `features: []` for every plan — which locks every page as
soon as a subscription names one of them (that is exactly what the first
successful payment did in production).

Only empty lists are filled here: a list an admin has curated is left as it is.
The lists are copied rather than imported so this migration keeps working the
same way forever, and `sync_plans` shares the same values going forward.
"""

from django.db import migrations

PLAN_FEATURES = {
    "free": [
        "portfolios", "trades", "journal", "calendar", "goals",
        "achievements", "news", "support", "settings", "ai-coach", "risk",
    ],
    "pro": [
        "portfolios", "trades", "journal", "calendar", "goals",
        "achievements", "news", "support", "settings", "ai-coach", "risk",
        "mt-connection", "reports",
    ],
    "promax": [
        "portfolios", "trades", "journal", "calendar", "goals",
        "achievements", "news", "support", "settings", "ai-coach", "risk",
        "mt-connection", "reports", "psychology",
    ],
    "vip": [
        "portfolios", "trades", "journal", "calendar", "goals",
        "achievements", "news", "support", "settings", "ai-coach", "risk",
        "mt-connection", "reports", "psychology",
    ],
}

PLAN_BULLETS = {
    "free": ["۱ پرتفولیو", "۵۰ معامله در ماه", "ژورنال ساده", "آمار پایه"],
    "pro": [
        "پرتفولیو نامحدود", "معاملات نامحدود", "اتصال MetaTrader",
        "تحلیل هوش مصنوعی", "گزارش‌های حرفه‌ای", "نمودارهای کامل",
    ],
    "promax": [
        "پرتفولیو نامحدود", "تمامی امکانات Pro", "AI پیشرفته + مربی شخصی",
        "تحلیل روانشناسی", "گزارش‌های اختصاصی",
        "دسترسی زودهنگام به قابلیت‌های جدید",
    ],
    "vip": ["پرتفولیو نامحدود", "تمامی امکانات Pro Max", "پشتیبانی اختصاصی"],
}


def fill_plan_features(apps, schema_editor):
    Plan = apps.get_model("api", "Plan")
    for plan in Plan.objects.all():
        fields = []
        if not plan.plan_features and plan.slug in PLAN_FEATURES:
            plan.plan_features = list(PLAN_FEATURES[plan.slug])
            fields.append("plan_features")
        if not plan.features and plan.slug in PLAN_BULLETS:
            plan.features = list(PLAN_BULLETS[plan.slug])
            fields.append("features")
        if fields:
            plan.save(update_fields=fields)


def noop(apps, schema_editor):
    """Nothing to undo — the data it fills in is a repair, not a state change."""


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0019_payment_gateway_order_fields"),
    ]

    operations = [
        migrations.RunPython(fill_plan_features, noop),
    ]
