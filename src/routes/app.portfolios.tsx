import { AppShell } from "@/components/AppShell";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, MoreVertical, Wallet, Archive, ArchiveRestore, Edit, Link2, Trash2, Copy, BarChart3, Zap } from "lucide-react";
import { useEffect, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createPortfolio, deletePortfolio, fetchPortfolios, updatePortfolio, activatePortfolio, type Portfolio, usePlanLimits } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useHasPortfolio, useActivePortfolioId } from "@/lib/app-state";

export const Route = createFileRoute("/app/portfolios")({
  head: () => ({ meta: [{ title: "پرتفولیوها" }] }),
  component: Portfolios,
});

function Portfolios() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [activeId, setActiveId] = useActivePortfolioId();
  const [, setHasPortfolio] = useHasPortfolio();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const limits = usePlanLimits();
  const atPortfolioLimit = limits.maxPortfolios > 0 && portfolios.length >= limits.maxPortfolios;
  const [name, setName] = useState("");
  const [broker, setBroker] = useState("");
  const [balance, setBalance] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [leverage, setLeverage] = useState("1:100");
  const [strategy, setStrategy] = useState("");

  const [editing, setEditing] = useState<Portfolio | null>(null);
  const [editForm, setEditForm] = useState({ name: "", broker: "", strategy: "", balance: "", leverage: "1:100", currency: "USD" });

  function openEdit(p: Portfolio) {
    setEditing(p);
    setEditForm({
      name: p.name,
      broker: p.broker,
      strategy: p.strategy,
      balance: String(p.balance),
      leverage: p.leverage,
      currency: p.currency,
    });
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (!editForm.name.trim()) { toast.error("نام پرتفولیو الزامی است"); return; }
    try {
      const updated = await updatePortfolio(editing.id, {
        name: editForm.name.trim(),
        broker: editForm.broker.trim() || editing.broker,
        strategy: editForm.strategy.trim() || "",
        balance: Number(editForm.balance) || editing.balance,
        leverage: editForm.leverage,
        currency: editForm.currency,
      });
      setPortfolios((list) => list.map((p) => (p.id === editing.id ? updated : p)));
      toast.success("پرتفولیو به‌روزرسانی شد");
    } catch (err) {
      toast.error(`به‌روزرسانی پرتفولیو ناموفق بود: ${err instanceof Error ? err.message : err}`);
      return;
    }
    setEditing(null);
  }

  async function toggleArchive(p: Portfolio) {
    const next = p.status === "آرشیو" ? "فعال" : "آرشیو";
    try {
      const updated = await updatePortfolio(p.id, { status: next });
      setPortfolios((list) => list.map((x) => (x.id === p.id ? updated : x)));
      toast.success(next === "آرشیو" ? `${p.name} آرشیو شد` : `${p.name} از آرشیو خارج شد`);
    } catch (err) {
      toast.error(`تغییر وضعیت پرتفولیو ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function remove(p: Portfolio) {
    try {
      await deletePortfolio(p.id);
      setPortfolios((list) => list.filter((x) => x.id !== p.id));
      toast.success(`پرتفولیو «${p.name}» حذف شد`);
    } catch (err) {
      toast.error(`حذف پرتفولیو ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function activate(p: Portfolio) {
    try {
      await activatePortfolio(p.id);
      setActiveId(p.id);
      setPortfolios((list) => list.map((x) => ({ ...x, is_active: x.id === p.id })));
      toast.success(`${p.name} فعال شد — تمام بخش‌ها با این پرتفولیو آپدیت شد`);
    } catch (err) {
      toast.error(`فعال‌سازی پرتفولیو ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function duplicate(p: Portfolio) {
    try {
      const created = await createPortfolio({
        name: `${p.name} (کپی)`,
        broker: p.broker,
        type: p.type,
        balance: p.balance,
        initial: p.initial,
        leverage: p.leverage,
        currency: p.currency,
        trades: 0,
        status: p.status,
        strategy: p.strategy,
      });
      setPortfolios((list) => [...list, created]);
      toast.success("کپی پرتفولیو ساخته شد");
    } catch (err) {
      toast.error(`ساخت کپی ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  useEffect(() => {
    let alive = true;
    fetchPortfolios()
      .then((list) => {
        if (!alive) return;
        setPortfolios(list);
        setLoaded(true);
      })
      .catch(() => alive && toast.error("دریافت پرتفولیوها از سرور ممکن نشد"));
    return () => {
      alive = false;
    };
  }, []);

  // Auto-open create dialog when user has no portfolios (first visit)
  useEffect(() => {
    if (loaded && portfolios.length === 0) {
      setOpen(true);
    }
  }, [loaded, portfolios.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !broker.trim()) { toast.error("نام و بروکر الزامی است"); return; }
    const initial = Number(balance) || 0;
    try {
      const created = await createPortfolio({
        name: name.trim(),
        broker: broker.trim(),
        type: "استاندارد",
        balance: initial,
        initial,
        leverage,
        currency,
        trades: 0,
        status: "فعال",
        strategy: strategy.trim() || "",
      });
      setPortfolios((p) => [...p, created]);
      setHasPortfolio(true);
      toast.success(`پرتفولیو «${created.name}» ساخته شد`);
    } catch (err) {
      toast.error(`ساخت پرتفولیو ناموفق بود: ${err instanceof Error ? err.message : err}`);
      return;
    }
    setStrategy(""); setName(""); setBroker(""); setBalance(""); setCurrency("USD"); setLeverage("1:100");
    setOpen(false);
  }

  return (
    <AppShell title="پرتفولیوها" subtitle="مدیریت حساب‌های معاملاتی" actions={
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setOpen(true)} disabled={atPortfolioLimit}>
        <Plus className="ml-1 h-4 w-4" />{atPortfolioLimit ? "سقف پرتفولیو پر شد" : "پرتفولیو جدید"}
      </Button>
    }>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
            <form onSubmit={submit}>
              <DialogHeader>
                <DialogTitle>پرتفولیو جدید</DialogTitle>
                <DialogDescription>یک حساب معاملاتی جدید اضافه کن. بعداً می‌توانی به MT4/MT5 متصل کنی.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>نام پرتفولیو</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="پرتفوی اصلی" className="bg-secondary/60" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>نام استراتژی</Label>
                  <Input value={strategy} onChange={(e) => setStrategy(e.target.value)} placeholder="Order Block لندن" className="bg-secondary/60" />
                </div>
                <div className="space-y-2">
                  <Label>بروکر</Label>
                  <Input value={broker} onChange={(e) => setBroker(e.target.value)} placeholder="IC Markets" className="bg-secondary/60" />
                </div>
                <div className="space-y-2">
                  <Label>موجودی اولیه</Label>
                  <Input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} className="bg-secondary/60 tabular" />
                </div>
                <div className="space-y-2">
                  <Label>ارز</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["USD", "USDT", "EUR", "IRR"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>لوریج</Label>
                  <Select value={leverage} onValueChange={setLeverage}>
                    <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["1:1", "1:30", "1:100", "1:200", "1:500"].map((l) => (
                        <SelectItem key={l} value={l}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose asChild><Button type="button" variant="outline">انصراف</Button></DialogClose>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">ایجاد پرتفولیو</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      {/* Plan limit indicator */}
      {limits.maxPortfolios > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-2.5 text-sm">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {portfolios.length} از {limits.maxPortfolios} پرتفولیو استفاده شده
          </span>
          <div className="mx-2 h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full transition-all", portfolios.length >= limits.maxPortfolios ? "bg-destructive" : "bg-primary")}
              style={{ width: `${Math.min(100, (portfolios.length / limits.maxPortfolios) * 100)}%` }}
            />
          </div>
          {atPortfolioLimit && (
            <Link to="/app/billing" className="text-xs font-medium text-primary hover:underline">
              ارتقا پلن →
            </Link>
          )}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {portfolios.map((p) => {
          const pnl = p.balance - p.initial;
          const pct = p.initial ? (pnl / p.initial) * 100 : 0;
          return (
            <div key={p.id} className={`card-surface p-5 transition-all hover:border-primary/40 ${activeId === p.id ? "!border-primary bg-primary/5" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.broker}</div>
                  </div>
                </div>
                <DropdownMenu dir="rtl">
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="گزینه‌های پرتفولیو">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-52">
                    <DropdownMenuLabel>{p.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => openEdit(p)}>
                      <Edit className="ml-2 h-4 w-4" />ویرایش پرتفولیو
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => toast.success(`اتصال ${p.name} به متاتریدر شروع شد`)}>
                      <Link2 className="ml-2 h-4 w-4" />اتصال به متاتریدر
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => toast.info(`گزارش عملکرد ${p.name} در حال آماده‌سازی است`)}>
                      <BarChart3 className="ml-2 h-4 w-4" />گزارش عملکرد
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => duplicate(p)}>
                      <Copy className="ml-2 h-4 w-4" />ساخت کپی
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => toggleArchive(p)}>
                      {p.status === "آرشیو" ? <ArchiveRestore className="ml-2 h-4 w-4" /> : <Archive className="ml-2 h-4 w-4" />}
                      {p.status === "آرشیو" ? "خروج از آرشیو" : "آرشیو کردن"}
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => remove(p)}>
                      <Trash2 className="ml-2 h-4 w-4" />حذف پرتفولیو
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-secondary/40 p-3">
                  <div className="text-[11px] text-muted-foreground">موجودی فعلی</div>
                  <div className="mt-1 text-lg font-bold tabular">
                    ${p.balance.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-lg bg-secondary/40 p-3">
                  <div className="text-[11px] text-muted-foreground">سود / زیان</div>
                  <div className={`mt-1 text-lg font-bold tabular ${pnl >= 0 ? "gain" : "loss"}`}>
                    {pnl >= 0 ? "+" : ""}${pnl.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                <div><span className="text-muted-foreground">لوریج:</span> <span className="tabular">{p.leverage}</span></div>
                <div><span className="text-muted-foreground">ارز:</span> {p.currency}</div>
                <div><span className="text-muted-foreground">معاملات:</span> <span className="tabular">{p.trades}</span></div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <Badge variant="outline" className={p.status === "فعال" ? "border-primary/40 bg-primary/10 text-primary" : ""}>
                  {p.status}
                </Badge>
                <div className={`text-sm font-medium tabular ${pct >= 0 ? "gain" : "loss"}`}>
                  {pct >= 0 ? "+" : ""}{pct.toFixed(2)}٪
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                {activeId === p.id ? (
                  <Button size="sm" className="flex-1 bg-primary text-primary-foreground" disabled>
                    ✓ فعال
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => activate(p)}>
                    <Zap className="ml-1 h-3 w-3" />فعال‌سازی
                  </Button>
                )}
                <Button size="sm" variant="outline" aria-label="ویرایش" onClick={() => openEdit(p)}><Edit className="h-3 w-3" /></Button>
                <Button size="sm" variant="outline" aria-label="آرشیو" onClick={() => toggleArchive(p)}><Archive className="h-3 w-3" /></Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <form onSubmit={saveEdit}>
            <DialogHeader>
              <DialogTitle>ویرایش پرتفولیو</DialogTitle>
              <DialogDescription>اطلاعات حساب معاملاتی را به‌روزرسانی کن.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>نام پرتفولیو</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-secondary/60" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>نام استراتژی</Label>
                <Input value={editForm.strategy} onChange={(e) => setEditForm({ ...editForm, strategy: e.target.value })} className="bg-secondary/60" />
              </div>
              <div className="space-y-2">
                <Label>بروکر</Label>
                <Input value={editForm.broker} onChange={(e) => setEditForm({ ...editForm, broker: e.target.value })} className="bg-secondary/60" />
              </div>
              <div className="space-y-2">
                <Label>موجودی فعلی</Label>
                <Input type="number" value={editForm.balance} onChange={(e) => setEditForm({ ...editForm, balance: e.target.value })} className="bg-secondary/60 tabular" />
              </div>
              <div className="space-y-2">
                <Label>ارز</Label>
                <Select value={editForm.currency} onValueChange={(v) => setEditForm({ ...editForm, currency: v })}>
                  <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["USD", "USDT", "EUR", "IRR"].map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>لوریج</Label>
                <Select value={editForm.leverage} onValueChange={(v) => setEditForm({ ...editForm, leverage: v })}>
                  <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["1:1", "1:30", "1:100", "1:200", "1:500"].map((l) => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>انصراف</Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">ذخیره تغییرات</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
);
}
