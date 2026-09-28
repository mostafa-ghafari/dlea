"""Add the MT connection's disconnected flag.

One webhook token serves every portfolio of a user, so switching the active
portfolio would silently start filing a different account's trades under the
newly activated portfolio. The connection is now marked disconnected whenever
that happens (or when the trader disconnects by hand) and the EA's pushes are
rejected until it is reconnected on purpose.

Existing rows stay connected: the default is False, which is the state they
were already in.
"""

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0022_sync_coach_plan_scores"),
    ]

    operations = [
        migrations.AddField(
            model_name="mtconnection",
            name="disconnected",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="mtconnection",
            name="disconnect_reason",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
    ]
