import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  fetchPlans,
  updatePlan,
  invalidateCache,
  type Plan,
  type PlanFeature,
} from "@/lib/api";
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

type PlanRow = {
  slug: string;
  name: string;
  price: string;
  unit: string;
  users: number;
  portfolioLimit: string;
  maxPortfolios: number;
  maxTradesPerMonth: number;
  aiRequestsLimit: number;
  aiRequestsPeriod: "day" | "week" | "month";
  maxImagesPerEntry: number;
  sellable: boolean;
  features: string;
  /** Raw gating keys from the API — kept as strings so a key this panel does
   *  not know about survives a save instead of being silently dropped. */
  planFeatures: string[];
};

/** -1 means "no cap" everywhere in the plan limits. */
const UNLIMITED = -1;

/**
 * The gating keys the frontend checks. Nothing in the UI used to write this
 * list, so a plan saved from here kept whatever the database shipped with — an
 * empty list, which locks every page for that plan's users.
 */
const FEATURE_LABELS: { key: PlanFeature; label: string }[] = [
  { key: "portfolios", label: "پرتفولیوها" },
  { key: "trades", label: "معاملات" },
  { key: "journal", label: "ژورنال" },
  { key: "calendar", label: "تقویم معاملاتی" },
  { key: "goals", label: "اهداف" },
  { key: "achievements", label: "نشان‌ها" },
  { key: "news", label: "اخبار و اطلاعیه‌ها" },
  { key: "support", label: "پشتیبانی" },
  { key: "settings", label: "تنظیمات" },
  { key: "ai-coach", label: "مربی هوشمند" },
  { key: "risk", label: "مدیریت ریسک" },
  { key: "mt-connection", label: "اتصال MetaTrader" },
  { key: "reports", label: "گزارش‌های پیشرفته" },
  { key: "psychology", label: "تحلیل روانشناسی" },
];

const PERIOD_LABELS: Record<PlanRow["aiRequestsPeriod"], string> = {
  day: "روز",
  week: "هفته",
  month: "ماه",
};

function capText(value: number, unit: string) {
  if (value < 0) return "نامحدود";
  if (value === 0) return "بدون دسترسی";
  return `${value} ${unit}`;
}

function planToRow(p: Plan): PlanRow {
  return {
    slug: p.id,
    name: p.name,
    price: p.price,
    unit: p.unit,
    users: p.users,
    portfolioLimit: p.portfolioLimit,
    maxPortfolios: p.maxPortfolios ?? UNLIMITED,
    maxTradesPerMonth: p.maxTradesPerMonth ?? UNLIMITED,
    aiRequestsLimit: p.aiRequestsLimit ?? UNLIMITED,
    aiRequestsPeriod: p.aiRequestsPeriod ?? "month",
    maxImagesPerEntry: p.maxImagesPerEntry ?? UNLIMITED,
    sellable: p.sellable,
    features: p.features.join("، "),
    planFeatures: p.planFeatures ?? [],
  };
}

