import { Link } from "@tanstack/react-router";
import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Onboarding gate: the first mandatory action is creating a portfolio. */
export function PortfolioGate() {
  return (
    <div className="grid place-items-center py-10">
      <div className="card-surface max-w-lg p-8 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
          <Wallet className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-xl font-bold">اول یک پرتفولیو بساز</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          برای شروع کار با ژورنال، ساخت اولین پرتفولیو الزامی است. تا زمانی که پرتفولیو نسازی،
          بقیه بخش‌ها در دسترس نیستند.
        </p>
        <Link to="/app/portfolios" className="mt-6 inline-block">
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="ml-1 h-4 w-4" /> ساخت اولین پرتفولیو
          </Button>
        </Link>
      </div>
    </div>
  );
}
