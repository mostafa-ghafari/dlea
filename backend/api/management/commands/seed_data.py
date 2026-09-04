"""Seed data generator — curated Persian content + Faker-generated data."""

import math
import random
from datetime import datetime, timedelta
from decimal import Decimal

from django.utils import timezone
from faker import Faker

from api.jutils import month_label, week_label
from api.models import (
    Achievement,
    AchievementHistory,
    AuditEntry,
    CalendarDay,
    EconomicEvent,
    EquityCurvePoint,
    ForexSymbol,
    Goal,
    JournalEntry,
    JournalGroup,
    MonthlyPerformance,
    NewsItem,
    Notification,
    Payment,
    Plan,
    PlatformUser,
    Portfolio,
    ReferralLink,
    RoleTier,
    Strategy,
    Subscription,
    Ticket,
    TicketMessage,
    Trade,
    TradeColumn,
)

fake = Faker("fa_IR")
fake_en = Faker()

D = Decimal

# ---------------------------------------------------------------------------
# Catalog
# ---------------------------------------------------------------------------

FOREX_SYMBOLS = [
    "EURUSD", "GBPUSD", "USDJPY", "USDCHF", "AUDUSD", "USDCAD", "NZDUSD",
    "EURJPY", "GBPJPY", "EURGBP", "AUDJPY", "CADJPY", "CHFJPY", "EURAUD",
    "EURCHF", "GBPAUD", "GBPCAD", "NZDJPY", "AUDNZD", "USDSGD",
]

STRATEGIES = [
    "Break & Retest",
    "Order Block لندن",
    "Supply & Demand",
    "Trend Continuation",
    "Range Reversal",
    "News Scalp",
]

TRADE_COLUMNS = [
    ("ticket", "شناسه معامله (Ticket)", True, True, True),
    ("symbol", "نماد", True, True, False),
    ("side", "نوع معامله", True, True, False),
    ("entry", "قیمت ورود", True, True, True),
    ("exit", "قیمت خروج", True, True, True),
    ("volume", "حجم (Lot)", True, True, True),
    ("rr", "R:R", True, True, True),
    ("pnl", "سود / زیان", True, True, True),
    ("sl", "حد ضرر (SL)", True, True, True),
    ("tp", "حد سود (TP)", True, True, True),
    ("openTime", "زمان باز شدن", False, True, False),
    ("closeTime", "زمان بسته شدن", False, True, False),
    ("duration", "مدت معامله", False, True, False),
    ("pips", "پیپ", False, True, True),
    ("commission", "کارمزد (Commission)", False, True, True),
    ("swap", "سواپ (Swap)", False, True, True),
    ("taxes", "مالیات (Taxes)", False, True, True),
    ("magic", "Magic Number", False, True, True),
    ("comment", "کامنت", False, True, False),
    ("reason", "منشأ سفارش (Reason)", False, True, False),
    ("strategy", "استراتژی", True, True, False),
    ("portfolio", "پرتفولیو", False, True, False),
    ("followedPlan", "پایبندی به پلن", True, True, False),
    ("emotion", "احساس", False, True, False),
    ("date", "تاریخ", True, True, False),
]

ROLE_TIERS = [
    (1, 0, 20, "تریدر"),
    (2, 20, 60, "حرفه‌ای"),
    (3, 60, 100, "استاد"),
]

# ---------------------------------------------------------------------------
# Trading domain
# ---------------------------------------------------------------------------

