from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0026_mtconnection_ea_version"),
    ]

    operations = [
        migrations.AddField(
            model_name="coupon",
            name="plan",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="coupons",
                to="api.plan",
            ),
        ),
    ]
