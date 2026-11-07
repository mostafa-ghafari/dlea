import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgePercent, Megaphone, Plus, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  announceCoupon,
  createCoupon,
  deleteCoupon,
  fetchAdminCoupons,
  fetchPlans,
  invalidateCache,
  updateCoupon,
  type AdminCoupon,
  type Plan,
} from "@/lib/api";

/** A code minted without a plan covers every sellable plan. */
const EVERY_PLAN = "all";

type Form = {
  code: string;
  planSlug: string;
  percent: string;
  amount: string;
  maxUses: string;
  expiresOn: string;
  active: boolean;
};

const EMPTY: Form = {
  code: "",
  planSlug: EVERY_PLAN,
  percent: "20",
  amount: "",
  maxUses: "0",
  expiresOn: "",
  active: true,
};

function discountText(c: AdminCoupon) {
  return c.percent
    ? `${c.percent}٪ تخفیف`
    : `${c.amount.toLocaleString("fa-IR")} تومان تخفیف`;
}

function usageText(c: AdminCoupon) {
  return c.maxUses
    ? `${c.usedCount.toLocaleString("fa-IR")} از ${c.maxUses.toLocaleString("fa-IR")}`
    : `${c.usedCount.toLocaleString("fa-IR")} استفاده`;
}

/**
 * Discount codes (DEV-157): mint a code for one plan, then announce it.
 *
 * The amount a buyer pays is never decided here — the billing endpoint
 * re-reads the code's own row — so this panel can hand out a discount but
 * cannot change what an order costs after the fact.
 */