CURATED_TRADES = [
    # ticket, symbol, side, entry, exit, sl, tp, volume, pnl, rr, pips, commission,
    # swap, open_dt, close_dt, magic, comment, reason, strategy, portfolio, plan, emotion
    ("80412042", "EURUSD", "buy", "1.0842", "1.0891", "1.0812", "1.0902", "1.2", "588", "2.4", "49", "-7.2", "-1.4", (2024, 11, 2, 10, 14), (2024, 11, 2, 13, 42), 10021, "London OB", "Client", "Order Block لندن", "پرتفوی اصلی", True, "آرام"),
    ("80412041", "GBPUSD", "sell", "1.2985", "1.2902", "1.3022", "1.2890", "0.9", "715", "1.8", "83", "-5.4", "0.8", (2024, 11, 1, 9, 5), (2024, 11, 1, 16, 20), 10021, "Break & Retest", "Client", "Break & Retest", "پرتفوی اصلی", True, "متمرکز"),
    ("80412040", "USDJPY", "buy", "151.42", "151.18", "151.05", "152.10", "0.5", "-220", "-0.9", "-24", "-3.0", "-0.6", (2024, 10, 31, 11, 30), (2024, 10, 31, 12, 5), 0, "FOMO entry", "Client", "News Scalp", "پرتفوی اصلی", False, "طمع (FOMO)"),
    ("80412039", "GBPJPY", "sell", "198.42", "197.60", "198.90", "197.40", "0.8", "512", "2.1", "82", "-4.8", "-2.1", (2024, 10, 30, 8, 45), (2024, 10, 30, 14, 10), 10021, "Daily S/D", "Client", "Supply & Demand", "پرتفوی اصلی", True, "آرام"),
    ("80412038", "AUDUSD", "buy", "0.6612", "0.6578", "0.6570", "0.6680", "1.0", "-340", "-1.2", "-34", "-6.0", "-1.0", (2024, 10, 29, 15, 20), (2024, 10, 29, 17, 55), 0, "Revenge", "Client", "Trend Continuation", "پرتفوی دوم", False, "انتقام"),
    ("80412037", "EURUSD", "buy", "1.0801", "1.0844", "1.0778", "1.0855", "1.0", "430", "1.9", "43", "-6.0", "0.3", (2024, 10, 28, 10, 0), (2024, 10, 28, 15, 30), 10021, "London OB", "Client", "Order Block لندن", "پرتفوی اصلی", True, "متمرکز"),
    ("80412036", "USDCAD", "sell", "1.3820", "1.3798", "1.3852", "1.3760", "0.6", "128", "1.1", "22", "-3.6", "-0.4", (2024, 10, 27, 13, 10), (2024, 10, 27, 16, 45), 10021, "Range", "Client", "Range Reversal", "پرتفوی دوم", True, "آرام"),
    ("80412035", "EURJPY", "buy", "164.20", "163.10", "163.00", "166.00", "1.4", "-1127", "-1.6", "-110", "-8.4", "-3.2", (2024, 10, 26, 9, 30), (2024, 10, 26, 18, 15), 0, "Fear exit", "Client", "Trend Continuation", "پرتفوی اصلی", False, "ترس"),
]

# Typical base price per symbol (used to make generated trades plausible).
PRICE_BASE = {
    "EURUSD": 1.08, "GBPUSD": 1.29, "USDJPY": 151.0, "USDCHF": 0.88, "AUDUSD": 0.66,
    "USDCAD": 1.38, "NZDUSD": 0.61, "EURJPY": 164.0, "GBPJPY": 198.0, "EURGBP": 0.84,
    "AUDJPY": 100.0, "CADJPY": 110.0, "CHFJPY": 172.0, "EURAUD": 1.64, "EURCHF": 0.95,
    "GBPAUD": 1.95, "GBPCAD": 1.78, "NZDJPY": 92.0, "AUDNZD": 1.08, "USDSGD": 1.34,
}

COMMENTS = [
    "London OB", "Daily S/D", "Break & Retest", "شکست سطح", "پولبک به ناحیه",
    "اخبار NFP", "چکلیست کامل", "ورود در سشن لندن", "واکنش به حمایت", "FOMO entry",
    "ورود عجولانه", "Revenge", "Range", "ورود روی روند", "سازگاری با پلن",
]

EMOTIONS = ["آرام", "متمرکز", "آرام", "متمرکز", "طمع (FOMO)", "انتقام", "ترس", "بیحوصلگی", "اعتماد به نفس"]


def _jalali_to_gregorian(y, m, d, h=0, minute=0):
    # Convert a Jalali (Persian) date to a Gregorian datetime.
    # Jalali months vary between 29 and 31 days, so clamp an out-of-range
    # day (e.g. 31 in a 30-day month) to the last valid day of that month.
    import jdatetime

    while True:
        try:
            jd = jdatetime.date(y, m, d)
            break
        except ValueError:
            d -= 1
    gd = jd.togregorian()
    return datetime(gd.year, gd.month, gd.day, h, minute, tzinfo=timezone.get_current_timezone())


def _dt(y, m, d, h=0, minute=0):
    # Curated rows store Gregorian tuples directly (e.g. (2024, 11, 2, 10, 14));
    # build the timezone-aware datetime as-is.
    return datetime(y, m, d, h, minute, tzinfo=timezone.get_current_timezone())


def seed_catalog():
    ForexSymbol.objects.bulk_create([ForexSymbol(code=c) for c in FOREX_SYMBOLS])
    Strategy.objects.bulk_create([Strategy(name=n) for n in STRATEGIES])
    TradeColumn.objects.bulk_create(
        [TradeColumn(key=k, label=l, default_visible=dv, admin_enabled=ae, numeric=nu) for k, l, dv, ae, nu in TRADE_COLUMNS]
    )
    RoleTier.objects.bulk_create([RoleTier(level=l, min_pct=a, max_pct=b, name=n) for l, a, b, n in ROLE_TIERS])


