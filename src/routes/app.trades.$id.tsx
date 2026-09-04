import { useSetTitle } from "@/lib/page-context";
import { AppShell } from "@/components/AppShell";
import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, XCircle, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ImageUploader } from "@/components/ImageUploader";
import { useLocalState } from "@/lib/app-state";
import { updateTradeScreenshots, useTrades } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/trades/$id")({
  head: () => ({
    meta: [
      { title: "جزئیات معامله | Dlea AI" },
      { name: "description", content: "مشاهده کامل جزئیات معامله فارکس همراه با اسکرین‌شات‌های چارت، سود/زیان، پیپ و R:R." },
      { property: "og:title", content: "جزئیات معامله" },
      { property: "og:description", content: "جزئیات کامل معامله و مدیریت اسکرین‌شات‌های چارت." },
    ],
  }),
  component: TradeDetail,
});

function Row({ label, value, tone }: { label: string; value: string; tone?: "gain" | "loss" }) {
  useSetTitle("معامله پیدا نشد", "شناسه معامله معتبر نیست");
  return (
    <div className="flex items-center justify-between border-b border-border/50 py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium tabular ${tone ?? ""}`}>{value}</span>
    </div>
  );
}

function TradeDetail() {
  const { id } = useParams({ from: "/app/trades/$id" });
  const trades = useTrades();
  const trade = trades.find((t) => t.id === id);

  const [shots, setShots] = useLocalState<string[]>(`tj:trade-shots:${id}`, trade?.screenshots ?? []);

  function saveShots(next: string[]) {
    setShots(next);
    if (!trade) return;
    updateTradeScreenshots(trade.id, next)
      .then(() => toast.success("اسکرین‌شات‌ها در سرور ذخیره شد"))
      .catch((err) =>
        toast.error(`ذخیره اسکرین‌شات ناموفق بود: ${err instanceof Error ? err.message : err}`),
      );
  }

  if (!trade) {
    return (
      <div className="card-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">این معامله در سیستم موجود نیست.</p>
          <Link to="/app/trades" className="mt-4 inline-block">
            <Button variant="outline">بازگشت به معاملات</Button>
          </Link>
        </div>
);
  }

  return (
    <AppShell
      title={`معامله ${trade.symbol}`}
      subtitle={`شناسه ${trade.id} • تیکت ${trade.ticket}`}
      actions={
        <Link to="/app/trades">
          <Button variant="outline">
            بازگشت <ArrowRight className="mr-1 h-4 w-4" />
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card-surface p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold">{trade.symbol}</h2>
            <Badge
              variant="outline"
              className={trade.side === "buy" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}
            >
              {trade.side === "buy" ? "خرید" : "فروش"}
            </Badge>
            {trade.strategy && <Badge variant="outline">{trade.strategy}</Badge>}
            <Badge
              variant="outline"
              className={trade.followedPlan ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}
            >
              {trade.followedPlan ? <CheckCircle2 className="ml-1 h-3 w-3" /> : <XCircle className="ml-1 h-3 w-3" />}
              {trade.followedPlan ? "طبق پلن" : "خارج از پلن"}
            </Badge>
          </div>

          <div dir="ltr" className={`mt-4 text-3xl font-bold tabular ${trade.pnl >= 0 ? "gain" : "loss"}`}>
            {trade.pnl >= 0 ? "+" : ""}${trade.pnl}
          </div>

          <div className="mt-6 grid gap-x-8 sm:grid-cols-2">
            <Row label="قیمت ورود" value={String(trade.entry)} />
            <Row label="قیمت خروج" value={String(trade.exit)} />
            <Row label="Stop Loss" value={String(trade.sl)} />
            <Row label="Take Profit" value={String(trade.tp)} />
            <Row label="حجم (Lot)" value={String(trade.volume)} />
            <Row label="R:R" value={String(trade.rr)} />
            <Row label="پیپ" value={String(trade.pips)} tone={trade.pips >= 0 ? "gain" : "loss"} />
            <Row label="کمیسیون" value={`$${trade.commission}`} />
            <Row label="سواپ" value={`$${trade.swap}`} />
            <Row label="مالیات" value={`$${trade.taxes}`} />
            <Row label="زمان باز شدن" value={trade.openTime} />
            <Row label="زمان بسته شدن" value={trade.closeTime} />
            <Row label="مدت" value={trade.duration} />
            <Row label="Magic" value={String(trade.magic)} />
            <Row label="پرتفولیو" value={trade.portfolio} />
            <Row label="احساس" value={trade.emotion} />
          </div>

          {trade.comment && (
            <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-sm">
              <div className="text-xs text-muted-foreground">کامنت متاتریدر</div>
              <div className="mt-1">{trade.comment}</div>
            </div>
          )}
        </div>

        <div className="card-surface space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Images className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">اسکرین‌شات‌های چارت</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            هر تعداد تصویر می‌توانی اضافه یا حذف کنی؛ تصاویر به‌صورت خودکار فشرده می‌شوند.
          </p>
          <ImageUploader
            images={shots}
            onChange={saveShots}
            label="تصاویر معامله"
            hint="چارت قبل/بعد از ورود یا Report History"
          />
        </div>
      </div>
    </AppShell>
  );
}
