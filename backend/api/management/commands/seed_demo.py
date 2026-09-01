"""Seed demo payment and AI call data for the admin dashboard."""

import random
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Payment, AiApiCall


PLAN_CHOICES = ["رایگان", "Pro", "Pro Max", "VIP"]
PLAN_PRICES = {"Pro": "299000", "Pro Max": "599000", "VIP": "999000"}
STATUS_CHOICES = ["موفق", "موفق", "موفق", "ناموفق"]  # 75% success

AI_MODELS = ["gemini-2.0-flash", "gemini-3.1-pro-preview"]
AI_ENDPOINTS = ["/api/coach/generate/", "/api/coach/insights/"]


class Command(BaseCommand):
    help = "Seed demo payment and AI call data"

    def add_arguments(self, parser):
        parser.add_argument("--payments", type=int, default=30, help="Number of payments")
        parser.add_argument("--ai-calls", type=int, default=200, help="Number of AI calls")

    def handle(self, *args, **options):
        users = list(User.objects.all())
        if not users:
            self.stdout.write(self.style.WARNING("No users found. Create users first."))
            return

        num_payments = options["payments"]
        num_ai = options["ai_calls"]

        # Clear old demo data
        Payment.objects.all().delete()
        AiApiCall.objects.all().delete()

        # Seed payments
        today = date.today()
        for _ in range(num_payments):
            user = random.choice(users)
            plan = random.choice(PLAN_CHOICES)
            amount = PLAN_PRICES.get(plan, "0")
            status = random.choice(STATUS_CHOICES)
            d = today - timedelta(days=random.randint(0, 180))
            Payment.objects.create(
                user=f"{user.first_name} {user.last_name}".strip() or user.username,
                plan=plan,
                amount=amount,
                date=d,
                status=status,
            )

        # Seed AI calls
        for _ in range(num_ai):
            user = random.choice(users)
            d = today - timedelta(days=random.randint(0, 90))
            AiApiCall.objects.create(
                user_email=user.email,
                endpoint=random.choice(AI_ENDPOINTS),
                model_name=random.choice(AI_MODELS),
                tokens_in=random.randint(200, 3000),
                tokens_out=random.randint(500, 5000),
                created_at=d,
            )

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {num_payments} payments and {num_ai} AI calls."
        ))