def seed_portfolios():
    data = [
        ("P1", "پرتفوی اصلی", "IC Markets", "استاندارد", 12480, 10000, "1:100", 87, "فعال", "Order Block لندن"),
        ("P2", "پرتفوی دوم", "Pepperstone", "Raw Spread", 4820, 5000, "1:200", 34, "فعال", "Range Reversal"),
        ("P3", "حساب چالش FTMO", "FTMO", "چالش", 100000, 100000, "1:100", 12, "آرشیو", "Break & Retest"),
    ]
    for _id, name, broker, ptype, balance, initial, lev, trades, status, strat in data:
        Portfolio.objects.create(
            name=name, broker=broker, type=ptype, balance=D(balance), initial=D(initial),
            leverage=lev, trades=trades, status=status, strategy=strat,
        )


def _generate_trades(portfolios):
    by_name = {p.name: p for p in portfolios}
    now = timezone.now()
    strategies = STRATEGIES
    for i in range(48):
        symbol = random.choice(FOREX_SYMBOLS)
        side = random.choice(["buy", "sell"])
        base = PRICE_BASE[symbol]
        is_jpy = symbol.endswith("JPY")
        pip = D("0.01") if is_jpy else D("0.0001")
        volume = D(str(random.choice([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.2, 1.4])))
        win = random.random() < 0.62
        pips = random.randint(25, 95) if win else -random.randint(-95, -15)
        pnl = D(pips) * volume * (D("8") if is_jpy else D("10"))
        commission = -(volume * D("6"))
        swap = D(str(round(random.uniform(-2.5, 1.2), 2)))
        sl_pips = random.randint(30, 75) if win else random.randint(15, 45)
        rr = round(abs(D(pips)) / D(sl_pips), 2)
        entry = D(str(round(base * (1 + random.uniform(-0.004, 0.004)), 5)))
        entry_dir = D("1") if side == "buy" else D("-1")
        exit_ = round(entry + entry_dir * D(pips) * pip, 5)
        sl = round(entry - entry_dir * D(sl_pips) * pip, 5)
        tp = round(entry + entry_dir * D(sl_pips) * 2 * pip, 5)
        magic = random.choice([10021, 10021, 10021, 0])
        days_ago = random.randint(1, 60)
        open_dt = now - timedelta(days=days_ago, hours=random.randint(1, 6))
        open_dt = open_dt.replace(hour=random.randint(8, 16), minute=random.randint(0, 59), second=0, microsecond=0)
        close_dt = open_dt + timedelta(minutes=random.randint(30, 480))
        portfolio = random.choices([by_name["پرتفوی اصلی"], by_name["پرتفوی دوم"]], weights=[0.8, 0.2])[0]
        Trade.objects.create(
            ticket=f"8041{random.randint(2000, 9999)}",
            symbol=symbol, side=side, entry=entry, exit=exit_, sl=sl, tp=tp, volume=volume,
            pnl=round(pnl - commission + swap, 2), rr=D(rr), pips=D(pips), commission=commission,
            swap=swap, taxes=D("0"), open_time=open_dt, close_time=close_dt, magic=magic,
            comment=random.choice(COMMENTS), reason=random.choice(["Client", "Client", "Expert", "Signal"]),
            strategy=random.choice(strategies), portfolio=portfolio,
            followed_plan=random.random() < 0.75, emotion=random.choice(EMOTIONS),
            screenshots=[],
        )


def seed_trades():
    portfolios = list(Portfolio.objects.all())
    by_name = {p.name: p for p in portfolios}
    for i, (ticket, symbol, side, entry, exit_, sl, tp, volume, pnl, rr, pips, comm, swap, open_t, close_t, magic, comment, reason, strategy, pname, plan, emotion) in enumerate(CURATED_TRADES):
        Trade.objects.create(
            ticket=ticket, symbol=symbol, side=side, entry=D(entry), exit=D(exit_), sl=D(sl), tp=D(tp),
            volume=D(volume), pnl=D(pnl), rr=D(rr), pips=D(pips), commission=D(comm), swap=D(swap),
            taxes=D("0"), open_time=_dt(*open_t), close_time=_dt(*close_t),
            magic=magic, comment=comment, reason=reason, strategy=strategy,
            portfolio=by_name[pname], followed_plan=plan, emotion=emotion, screenshots=[],
        )
    _generate_trades(portfolios)


