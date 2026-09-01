from django.core.management.base import BaseCommand

from api.management.commands import seed_data

class Command(BaseCommand):
    help = "Seed the database with realistic fake data (Faker) + curated Persian content."

    def handle(self, *args, **options):
        seed_data.run(self.stdout, self.stderr)
        self.stdout.write(self.style.SUCCESS("Seeding complete"))
