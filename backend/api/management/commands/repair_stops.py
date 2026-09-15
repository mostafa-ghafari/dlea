"""Backfill SL/TP that only survived inside MetaTrader's close comment.

Trades synced by an older EA (v1.04 and earlier) captured the stop at open
time only, so a stop that was added or moved on a live position never made
it into the record: `sl` stayed 0 even though MT5 wrote "[sl 1.16225]" into
the deal comment that we do store.

This command reads those markers back and fills the empty fields, so the
history can be repaired without re-syncing everything from MetaTrader:

    python manage.py repair_stops            # dry-run: report only
    python manage.py repair_stops --apply    # write the repairs
"""

from django.core.management.base import BaseCommand

from api.mt_stops import (
    implausible_rr,
    incomplete_trades,
    missing_levels,
    repair_missing_stops,
)


class Command(BaseCommand):
    help = "Repair stop-derived trade fields (SL/TP and R:R) from MetaTrader data"

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="write the repairs (default is a dry run that only reports)",
        )
        parser.add_argument(
            "--portfolio",
            type=int,
            default=None,
            help="limit the repair to one portfolio id",
        )
        parser.add_argument(
            "--show",
            action="store_true",
            help="list every repaired trade instead of only a summary",
        )
        parser.add_argument(
            "--rr",
            action="store_true",
            help=(
                "also recompute R:R from entry/exit/SL where the stored value "
                "is not a plausible ratio (old EA builds divided by volume x 100)"
            ),
        )

    def handle(self, *args, **options):
        fix_rr = options["rr"]
        trades = incomplete_trades(
            options["portfolio"], include_bad_rr=fix_rr
        ).order_by("close_time")

        if not options["apply"]:
            scanned = 0
            repairable = 0
            for trade in trades:
                scanned += 1
                filled = missing_levels(trade)
                needs_rr = fix_rr and implausible_rr(trade.rr)
                if not filled and not needs_rr:
                    continue
                repairable += 1
                detail = ", ".join(f"{k.upper()}={v}" for k, v in filled.items())
                if needs_rr:
                    detail += (" | " if detail else "") + f"R:R {trade.rr} → recomputed"
                self.stdout.write(
                    f"  [dry-run] ticket {trade.ticket} {trade.symbol}: {detail}"
                )
            self.stdout.write(
                self.style.WARNING(
                    f"Dry run: {repairable} of {scanned} trade(s) can be repaired. "
                    "Re-run with --apply to write them."
                )
            )
            return

        if options["show"]:
            for trade in trades:
                filled = missing_levels(trade)
                if filled:
                    detail = ", ".join(f"{k.upper()}={v}" for k, v in filled.items())
                    self.stdout.write(
                        f"  repairing ticket {trade.ticket} {trade.symbol}: {detail}"
                    )

        result = repair_missing_stops(trades, fix_rr=fix_rr)
        self.stdout.write(
            self.style.SUCCESS(
                f"Repaired {result.repaired} of {result.scanned} trade(s): "
                f"SL filled: {result.filled_sl}, TP filled: {result.filled_tp}, "
                f"R:R recomputed: {result.fixed_rr}."
            )
        )