def seed_journal():
    g_london = JournalGroup.objects.create(name="سشن لندن", color="primary")
    g_mistakes = JournalGroup.objects.create(name="درسهای اشتباه", color="destructive")
    g_review = JournalGroup.objects.create(name="مرورهای دورهای", color="accent")

    curated = [
        # date, trade_id, symbol, title, mistakes, lesson, emotion, plan, favorite, group, html
        ((2024, 11, 2), "T-1042", "EURUSD", "ستآپ EURUSD در حمایت روزانه", "بدون خطای مهم",
         "پایبندی به SL کلید بود.", "آرام", True, True, g_london,
         "<h2>شرایط بازار</h2><p>بازار لندن با نوسان بالا باز شد و قیمت دقیقاً روی حمایت روزانه واکنش نشان داد.</p><ul><li>تأیید ساختار در تایم ۱۵ دقیقه</li><li>حجم بالای خریداران</li><li>SL زیر سایه کندل</li></ul><blockquote>صبر برای تأیید، نصف سود است.</blockquote>"),
        ((2024, 10, 31), "T-1040", "USDJPY", "ورود احساسی به USDJPY", "ورود بدون تأیید، دنبال کردن قیمت",
         "منتظر پولبک بمانم؛ FOMO قاتل اکانت است.", "طمع", False, False, g_mistakes,
         "<p>بعد از انتشار خبر، بدون چکلیست وارد شدم. هیچ ستآپی وجود نداشت.</p>"),
        ((2024, 10, 29), "T-1038", "AUDUSD", "معامله انتقامی روی AUDUSD", "بلافاصله بعد از ضرر معامله مجدد.",
         "بعد از ضرر ۳۰ دقیقه استراحت الزامی است.", "انتقام", False, False, g_mistakes,
         "<h2>چه اتفاقی افتاد</h2><p>ضرر قبلی را قبول نکردم و بلافاصله پوزیشن جدید باز کردم.</p>"),
        ((2024, 10, 19), "T-1030", "GBPUSD", "مرور ماهانه مهر", "Overtrading در دو هفته پایانی",
         "سقف ۳ معامله در روز را جدی بگیرم.", "متمرکز", True, True, g_review,
         "<p>ماه مثبتی بود اما تعداد معاملات بیش از حد بود.</p>"),
    ]
    for (y, m, d), trade_id, symbol, title, mistakes, lesson, emotion, plan, fav, group, html in curated:
        dt = _dt(y, m, d)
        JournalEntry.objects.create(
            date=dt.date(), week=week_label(dt.date()), month=month_label(dt.date()),
            trade_id=trade_id, symbol=symbol, title=title, mistakes=mistakes, lesson=lesson,
            emotion=emotion, plan=plan, favorite=fav, group=group, html=html, blocks=[], images=[],
        )

    # Generated journal entries from recent fake trades.
    trades = list(Trade.objects.all()[:12])
    titles = [
        "تحلیل سشن لندن", "بازبینی هفتگی", "اشتباه ورود زودهنگام", "صبر تا تأیید ستآپ",
        "مدیریت حجم", "مرور چکلیست", "درس از ضرر دیروز", "برنامه هفته بعد",
    ]
    mistakes_pool = ["ورود قبل از تأیید", "خروج زودهنگام", "حجم بیش از حد", "معامله خارج از پلن"]
    lessons_pool = ["منتظر تأیید بمانم.", "TP را از قبل ثبت کنم.", "حجم را از ریسک ثابت محاسبه کنم.", "به چکلیست پایبند باشم."]
    for i, t in enumerate(trades[:10]):
        d = t.close_time.date()
        JournalEntry.objects.create(
            date=d, week=week_label(d), month=month_label(d), trade_id=t.ticket, symbol=t.symbol,
            title=random.choice(titles), mistakes=random.choice(mistakes_pool), lesson=random.choice(lessons_pool),
            emotion=random.choice(EMOTIONS), plan=random.random() < 0.7, favorite=random.random() < 0.3,
            group=random.choice([g_london, g_mistakes, g_review]),
            html=f"<p>{fake.sentence(nb_words=14)}</p><ul><li>{random.choice(mistakes_pool)}</li><li>رعایت حد ضرر</li></ul>",
            blocks=[], images=[],
        )


def seed_goals():
    for title, progress in [
        ("رسیدن به ۱۵٪ سود ماهانه", 62),
        ("حداکثر ۱٪ ریسک در هر معامله", 88),
        ("نوشتن ژورنال برای ۱۰۰٪ معاملات", 74),
        ("کاهش Overtrading به زیر ۵ معامله در روز", 45),
    ]:
        Goal.objects.create(title=title, progress=progress)


