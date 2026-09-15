"""Turn `Payment` into a real gateway order.

The table used to hold only settled payments typed in by hand (user name,
plan, amount as text). Routing a buyer through the bank needs a few more
facts on the row: which account paid, which plan/cycle was bought, the
gateway session id to match the callback against, and the tracking code and
card number the gateway returns on confirmation.

Existing rows keep working: they are settled (`موفق`) and simply have no
gateway session, so the callback can never touch them.
"""

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("api", "0018_plan_ai_quota_and_image_limit"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="payment",
            options={"ordering": ["-id"]},
        ),
        migrations.AddField(
            model_name="payment",
            name="account",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="payments",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="payment",
            name="plan_slug",
            field=models.CharField(blank=True, default="", max_length=16),
        ),
        migrations.AddField(
            model_name="payment",
            name="cycle",
            field=models.CharField(
                choices=[("monthly", "ماهانه"), ("yearly", "سالانه")],
                default="monthly",
                max_length=8,
            ),
        ),
        migrations.AddField(
            model_name="payment",
            name="amount_rial",
            field=models.BigIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="payment",
            name="gateway",
            field=models.CharField(default="zibal", max_length=16),
        ),
        migrations.AddField(
            model_name="payment",
            name="authority",
            field=models.CharField(blank=True, default="", max_length=64),
        ),
        migrations.AddField(
            model_name="payment",
            name="card_number",
            field=models.CharField(blank=True, default="", max_length=24),
        ),
        migrations.AddField(
            model_name="payment",
            name="paid_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
