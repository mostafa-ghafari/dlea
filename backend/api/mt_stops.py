"""Shared logic for the stop-derived trade fields we get from MetaTrader.

Two things live here, both of which depend on the stop being known:

1. SL/TP that an older EA never delivered (see below).
2. R:R, which the project defines the same way `seed_data.py` does:

       rr = |exit - entry| / |entry - sl|

   i.e. how far price actually travelled divided by how much was risked.
   It is undefined without a stop, so it is 0 when there is none.


Older builds of the sync EA captured a position's SL/TP once, at open time,
so a stop the trader added or moved afterwards stayed 0 in our copy of the
trade — while MT5 itself kept a marker in the deal comment we do store:

    "[sl 1.16225]"  /  "[tp 1.16204]"

Those markers are the only surviving evidence of the level, so both the
`repair_stops` management command and the Django admin action funnel through
the helpers here.
"""

import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation

from django.db.models import Q

from .models import Trade

_COMMENT_LEVEL_RE = re.compile(r"\[(sl|tp)\s+([0-9]+(?:\.[0-9]+)?)\]", re.IGNORECASE)


def levels_from_comment(comment):
    """Extract SL/TP levels from MetaTrader's own close comment.

    Returns {"sl": float} / {"tp": float} for whichever markers are present
    (only positive levels). Missing fields are simply absent.
    """
    levels = {}
    for tag, raw in _COMMENT_LEVEL_RE.findall(comment or ""):
        try:
            value = float(raw)
        except ValueError:
            continue
        if value > 0:
            levels[tag.lower()] = value
    return levels


def missing_levels(trade):
    """Levels that the trade's comment proves but the record is lacking.

    Existing values always win — this only ever fills gaps.
    """
    filled = {}
    for field, level in levels_from_comment(trade.comment).items():
        if float(getattr(trade, field) or 0) > 0:
            continue
        try:
            filled[field] = Decimal(str(level))
        except InvalidOperation:
            continue
    return filled


# The buggy EA formula divided by (price distance x volume x 100), which
# produced values like 617 or 1000. Anything beyond this is treated as
# nonsense to recompute rather than a real ratio worth keeping.
IMPLAUSIBLE_RR = 20.0


def realized_rr(entry, exit_price, sl):
    """R:R of the outcome — distance travelled / distance risked.

    Returns None when the stop is missing (or equals the entry), because the
    ratio genuinely does not exist then; callers should leave `rr` alone
    rather than invent a number.
    """
    try:
        entry = float(entry)
        exit_price = float(exit_price)
        sl = float(sl)
    except (TypeError, ValueError):
        return None
    # sl == 0 means "no stop", not "a stop at price zero" — and an entry
    # with no risked distance has no ratio to divide by either.
    if sl <= 0:
        return None
    risk = abs(entry - sl)
    if risk <= 0:
        return None
    return round(abs(exit_price - entry) / risk, 2)


def implausible_rr(value):
    """True when a stored R:R cannot be a real ratio (0, negative, huge)."""
    try:
        value = float(value or 0)
    except (TypeError, ValueError):
        return False
    return value <= 0 or value > IMPLAUSIBLE_RR


def incomplete_trades(portfolio_id=None, include_bad_rr=False):
    """Trades whose stop-derived fields may still need repair.

    By default that means a missing stop plus an MT-style comment (the only
    place the level can come from). `include_bad_rr` widens the net to every
    trade whose stored R:R is not a plausible ratio, which is how old EA
    builds left complete trades (stop present, ratio like 617).
    """
    needs_repair = Q(comment__contains="[") & (Q(sl=0) | Q(tp=0))
    if include_bad_rr:
        needs_repair |= Q(rr__lte=0) | Q(rr__gt=IMPLAUSIBLE_RR)
    queryset = Trade.objects.filter(needs_repair)
    if portfolio_id:
        queryset = queryset.filter(portfolio_id=portfolio_id)
    return queryset


@dataclass
class RepairResult:
    """What a repair pass did, so callers can report it to a human."""

    scanned: int = 0
    repaired: int = 0
    filled_sl: int = 0
    filled_tp: int = 0
    fixed_rr: int = 0

    @property
    def skipped(self):
        return self.scanned - self.repaired


def repair_missing_stops(trades, fix_rr=False):
    """Repair stop-derived fields on `trades`.

    Always fills empty SL/TP from MT's comment markers; with `fix_rr` it also
    recomputes R:R for trades whose stored value is not a plausible ratio
    (the old EA divided by volume x 100, producing values like 617).

    Returns a `RepairResult`. Callers that only want a preview should use
    `incomplete_trades()` + `missing_levels()` / `implausible_rr()` instead.
    """
    result = RepairResult()
    for trade in trades:
        result.scanned += 1
        filled = missing_levels(trade)
        for field, value in filled.items():
            setattr(trade, field, value)
        if filled:
            result.filled_sl += 1 if "sl" in filled else 0
            result.filled_tp += 1 if "tp" in filled else 0

        rr = None
        if fix_rr and implausible_rr(trade.rr):
            rr = realized_rr(trade.entry, trade.exit, trade.sl)
            if rr is not None:
                trade.rr = rr
                result.fixed_rr += 1

        if not filled and rr is None:
            continue
        trade.save(update_fields=list(filled) + (["rr"] if rr is not None else []) + ["updated_at"])
        result.repaired += 1
    return result