def seed_achievements():
    data = [
        ("۷ روز پایبند به پلن", "یک هفته کامل طبق قوانین ترید کردی.", True, "۷ روز کاری متوالی که همه معاملات آن روز followedPlan = true باشند."),
        ("کاهش دراودان ۵٪", "حداکثر دراودان را نصف کردی.", True, "MaxDD ماه جاری ≤ ۵۰٪ MaxDD ماه قبل (بر اساس Equity متاتریدر)."),
        ("بدون Revenge Trade در یک ماه", "کنترل احساسات درجه یک.", False, "هیچ معاملهای در بازه ۳۰ دقیقه پس از یک ضرر و با حجم ≥ ۱.۵ برابر میانگین باز نشده باشد."),
        ("۱۰۰ معامله ثبت‌شده", "قهرمان ژورنال‌نویسی.", True, "شمارش کل معاملات ثبت‌شده (دستی + متاتریدر) در ماه جاری ≥ ۱۰۰."),
        ("Profit Factor بالای ۲", "استراتژی سودده اثبات‌شده.", False, "مجموع سود ناخالص ÷ قدرمطلق مجموع زیان ناخالص > ۲ با حداقل ۲۰ معامله."),
        ("بدون ورود احساسی در ۳۰ روز", "روانشناسی طلایی.", False, "هیچ معاملهای با برچسب احساس در گروه (طمع، ترس، انتقام) ثبت‌نشده باشد."),
        ("اولین معامله ثبت‌شده", "سفرت را شروع کردی.", True, "حداقل یک معامله در ماه جاری ثبت‌شده باشد."),
        ("۳۰ روز متوالی ژورنال‌نویسی", "عادت طلایی ساخته شد.", True, "برای ۳۰ روز تقویمی متوالی حداقل یک ورودی ژورنال ثبت‌شده باشد."),
        ("ماه سودده", "یک ماه کامل با سود مثبت.", True, "مجموع P/L خالص ماه (شامل کارمزد و سواپ) > ۰."),
        ("Win Rate بالای ۷۰٪", "دقت شکار درجه یک.", False, "نسبت معاملات برنده به کل معاملات ماه > ۷۰٪ با حداقل ۲۰ معامله."),
        ("ریسک زیر ۱٪ در ۵۰ معامله", "مدیر ریسک واقعی.", True, "در ۵۰ معامله اخیر، ریسک محاسبهشده از SL و حجم ≤ ۱٪ موجودی باشد."),
        ("بدون Overtrading در ۲ هفته", "صبر یعنی همین.", False, "در ۱۴ روز متوالی هیچ روزی بیش از سقف تعریفشده کاربر معامله نشده باشد."),
        ("دابل کردن سرمایه", "سرمایه اولیهات را دو برابر کردی.", False, "موجودی فعلی پرتفولیو ≥ ۲ برابر موجودی اولیه."),
        ("۱۰ معامله A+ متوالی", "فقط ستآپهای تمیز.", False, "۱۰ معامله متوالی با چکلیست کامل و R:R ثبت‌شده ≥ ۲."),
        ("اتصال موفق متاتریدر", "همگامسازی خودکار فعال شد.", True, "حداقل یک پرتفولیو با وضعیت اتصال فعال به MT4/MT5."),
        ("استاد چکلیست", "۵۰ چکلیست کامل قبل از ورود.", False, "۵۰ چکلیست پیش از معامله با همه آیتمهای تیک‌خورده در ماه جاری."),
    ]
    for title, desc, earned, rule in data:
        Achievement.objects.create(title=title, desc=desc, earned=earned, rule=rule)

    AchievementHistory.objects.create(
        month="مهر ۱۴۰۳", count=9,
        earned=["۷ روز پایبند به پلن", "۱۰۰ معامله ثبت‌شده", "ماه سودده", "اولین معامله ثبت‌شده", "اتصال موفق متاتریدر", "Win Rate بالای ۷۰٪", "ریسک زیر ۱٪ در ۵۰ معامله", "۳۰ روز متوالی ژورنال‌نویسی", "Profit Factor بالای ۲"],
    )
    AchievementHistory.objects.create(
        month="شهریور ۱۴۰۳", count=5,
        earned=["اولین معامله ثبت‌شده", "اتصال موفق متاتریدر", "۷ روز پایبند به پلن", "ماه سودده", "کاهش دراودان ۵٪"],
    )
    AchievementHistory.objects.create(month="مرداد ۱۴۰۳", count=2, earned=["اولین معامله ثبت‌شده", "اتصال موفق متاتریدر"])


