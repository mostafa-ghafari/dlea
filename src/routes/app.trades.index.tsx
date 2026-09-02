import { AppShell } from "@/components/AppShell";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus, Filter, Download, CheckCircle2, XCircle, Images, ChevronRight, ChevronLeft, Columns3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTrades, usePlanLimits, useTradeColumns } from "@/lib/api";
import { useLocalState } from "@/lib/app-state";
import { toast } from "sonner";

export const Route = createFileRoute("/app/trades/")({
  head: () => ({ meta: [{ title: "معاملات" }] }),
  component: TradesPage,
});

function TradesPage() {
  const navigate = useNavigate();
  const trades = useTrades();
  const limits = usePlanLimits();
  const [query, setQuery] = useState("");
  const [side, setSide] = useState<"all" | "buy" | "sell">("all");
  const [plan, setPlan] = useState<"all" | "yes" | "no">("all");
  const [result, setResult] = useState<"all" | "win" | "loss">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const ALL_COLUMNS = useTradeColumns();
  const [visibleColumns, setVisibleColumns] = useState<string[]>(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key));
  function toggleColumn(key: string) {
    setVisibleColumns((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  }
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const filtered = useMemo(() => trades.filter((t) => {
    const q = query.trim().toLowerCase();
    if (q && ![t.symbol, t.id, t.ticket, t.strategy, t.date].some((v) => String(v).toLowerCase().includes(q))) return false;
    if (side !== "all" && t.side !== side) return false;
    if (plan === "yes" && !t.followedPlan) return false;
    if (plan === "no" && t.followedPlan) return false;
    if (result === "win" && t.pnl < 0) return false;
    if (result === "loss" && t.pnl >= 0) return false;
    return true;
  }), [query, side, plan, result, trades]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [query, side, plan, result]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <AppShell title="معاملات" subtitle="لیست تمام معاملات ثبت‌شده" actions={
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => toast.success("خروجی CSV به‌زودی آماده می‌شود")}>
          <Download className="ml-1 h-4 w-4" />خروجی
        </Button>
        <Link to="/app/trades/new" onClick={(e) => {
            if (limits.maxTradesPerMonth > 0) {
              const now = new Date();
              const thisMonth = trades.filter((t) => {
                const d = new Date(t.date);
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              });
              if (thisMonth.length >= limits.maxTradesPerMonth) {
                e.preventDefault();
                toast.error(`سقف ${limits.maxTradesPerMonth} معامله ماهانه (${limits.slug.toUpperCase()}) پر شده. پلن خود را ارتقا دهید.`);
              }
            }
          }}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="ml-1 h-4 w-4" />معامله جدید
            </Button>
          </Link>
      </div>
    }>
      <div className="card-surface p-5">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="جستجوی نماد، شناسه، استراتژی..." className="max-w-xs bg-secondary/60" />
          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm"><Filter className="ml-1 h-4 w-4" />فیلترها</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>فیلتر معاملات</DialogTitle>
                <DialogDescription>معاملات را بر اساس معیارهای زیر فیلتر کن.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>نوع معامله</Label>
                  <Select value={side} onValueChange={(v) => setSide(v as any)}>
                    <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="buy">فقط خرید</SelectItem>
                      <SelectItem value="sell">فقط فروش</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>پایبندی به پلن</Label>
                  <Select value={plan} onValueChange={(v) => setPlan(v as any)}>
                    <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="yes">طبق پلن</SelectItem>
                      <SelectItem value="no">خارج از پلن</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>نتیجه</Label>
                  <Select value={result} onValueChange={(v) => setResult(v as any)}>
                    <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="win">فقط برنده</SelectItem>
                      <SelectItem value="loss">فقط بازنده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => { setSide("all"); setPlan("all"); setResult("all"); toast.success("فیلترها پاک شد"); }}>پاک کردن</Button>
                <DialogClose asChild><Button className="bg-primary text-primary-foreground hover:bg-primary/90">اعمال</Button></DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

                        {/* Desktop table with column toggle */}
        <div className="mt-5 hidden md:block">
          <div className="mb-3 flex items-center gap-2">
            <Columns3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">ستون‌ها:</span>
            {ALL_COLUMNS.map((col) => (
              <button
                key={col.key}
                onClick={() => toggleColumn(col.key)}
                className={`rounded-md border px-2 py-1 text-xs transition-colors ${
                  visibleColumns.includes(col.key)
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-secondary/40 text-muted-foreground"
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  {visibleColumns.includes("id") && <th className="py-3 text-right font-medium">شناسه</th>}
                  {visibleColumns.includes("symbol") && <th className="py-3 text-right font-medium">نماد</th>}
                  {visibleColumns.includes("side") && <th className="py-3 text-right font-medium">نوع</th>}
                  {visibleColumns.includes("entry") && <th className="py-3 text-right font-medium">ورود</th>}
                  {visibleColumns.includes("exit") && <th className="py-3 text-right font-medium">خروج</th>}
                  {visibleColumns.includes("sl") && <th className="py-3 text-right font-medium">SL</th>}
                  {visibleColumns.includes("tp") && <th className="py-3 text-right font-medium">TP</th>}
                  {visibleColumns.includes("volume") && <th className="py-3 text-right font-medium">حجم</th>}
                  {visibleColumns.includes("rr") && <th className="py-3 text-right font-medium">R:R</th>}
                  {visibleColumns.includes("pnl") && <th className="py-3 text-right font-medium">سود/زیان</th>}
                  {visibleColumns.includes("followedPlan") && <th className="py-3 text-right font-medium">پلن</th>}
                  {visibleColumns.includes("date") && <th className="py-3 text-right font-medium">تاریخ</th>}
                  {visibleColumns.includes("screenshots") && <th className="py-3 text-right font-medium">اسکرین‌شات</th>}
                  <th className="py-3 text-right font-medium">جزئیات</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate({ to: "/app/trades/$id", params: { id: t.id } })}
                    className="cursor-pointer border-b border-border/50 hover:bg-secondary/30 last:border-0"
                  >
                    {visibleColumns.includes("id") && <td className="py-3 text-xs tabular text-muted-foreground">{t.id}</td>}
                    {visibleColumns.includes("symbol") && <td className="py-3 font-medium">{t.symbol}</td>}
                    {visibleColumns.includes("side") && (
                      <td className="py-3">
                        <Badge variant="outline" className={t.side === "buy" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}>
                          {t.side === "buy" ? "خرید" : "فروش"}
                        </Badge>
                      </td>
                    )}
                    {visibleColumns.includes("entry") && <td className="py-3 tabular">{t.entry}</td>}
                    {visibleColumns.includes("exit") && <td className="py-3 tabular">{t.exit}</td>}
                    {visibleColumns.includes("sl") && <td className="py-3 tabular text-destructive">{t.sl || "—"}</td>}
                    {visibleColumns.includes("tp") && <td className="py-3 tabular text-primary">{t.tp || "—"}</td>}
                    {visibleColumns.includes("volume") && <td className="py-3 tabular">{t.volume}</td>}
                    {visibleColumns.includes("rr") && <td className="py-3 tabular">{t.rr}</td>}
                    {visibleColumns.includes("pnl") && (
                      <td className={`py-3 tabular font-medium ${t.pnl >= 0 ? "gain" : "loss"}`}>
                        {t.pnl >= 0 ? "+" : ""}${t.pnl}
                      </td>
                    )}
                    {visibleColumns.includes("followedPlan") && (
                      <td className="py-3">
                        {t.followedPlan ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )}
                      </td>
                    )}
                    {visibleColumns.includes("date") && <td className="py-3 text-xs text-muted-foreground tabular">{t.date}</td>}
                    {visibleColumns.includes("screenshots") && <td className="py-3"><ShotsCell id={t.id} initial={t.screenshots} /></td>}
                    <td className="py-3">
                      <Link
                        to="/app/trades/$id"
                        params={{ id: t.id }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-primary hover:underline"
                      >
                        مشاهده
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {paginated.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">معامله‌ای یافت نشد.</div>
          )}
        </div>

        {/* Mobile card layout */}
        <div className="mt-4 space-y-3 md:hidden">
          {paginated.map((t) => (
            <Link
              key={t.id}
              to="/app/trades/$id"
              params={{ id: t.id }}
              className="block rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{t.symbol}</span>
                  <Badge variant="outline" className={`text-xs ${t.side === "buy" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}`}>
                    {t.side === "buy" ? "خرید" : "فروش"}
                  </Badge>
                </div>
                <span className={`text-lg font-bold tabular ${t.pnl >= 0 ? "gain" : "loss"}`}>
                  {t.pnl >= 0 ? "+" : ""}${t.pnl}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="tabular">{t.date}</span>
                <span className="tabular">R:R {t.rr}</span>
                <span className="tabular">ورود: {t.entry}</span>
                <span className="tabular">خروج: {t.exit}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {t.sl ? <span className="text-destructive tabular">SL: {t.sl}</span> : null}
                {t.tp ? <span className="text-primary tabular">TP: {t.tp}</span> : null}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>حجم: {t.volume}</span>
                  {t.followedPlan ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-destructive" />
                  )}
                </div>
                <ShotsCell id={t.id} initial={t.screenshots} />
              </div>
            </Link>
          ))}
          {paginated.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">معامله‌ای یافت نشد.</div>
          )}
        </div>


        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              نمایش {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} از {filtered.length} معامله
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 7) {
                  pageNum = i + 1;
                } else if (safePage <= 4) {
                  pageNum = i + 1;
                } else if (safePage >= totalPages - 3) {
                  pageNum = totalPages - 6 + i;
                } else {
                  pageNum = safePage - 3 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === safePage ? "default" : "outline"}
                    size="sm"
                    className={pageNum === safePage ? "bg-primary text-primary-foreground" : ""}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="sm"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
);
}

/** Screenshot count for a trade (stored per-trade in localStorage). */
function ShotsCell({ id, initial }: { id: string; initial: string[] }) {
  const [shots] = useLocalState<string[]>(`tj:trade-shots:${id}`, initial);
  return (
    <span className={`inline-flex items-center gap-1 text-xs tabular ${shots.length ? "text-primary" : "text-muted-foreground"}`}>
      <Images className="h-3.5 w-3.5" />
      {shots.length ? shots.length : "افزودن"}
    </span>
  );
}
