"""Shared factories / base classes for the api test package."""

import uuid
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from api.models import (
    Achievement,
    JournalEntry,
    JournalGroup,
    Plan,
    Portfolio,
    RoleTier,
    Trade,
    UserProfile,
)

User = get_user_model()


class BaseTestCase(APITestCase):
    """Base test case with factories for users / portfolios / trades."""

    def make_user(self, username="user", email=None, **extra):
        email = email or f"{username}@example.com"
        extra.setdefault("first_name", username.title())
        return User.objects.create_user(
            username=username, email=email, password="pass12345", **extra
        )

    def make_staff(self, username="admin", email=None):
        return self.make_user(
            username=username,
            email=email or f"{username}@example.com",
            is_staff=True,
        )

    def make_profile(self, user, **extra):
        defaults = {"phone": "", "role": "trader", "plan": "رایگان"}
        defaults.update(extra)
        return UserProfile.objects.get_or_create(user=user, defaults=defaults)[0]

    def make_portfolio(self, user=None, name="اصلی", initial=1000, is_active=True, **extra):
        return Portfolio.objects.create(
            user=user,
            name=name,
            broker="IC Markets",
            type="استاندارد",
            initial=initial,
            balance=initial,
            leverage="1:100",
            currency="USD",
            trades=0,
            status="فعال",
            strategy="",
            is_active=is_active,
            **extra,
        )

    def make_trade(
        self,
        portfolio,
        symbol="XAUUSD",
        side="buy",
        entry=2000,
        exit=2005,
        sl=1990,
        tp=2010,
        volume=0.1,
        pnl=50,
        rr=2.0,
        pips=50.0,
        open_time=None,
        close_time=None,
        **extra,
    ):
        close_time = close_time or timezone.now()
        open_time = open_time or close_time - timedelta(hours=2)
        extra.setdefault("ticket", str(uuid.uuid4().int)[:12])
        extra.setdefault("reason", "Client")
        return Trade.objects.create(
            ticket=extra.pop("ticket"),
            symbol=symbol,
            side=side,
            entry=entry,
            exit=exit,
            sl=sl,
            tp=tp,
            volume=volume,
            pnl=pnl,
            rr=rr,
            pips=pips,
            commission=0,
            swap=0,
            taxes=0,
            open_time=open_time,
            close_time=close_time,
            portfolio=portfolio,
            **extra,
        )

    def make_achievement(self, title="اولین معامله ثبت‌شده", rule="count >= 1", **extra):
        return Achievement.objects.create(
            title=title,
            desc=title,
            rule=rule,
            **extra,
        )

    def make_plan(self, slug="free", name="رایگان", **extra):
        defaults = {
            "price": "0",
            "unit": "ماهانه",
            "tagline": "شروع رایگان",
            "portfolio_limit": "1",
            "cta": "شروع",
            "highlight": False,
            "sellable": True,
            "users": 0,
            "max_portfolios": 1,
            "max_trades_per_month": -1,
            "plan_features": [],
            "features": [],
        }
        defaults.update(extra)
        return Plan.objects.create(slug=slug, name=name, **defaults)

    def make_role_tier(self, level=1, min_pct=0, max_pct=19, name="تریدر"):
        return RoleTier.objects.create(
            level=level, min_pct=min_pct, max_pct=max_pct, name=name
        )

    def make_journal_group(self, user=None, name="گروه من", color="primary"):
        return JournalGroup.objects.create(user=user, name=name, color=color)

    def make_journal_entry(self, user=None, group=None, title="یادداشت", **extra):
        defaults = {
            "date": timezone.localdate(),
            "week": "هفته جاری",
            "month": "ماه جاری",
            "symbol": "",
            "mistakes": "",
            "lesson": "",
            "emotion": "",
            "plan": True,
            "favorite": False,
            "html": "",
            "blocks": [],
            "images": [],
            "trade_id": "",
        }
        defaults.update(extra)
        return JournalEntry.objects.create(user=user, group=group, title=title, **defaults)

    # -- helpers ---------------------------------------------------------

    def get_list(self, path, **query):
        """GET a list endpoint and unwrap the DRF pagination wrapper.

        Mirrors the frontend client: `{count, next, previous, results}` →
        the raw `results` array.
        """
        r = self.client.get(path, query)
        if isinstance(r.data, dict) and "results" in r.data:
            return r.data["results"]
        return r.data

    def auth(self, user):
        """Authenticate the API client as `user`."""
        self.client.force_authenticate(user)
        return user

    def auth_staff(self):
        return self.auth(self.make_staff())

    def trade_payload(self, portfolio, **extra):
        payload = {
            "ticket": "123456",
            "symbol": "XAUUSD",
            "side": "buy",
            "entry": 2000.0,
            "exit": 2005.0,
            "sl": 1990.0,
            "tp": 2010.0,
            "volume": 0.1,
            "pnl": 50.0,
            "rr": 2.0,
            "pips": 50.0,
            "open_time": "2026-08-19T10:00:00",
            "close_time": "2026-08-19T12:00:00",
            "portfolio_id": portfolio.pk,
        }
        payload.update(extra)
        return payload

    def portfolio_payload(self, **extra):
        payload = {
            "name": "اصلی",
            "broker": "IC Markets",
            "type": "استاندارد",
            "initial": 1000,
            "leverage": "1:100",
            "currency": "USD",
            "trades": 0,
            "status": "فعال",
            "strategy": "",
        }
        payload.update(extra)
        return payload