def seed_plans():
    plans = [
        dict(slug="free", name="رایگان", price="۰", unit="تومان", tagline="برای شروع ژورنال‌نویسی",
             portfolio_limit="۱ پرتفولیو", features=["۱ پرتفولیو", "۵۰ معامله در ماه", "ژورنال ساده", "آمار پایه"],
             cta="شروع رایگان", highlight=False, sellable=True, users=764),
        dict(slug="pro", name="Pro", price="۲۰۰,۰۰۰", unit="تومان / ماه", tagline="برای معاملهگران فعال",
             portfolio_limit="پرتفولیو نامحدود",
             features=["پرتفولیو نامحدود", "معاملات نامحدود", "اتصال MetaTrader", "تحلیل هوش مصنوعی", "گزارشهای حرفهای", "نمودارهای کامل"],
             cta="انتخاب Pro", highlight=True, sellable=True, users=302),
        dict(slug="promax", name="Pro Max", price="۵۰۰,۰۰۰", unit="تومان / ماه", tagline="مربی شخصی معاملهگری",
             portfolio_limit="پرتفولیو نامحدود",
             features=["پرتفولیو نامحدود", "تمامی امکانات Pro", "AI پیشرفته + مربی شخصی", "تحلیل روانشناسی", "گزارشهای اختصاصی", "دسترسی زودهنگام به قابلیتهای جدید"],
             cta="انتخاب Pro Max", highlight=False, sellable=True, users=180),
        dict(slug="vip", name="VIP", price="—", unit="غیرقابل فروش", tagline="فقط با تخصیص دستی مدیر",
             portfolio_limit="پرتفولیو نامحدود",
             features=["پرتفولیو نامحدود", "تمامی امکانات Pro Max", "پشتیبانی اختصاصی"],
             cta="تخصیص دستی", highlight=False, sellable=False, users=12),
    ]
    for p in plans:
        Plan.objects.create(**p)


def seed_subscription():
    start = _jalali_to_gregorian(1403, 7, 1).date()
    end = _jalali_to_gregorian(1403, 8, 1).date()
    Subscription.objects.create(
        plan="Pro Max", start_date=start, end_date=end, total_days=30, days_left=12,
        price="۵۰۰,۰۰۰ تومان / ماه",
    )


def seed_admin():
    users = [
        ("علی رضایی", "ali@example.com", "Pro Max", "فعال", (1403, 5, 12)),
        ("مریم احمدی", "maryam@example.com", "Pro", "فعال", (1403, 6, 2)),
        ("حسین کریمی", "hk@example.com", "رایگان", "فعال", (1403, 7, 19)),
        ("نگار موسوی", "negar@example.com", "VIP", "فعال", (1403, 4, 8)),
        ("امیر صادقی", "amir@example.com", "Pro Max", "فعال", (1403, 3, 15)),
    ]
    for name, email, plan, status, joined in users:
        PlatformUser.objects.create(name=name, email=email, plan=plan, status=status, joined=_jalali_to_gregorian(*joined).date())

    # Extra faker users so the admin panel feels alive.
    for _ in range(8):
        PlatformUser.objects.create(
            name=fake.name(), email=fake_en.email(), plan=random.choice(["رایگان", "Pro", "Pro Max"]),
            status=random.choice(["فعال", "فعال", "غیرفعال"]),
            joined=timezone.now().date() - timedelta(days=random.randint(10, 400)),
        )

    payments = [
        ("علی رضایی", "Pro Max", "۵۰۰,۰۰۰ تومان", (1403, 8, 1), "موفق"),
        ("مریم احمدی", "Pro", "۲۰۰,۰۰۰ تومان", (1403, 7, 28), "موفق"),
        ("امیر صادقی", "Pro Max", "۵۰۰,۰۰۰ تومان", (1403, 7, 20), "موفق"),
        ("نگار موسوی", "Pro", "۲۰۰,۰۰۰ تومان", (1403, 7, 15), "ناموفق"),
    ]
    for user, plan, amount, date, status in payments:
        Payment.objects.create(user=user, plan=plan, amount=amount, date=_jalali_to_gregorian(*date).date(), status=status)

    for name, code, clicks, signups in [
        ("منتور — رضا کاظمی", "reza-mentor", 482, 96),
        ("کانال تلگرام فارکسلند", "forexland", 1240, 213),
        ("وبینار آبان", "webinar-aban", 318, 54),
    ]:
        ReferralLink.objects.create(name=name, code=code, clicks=clicks, signups=signups)


