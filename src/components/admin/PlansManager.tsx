import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchPlans, type Plan } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PlanRow = {
  id: string;
  name: string;
  price: string;
  users: number;
  portfolios: string;
  reportLines: number;
  sellable: boolean;
  features: string;
};

const REPORT_LINES: Record<string, number> = { free: 4, pro: 10, promax: 20, vip: 20 };

function planToRow(p: Plan): PlanRow {
  return {
    id: p.id,
    name: p.name,
    price: p.price === "—" ? "غیرقابل فروش" : `${p.price} تومان`,
    users: p.users,
    portfolios: p.portfolioLimit.includes("نامحدود") ? "نامحدود" : "۱",
    reportLines: REPORT_LINES[p.id] ?? 10,
    sellable: p.sellable,
    features: p.features.join("، "),
  };
}

export function PlansManager() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [editing, setEditing] = useState<PlanRow | null>(null);

  useEffect(() => {
    let alive = true;
    fetchPlans()
      .then((list) => alive && setPlans(list.map(planToRow)))
      .catch(() => alive && toast.error("دریافت پلن‌ها از سرور ممکن نشد"));
    return () => { alive = false; };
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setPlans((list) => list.map((p) => (p.id === editing.id ? editing : p)));
    toast.success(`پلن ${editing.name} به‌روزرسانی شد`);
    setEditing(null);
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => (
          <div key={p.id} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{p.name}</div>
              {!p.sellable && <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent">فقط مدیر</Badge>}
            </div>
            <div className="mt-2 text-2xl font-bold tabular">{p.price}</div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div>پرتفولیو: {p.portfolios}</div>
              <div className="tabular">خطوط گزارش AI: {p.reportLines}</div>
              <div>{p.features}</div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground tabular">{p.users} کاربر فعال</div>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => setEditing(p)}>
              ویرایش پلن
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          {editing && (
            <form onSubmit={save}>
              <DialogHeader>
                <DialogTitle>ویرایش پلن {editing.name}</DialogTitle>
                <DialogDescription>قیمت، سقف‌ها و امکانات پلن را تغییر بده.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>نام پلن</Label>
                    <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="bg-secondary/60" />
                  </div>
                  <div className="space-y-2">
                    <Label>قیمت</Label>
                    <Input value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} className="tabular bg-secondary/60" />
                  </div>
                  <div className="space-y-2">
                    <Label>سقف پرتفولیو</Label>
                    <Input value={editing.portfolios} onChange={(e) => setEditing({ ...editing, portfolios: e.target.value })} className="bg-secondary/60" />
                  </div>
                  <div className="space-y-2">
                    <Label>خطوط گزارش AI (۲ تا ۲۰)</Label>
                    <Input
                      type="number"
                      min={2}
                      max={20}
                      value={editing.reportLines}
                      onChange={(e) => setEditing({ ...editing, reportLines: Math.max(2, Math.min(20, Number(e.target.value) || 2)) })}
                      className="tabular bg-secondary/60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>امکانات</Label>
                  <Input value={editing.features} onChange={(e) => setEditing({ ...editing, features: e.target.value })} className="bg-secondary/60" />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-3">
                  <div className="text-sm">قابل فروش به کاربران</div>
                  <Switch checked={editing.sellable} onCheckedChange={(v) => setEditing({ ...editing, sellable: v })} />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button type="button" variant="outline">انصراف</Button>
                </DialogClose>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">ذخیره تغییرات</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
