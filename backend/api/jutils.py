"""Jalali (Persian) formatting helpers.

The React UI renders Persian strings like `۱۴۰۳/۰۸/۱۲ ۱۰:۱۴`. These helpers
convert stored Gregorian datetimes into exactly that shape so the frontend
types need no changes.
"""

from datetime import date, datetime

import jdatetime


def _fa(value: str) -> str:
    return (
        value.replace("0", "۰")
        .replace("1", "۱")
        .replace("2", "۲")
        .replace("3", "۳")
        .replace("4", "۴")
        .replace("5", "۵")
        .replace("6", "۶")
        .replace("7", "۷")
        .replace("8", "۸")
        .replace("9", "۹")
    )


def to_jalali(dt: datetime) -> str:
    """`2024-11-03 10:14` → `۱۴۰۳/۰۸/۱۳ ۱۰:۱۴`"""
    j = jdatetime.datetime.fromgregorian(datetime=dt)
    return _fa(f"{j.year:04d}/{j.month:02d}/{j.day:02d} {j.hour:02d}:{j.minute:02d}")


def to_jalali_date(d: date) -> str:
    """`2024-11-03` → `۱۴۰۳/۰۸/۱۳`"""
    j = jdatetime.date.fromgregorian(date=d)
    return _fa(f"{j.year:04d}/{j.month:02d}/{j.day:02d}")


def duration_fa(open_dt: datetime, close_dt: datetime) -> str:
    """`3h28m` → `۳س ۲۸د`"""
    mins = max(0, int((close_dt - open_dt).total_seconds() // 60))
    h, m = divmod(mins, 60)
    if h == 0:
        return _fa(f"{m}د")
    return _fa(f"{h}س {m:02d}د").replace("۰د", "د")


def fa_price(raw: str) -> str:
    """`500,000` → `۵۰۰,۰۰۰`"""
    return _fa(raw)


def month_name_fa(d: date) -> str:
    """Gregorian month → Persian month name used in UI strings."""
    j = jdatetime.date.fromgregorian(date=d)
    names = {
        1: "فروردین", 2: "اردیبهشت", 3: "خرداد", 4: "تیر", 5: "مرداد", 6: "شهریور",
        7: "مهر", 8: "آبان", 9: "آذر", 10: "دی", 11: "بهمن", 12: "اسفند",
    }
    return names[j.month]


def week_label(d: date) -> str:
    """`هفته ۲ — آبان` for the journal week bucket."""
    j = jdatetime.date.fromgregorian(date=d)
    week_no = (j.day - 1) // 7 + 1
    return f"هفته {_fa(str(week_no))} — {month_name_fa(d)}"


def month_label(d: date) -> str:
    """`آبان ۱۴۰۳`"""
    j = jdatetime.date.fromgregorian(date=d)
    return f"{month_name_fa(d)} {_fa(str(j.year))}"