def seed_content():
    news = [
        dict(title="تخفیف ۳۰٪ اشتراک Pro Max تا پایان هفته",
             summary="با کد تخفیف PROMAX30 میتوانی اشتراک سالانه Pro Max را با ۳۰٪ تخفیف فعال کنی.",
             body="به مناسبت انتشار نسخه جدید پلتفرم، کد تخفیف PROMAX30 برای همه کاربران فعال شد.\n\nاین کد روی اشتراک ماهانه و سالانه Pro Max اعمال میشود و تا پایان هفته جاری معتبر است. برای استفاده کافی است در صفحه «خرید اشتراک» کد را وارد و روی «اعمال» بزنی.",
             category="تخفیف", date=(1403, 8, 14), pinned=True),
        dict(title="انتشار ایمپورت مستقیم گزارش متاتریدر",
             summary="حالا میتوانی خروجی History متاتریدر (CSV/HTML) را مستقیماً بارگذاری کنی و معاملات خودکار خوانده شوند.",
             body="در نسخه جدید، بخش «افزودن معامله» بازطراحی شد.\n\nکافی است در متاتریدر از تب History خروجی Report بگیری و فایل را در صفحه ایمپورت رها کنی. تمام فیلدها شامل Ticket، Symbol، Volume، Swap و Commission شناسایی و پیشنمایش داده میشود؛ سپس با یک کلیک به لیست معاملات اضافه میشود.",
             category="آپدیت", date=(1403, 8, 10), pinned=False),
        dict(title="اضافه شدن تم روشن و منوی جمعشونده",
             summary="تم روشن به پلتفرم اضافه شد و سایدبار پنل در دسکتاپ قابل جمعشدن است.",
             body="بر اساس بازخورد کاربران، تم روشن به پلتفرم اضافه شد و میتوانی از نوار بالای پنل بین تم تیره و روشن جابهجا شوی.\n\nهمچنین منوی کناری در دسکتاپ قابلیت جمعشدن دارد تا فضای بیشتری برای جدولها و نمودارها باقی بماند.",
             category="اطلاعیه", date=(1403, 8, 4), pinned=False),
    ]
    for n in news:
        NewsItem.objects.create(title=n["title"], summary=n["summary"], body=n["body"],
                                category=n["category"], date=_jalali_to_gregorian(*n["date"]).date(), pinned=n["pinned"])

    t1 = Ticket.objects.create(subject="پرداخت انجام شد ولی اشتراک فعال نشد", topic="پرداخت", status="پاسخ داده شد",
                               user="علی رضایی", email="ali@example.com",
                               created_at=_jalali_to_gregorian(1403, 8, 12, 10, 20),
                               updated_at=_jalali_to_gregorian(1403, 8, 12, 12, 5))
    TicketMessage.objects.create(ticket=t1, author="user", author_name="علی رضایی",
                                 body="سلام، مبلغ از حسابم کسر شد اما پلن هنوز رایگان است. شماره پیگیری: 8841203",
                                 created_at=_jalali_to_gregorian(1403, 8, 12, 10, 20), attachments=[])
    TicketMessage.objects.create(ticket=t1, author="admin", author_name="پشتیبانی",
                                 body="سلام، تراکنش بررسی و تأیید شد. اشتراک Pro Max روی حسابت فعال شد. بابت تأخیر عذرخواهی میکنیم.",
                                 created_at=_jalali_to_gregorian(1403, 8, 12, 12, 5), attachments=[])

    t2 = Ticket.objects.create(subject="خطا هنگام ایمپورت فایل HTML متاتریدر", topic="فنی", status="در حال بررسی",
                               user="مریم احمدی", email="maryam@example.com",
                               created_at=_jalali_to_gregorian(1403, 8, 11, 9, 40),
                               updated_at=_jalali_to_gregorian(1403, 8, 11, 9, 40))
    TicketMessage.objects.create(ticket=t2, author="user", author_name="مریم احمدی",
                                 body="فایل گزارش MT5 را آپلود میکنم ولی هیچ معاملهای شناسایی نمیشود.",
                                 created_at=_jalali_to_gregorian(1403, 8, 11, 9, 40), attachments=[])

    Notification.objects.create(user=None, kind="news", title="تخفیف ۳۰٪ اشتراک Pro Max", desc="کد PROMAX30 تا پایان هفته فعال است.",
                                time=_jalali_to_gregorian(1403, 8, 14).date(), link="/app/news/N-3", read=False)
    Notification.objects.create(user=None, kind="ticket", title="پاسخ پشتیبانی به تیکت TK-1024", desc="تراکنش بررسی و اشتراک فعال شد.",
                                time=_jalali_to_gregorian(1403, 8, 12).date(), link="/app/support", read=False)
    Notification.objects.create(user=None, kind="system", title="یادآور ژورنال", desc="برای معامله T-1042 ژورنال ثبت نکردی.",
                                time=_jalali_to_gregorian(1403, 8, 12).date(), link="/app/journal", read=False)

    AuditEntry.objects.create(actor="مدیر سیستم", action="تغییر پلن", target="مریم احمدی",
                              details="رایگان ← Pro (بدون پرداخت)",
                              created_at=_jalali_to_gregorian(1403, 8, 10, 11, 22))