export function CouponsManager() {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(
    () =>
      Promise.all([fetchAdminCoupons(), fetchPlans()])
        .then(([codes, catalogue]) => {
          setCoupons(codes);
          // The free plan is not for sale, so a code for it would be dead weight.
          setPlans(catalogue.filter((p) => p.sellable && p.id !== "free"));
        })
        .catch(() => toast.error("دریافت کدهای تخفیف ممکن نشد")),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  function startNew() {
    setForm(EMPTY);
    setOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const code = form.code.trim();
    if (!code) {
      toast.error("کد تخفیف را وارد کن");
      return;
    }
    const percent = Number(form.percent) || 0;
    const amount = Number(form.amount) || 0;
    if (!percent && !amount) {
      toast.error("یکی از درصد یا مبلغ تخفیف را وارد کن");
      return;
    }
    setSaving(true);
    try {
      const saved = await createCoupon({
        code,
        planSlug: form.planSlug === EVERY_PLAN ? null : form.planSlug,
        percent,
        amount,
        active: form.active,
        maxUses: Number(form.maxUses) || 0,
        expiresOn: form.expiresOn || null,
      });
      setCoupons((list) => [saved, ...list]);
      setOpen(false);
      toast.success(`کد ${saved.code} ساخته شد`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "ساخت کد تخفیف ممکن نشد",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggle(c: AdminCoupon) {
    setBusy(c.id);
    try {
      const saved = await updateCoupon(c.id, { active: !c.active });
      setCoupons((list) => list.map((row) => (row.id === c.id ? saved : row)));
    } catch {
      toast.error("تغییر وضعیت کد ممکن نشد");
    } finally {
      setBusy(null);
    }
  }

  async function announce(c: AdminCoupon, channel: "news" | "private") {
    setBusy(c.id);
    try {
      const result = await announceCoupon(c.id, channel);
      toast.success(
        channel === "news"
          ? `${c.code}: در اخبار منتشر شد و برای ${result.sent.toLocaleString("fa-IR")} کاربر اعلان رفت`
          : `${c.code}: اعلان برای ${result.sent.toLocaleString("fa-IR")} کاربر همان پلن رفت`,
      );
      if (channel === "news") {
        // The news page and the bell both read this from cache.
        invalidateCache("news");
        invalidateCache("notifications");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "اعلام کد تخفیف ممکن نشد",
      );
    } finally {
      setBusy(null);
    }
  }

  async function remove(c: AdminCoupon) {
    if (!window.confirm(`کد ${c.code} حذف شود؟`)) return;
    setBusy(c.id);
    try {
      await deleteCoupon(c.id);
      setCoupons((list) => list.filter((row) => row.id !== c.id));
      toast.success(`کد ${c.code} حذف شد`);
    } catch {
      toast.error("حذف کد ممکن نشد");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">کدهای تخفیف</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            کد را برای یک پلن بساز، بعد یا در اخبار منتشر کن یا فقط برای کاربران
            همان پلن اعلان بفرست. مبلغ نهایی همیشه سرور محاسبه می‌کند.
          </p>
        </div>
        <Button
          onClick={startNew}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="ml-1 h-4 w-4" />
          کد جدید
        </Button>
      </div>

      {coupons.length === 0 ? (
        <div className="card-surface p-8 text-center text-sm text-muted-foreground">
          هنوز کد تخفیفی ساخته نشده است.
        </div>
      ) : (
        <div className="card-surface overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-border/60 text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-right">کد</th>
                <th className="p-3 text-right">پلن</th>
                <th className="p-3 text-right">تخفیف</th>
                <th className="p-3 text-right">استفاده</th>
                <th className="p-3 text-right">مهلت</th>
                <th className="p-3 text-right">وضعیت</th>
                <th className="p-3 text-right">اعلام</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="p-3 font-semibold tabular">{c.code}</td>
                  <td className="p-3">
                    {c.planName ? (
                      <Badge
                        variant="outline"
                        className="border-primary/40 bg-primary/10 text-primary"
                      >
                        {c.planName}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">همهٔ پلن‌ها</span>
                    )}
                  </td>
                  <td className="p-3 tabular">{discountText(c)}</td>
                  <td className="p-3 tabular text-muted-foreground">
                    {usageText(c)}
                  </td>
                  <td className="p-3 tabular text-muted-foreground">
                    {c.expiresAt || "بدون مهلت"}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={c.active}
                        disabled={busy === c.id}
                        onCheckedChange={() => toggle(c)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {c.active ? "فعال" : "غیرفعال"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === c.id}
                        onClick={() => announce(c, "news")}
                        title="انتشار در اخبار برای همهٔ کاربران"
                      >
                        <Megaphone className="ml-1 h-3.5 w-3.5" />
                        اخبار
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busy === c.id}
                        onClick={() => announce(c, "private")}
                        title="اعلان خصوصی برای کاربران همان پلن"
                      >
                        <Send className="ml-1 h-3.5 w-3.5" />
                        خصوصی
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy === c.id}
                        onClick={() => remove(c)}
                        title="حذف کد"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BadgePercent className="h-5 w-5 text-primary" />
              کد تخفیف جدید
            </DialogTitle>
            <DialogDescription>
              پلن را انتخاب کن؛ همین پلن هم مقصد اعلان خصوصی است.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label>کد (حروف بزرگ ذخیره می‌شود)</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="PROMAX30"
                className="bg-secondary/60 tabular"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>پلن</Label>
              <Select
                value={form.planSlug}
                onValueChange={(v) => setForm({ ...form, planSlug: v })}
              >
                <SelectTrigger className="bg-secondary/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EVERY_PLAN}>همهٔ پلن‌ها</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>درصد تخفیف</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={form.percent}
                  onChange={(e) =>
                    setForm({ ...form, percent: e.target.value })
                  }
                  className="tabular bg-secondary/60"
                />
              </div>
              <div className="space-y-2">
                <Label>یا مبلغ ثابت (تومان)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="tabular bg-secondary/60"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>سقف استفاده (۰ = نامحدود)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.maxUses}
                  onChange={(e) =>
                    setForm({ ...form, maxUses: e.target.value })
                  }
                  className="tabular bg-secondary/60"
                />
              </div>
              <div className="space-y-2">
                <Label>مهلت (خالی = بدون انقضا)</Label>
                <Input
                  type="date"
                  value={form.expiresOn}
                  onChange={(e) =>
                    setForm({ ...form, expiresOn: e.target.value })
                  }
                  className="tabular bg-secondary/60"
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-3">
              <div className="text-sm">از همین حالا فعال باشد</div>
              <Switch
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
            <DialogFooter className="mt-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  انصراف
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={saving}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? "در حال ذخیره..." : "ساخت کد"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