export function PlansManager() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const [saving, setSaving] = useState(false);

  function load() {
    return fetchPlans()
      .then((list) => setPlans(list.map(planToRow)))
      .catch(() => toast.error("دریافت پلن‌ها از سرور ممکن نشد"));
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const saved = await updatePlan(editing.slug, {
        name: editing.name,
        price: editing.price,
        unit: editing.unit,
        portfolioLimit: editing.portfolioLimit,
        maxPortfolios: editing.maxPortfolios,
        maxTradesPerMonth: editing.maxTradesPerMonth,
        aiRequestsLimit: editing.aiRequestsLimit,
        aiRequestsPeriod: editing.aiRequestsPeriod,
        maxImagesPerEntry: editing.maxImagesPerEntry,
        sellable: editing.sellable,
        // The gating list: what actually unlocks the sidebar for this plan.
        planFeatures: editing.planFeatures,
        // The admin types the list with Persian separators; the API wants a list.
        features: editing.features
          .split(/[،,]/)
          .map((f) => f.trim())
          .filter(Boolean),
      });
      // Other pages (feature gating, the pricing table) read the same data.
      invalidateCache("plans");
      setPlans((list) =>
        list.map((p) => (p.slug === saved.id ? planToRow(saved) : p)),
      );
      toast.success(`پلن ${saved.name} ذخیره شد`);
      setEditing(null);
    } catch (err) {
      toast.error(
        `ذخیره پلن ناموفق بود: ${err instanceof Error ? err.message : err}`,
      );
    }
    setSaving(false);
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plans.map((p) => (
          <div key={p.slug} className="card-surface p-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{p.name}</div>
              {!p.sellable && (
                <Badge
                  variant="outline"
                  className="border-accent/40 bg-accent/10 text-accent"
                >
                  فقط مدیر
                </Badge>
              )}
            </div>
            <div className="mt-2 text-2xl font-bold tabular">
              {p.price === "—" ? "غیرقابل فروش" : `${p.price} تومان`}
            </div>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div>پرتفولیو: {capText(p.maxPortfolios, "پرتفولیو")}</div>
              <div>معامله: {capText(p.maxTradesPerMonth, "در ماه")}</div>
              <div className="tabular">
                درخواست هوش مصنوعی:{" "}
                {p.aiRequestsLimit < 0
                  ? "نامحدود"
                  : `${p.aiRequestsLimit} در ${
                      PERIOD_LABELS[p.aiRequestsPeriod]
                    }`}
              </div>
              <div>
                تصویر در هر معامله: {capText(p.maxImagesPerEntry, "تصویر")}
              </div>
              <div>{p.features}</div>
              <div
                className={
                  p.planFeatures.length === 0 ? "text-destructive" : undefined
                }
              >
                بخش‌های باز:{" "}
                {p.planFeatures.length === 0
                  ? "هیچ‌کدام — همه‌چیز قفل است"
                  : `${p.planFeatures.length} از ${FEATURE_LABELS.length}`}
              </div>
            </div>
            <div className="mt-3 text-sm text-muted-foreground tabular">
              {p.users} کاربر فعال
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 w-full"
              onClick={() => setEditing(p)}
            >
              ویرایش پلن
            </Button>
          </div>
        ))}
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
      >
        <DialogContent>
          {editing && (
            <form onSubmit={save}>
              <DialogHeader>
                <DialogTitle>ویرایش پلن {editing.name}</DialogTitle>
                <DialogDescription>
                  قیمت، سقف‌ها و سهمیه‌ها را تغییر بده. مقدار ۱- یعنی نامحدود و
                  ۰ یعنی بدون دسترسی.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>نام پلن</Label>
                    <Input
                      value={editing.name}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      className="bg-secondary/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>قیمت</Label>
                    <Input
                      value={editing.price}
                      onChange={(e) =>
                        setEditing({ ...editing, price: e.target.value })
                      }
                      className="tabular bg-secondary/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>واحد قیمت</Label>
                    <Input
                      value={editing.unit}
                      onChange={(e) =>
                        setEditing({ ...editing, unit: e.target.value })
                      }
                      className="bg-secondary/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>متن سقف پرتفولیو</Label>
                    <Input
                      value={editing.portfolioLimit}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          portfolioLimit: e.target.value,
                        })
                      }
                      className="bg-secondary/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>حداکثر پرتفولیو (۱- = نامحدود)</Label>
                    <Input
                      type="number"
                      value={editing.maxPortfolios}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          maxPortfolios: Number(e.target.value) || 0,
                        })
                      }
                      className="tabular bg-secondary/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>حداکثر معامله در ماه (۱- = نامحدود)</Label>
                    <Input
                      type="number"
                      value={editing.maxTradesPerMonth}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          maxTradesPerMonth: Number(e.target.value) || 0,
                        })
                      }
                      className="tabular bg-secondary/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>سهمیه هوش مصنوعی (۱- = نامحدود)</Label>
                    <Input
                      type="number"
                      min={-1}
                      value={editing.aiRequestsLimit}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          aiRequestsLimit: Number(e.target.value) || 0,
                        })
                      }
                      className="tabular bg-secondary/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>بازه سهمیه هوش مصنوعی</Label>
                    <Select
                      value={editing.aiRequestsPeriod}
                      onValueChange={(v) =>
                        setEditing({
                          ...editing,
                          aiRequestsPeriod: v as PlanRow["aiRequestsPeriod"],
                        })
                      }
                    >
                      <SelectTrigger className="bg-secondary/60">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">روزانه</SelectItem>
                        <SelectItem value="week">هفتگی</SelectItem>
                        <SelectItem value="month">ماهانه</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>حداکثر تصویر در هر معامله (۱- = نامحدود)</Label>
                    <Input
                      type="number"
                      min={-1}
                      value={editing.maxImagesPerEntry}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          maxImagesPerEntry: Number(e.target.value) || 0,
                        })
                      }
                      className="tabular bg-secondary/60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>امکانات (با ، جدا کن)</Label>
                  <Input
                    value={editing.features}
                    onChange={(e) =>
                      setEditing({ ...editing, features: e.target.value })
                    }
                    className="bg-secondary/60"
                  />
                </div>
                <div className="space-y-3 rounded-lg bg-secondary/40 p-3">
                  <div>
                    <Label>دسترسی به بخش‌ها (قفل منو)</Label>
                    <p className="mt-1 text-xs text-muted-foreground">
                      هر بخشی که خاموش باشد برای کاربران این پلن قفل می‌شود. اگر
                      هیچ‌کدام روشن نباشد کل اپ قفل است — برای پلن‌هایی که
                      نمی‌شناسی همه را روشن بگذار.
                    </p>
                  </div>
                  {editing.planFeatures.length === 0 && (
                    <p className="text-xs text-destructive">
                      هیچ بخشی فعال نیست: کاربران این پلن با هر صفحه‌ای جز
                      داشبورد و خرید اشتراک روبه‌رو می‌شوند با پیام «این بخش قفل
                      است».
                    </p>
                  )}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {FEATURE_LABELS.map(({ key, label }) => (
                      <label
                        key={key}
                        className="flex items-center justify-between gap-2 rounded-md bg-background/60 px-3 py-2 text-sm"
                      >
                        <span>{label}</span>
                        <Switch
                          checked={editing.planFeatures.includes(key)}
                          onCheckedChange={(v) =>
                            setEditing({
                              ...editing,
                              planFeatures: v
                                ? [...editing.planFeatures, key]
                                : editing.planFeatures.filter((f) => f !== key),
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        planFeatures: FEATURE_LABELS.map((f) => f.key),
                      })
                    }
                  >
                    فعال‌کردن همه‌ی بخش‌ها
                  </Button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-3">
                  <div className="text-sm">قابل فروش به کاربران</div>
                  <Switch
                    checked={editing.sellable}
                    onCheckedChange={(v) =>
                      setEditing({ ...editing, sellable: v })
                    }
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
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
                  {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