def seed_economic_events():
    events = [
        ("۱۱:۳۰", "EUR", "شاخص PMI خدمات", "medium", "۵۲.۱", "۵۱.۸"),
        ("۱۴:۰۰", "GBP", "نرخ بهره بانک انگلستان", "high", "۵.۰۰٪", "۵.۲۵٪"),
        ("۱۶:۳۰", "USD", "مدعیان بیکاری هفتگی", "medium", "۲۲۰K", "۲۱۸K"),
        ("۱۷:۰۰", "USD", "نطق رئیس فدرال رزرو", "high", "—", "—"),
        ("۱۸:۳۰", "CAD", "موجودی نفت خام", "low", "-۱.۲M", "+۰.۸M"),
        ("۲۱:۰۰", "JPY", "تراز تجاری", "low", "-۴۵۰B", "-۵۱۰B"),
    ]
    for time, currency, title, impact, forecast, previous in events:
        EconomicEvent.objects.create(time=time, currency=currency, title=title, impact=impact,
                                     forecast=forecast, previous=previous)


def seed_analytics():
    for i in range(30):
        base = 10000
        drift = i * 120
        noise = math.sin(i * 0.6) * 400 + math.cos(i * 0.3) * 200
        EquityCurvePoint.objects.create(
            day=f"روز {i + 1}",
            equity=round(base + drift + noise),
            balance=round(base + drift + noise * 0.6),
            index=i,
        )

    for i, (month, pnl) in enumerate([
        ("فروردین", 820), ("اردیبهشت", -320), ("خرداد", 1240), ("تیر", 640),
        ("مرداد", -180), ("شهریور", 1580), ("مهر", 940), ("آبان", 2100),
    ]):
        MonthlyPerformance.objects.create(month=month, pnl=pnl, index=i)

    for i in range(35):
        day = i - 3
        if day < 1 or day > 30:
            CalendarDay.objects.create(day=None, pnl=0, trades=0, index=i)
            continue
        pnl = round(math.sin(i * 1.7) * 800 + math.cos(i * 0.9) * 400)
        CalendarDay.objects.create(day=day, pnl=pnl, trades=((i % 4) + 1) if abs(pnl) > 100 else 0, index=i)


def run(stdout, stderr):
    stdout.write("Clearing previous seed data…")

    # Delete in FK-safe order.
    for model in [Trade, Portfolio, JournalEntry, JournalGroup, Goal, Achievement, AchievementHistory,
                  RoleTier, Plan, Subscription, PlatformUser, Payment, ReferralLink, NewsItem, Ticket,
                  TicketMessage, Notification, AuditEntry, EconomicEvent, EquityCurvePoint,
                  MonthlyPerformance, CalendarDay, ForexSymbol, Strategy, TradeColumn]:
        model.objects.all().delete()

    # Defer coach models to seed_coach.run().
    from api.management.commands.seed_coach import run as run_coach

    def _run_coach():
        run_coach(stdout, stderr)

    stdout.write("Seeding catalog…")
    seed_catalog()
    stdout.write("Seeding portfolios & trades…")
    seed_portfolios()
    seed_trades()
    stdout.write("Seeding journal…")
    seed_journal()
    stdout.write("Seeding goals & achievements…")
    seed_goals()
    seed_achievements()
    stdout.write("Seeding plans, subscription & admin…")
    seed_plans()
    seed_subscription()
    seed_admin()
    stdout.write("Seeding platform content…")
    seed_content()
    stdout.write("Seeding analytics widgets…")
    seed_economic_events()
    seed_analytics()
    stdout.write("Seeding AI coach…")
    _run_coach()
    stdout.write(f"  trades={Trade.objects.count()} portfolios={Portfolio.objects.count()} "
                 f"journal={JournalEntry.objects.count()} news={NewsItem.objects.count()}")

from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Seed the database with sample data'

    def handle(self, *args, **options):
        from api.management.commands.seed_data import run
        run(self.stdout, self.stderr)
