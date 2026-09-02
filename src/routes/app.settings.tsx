import { AppShell } from "@/components/AppShell";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CreditCard, User, Bell, Link2, CheckCircle2, Check, Copy, Download, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { fullName, useCurrentUser } from "@/lib/app-state";
import { fetchProfile, get, post, updateProfile, usePortfolios, useSubscription } from "@/lib/api";
import type { UserProfile } from "@/lib/api";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [{ title: "تنظیمات" }] }),
  component: SettingsPage,
});

type MtStatus = {
  connected: boolean;
  token?: string;
  webhookUrl?: string;
  account?: string;
  server?: string;
  broker?: string;
  platform?: string;
  portfolioId?: string | null;
};

function SettingsPage() {
  const user = useCurrentUser();
  const subscription = useSubscription();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile()
      .then((p) => {
        setProfile(p);
        setFirstName(p.firstName);
        setLastName(p.lastName);
        setPhone(p.phone);
        setAvatarUrl(p.avatar);
      })
      .catch(() => {});
  }, []);

  const name = fullName(user);
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join(".") || "کاربر";

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateProfile({ firstName, lastName, phone });
      setProfile(updated);
      // Also update localStorage user data
      const stored = user ? { ...user, firstName, lastName } : null;
      if (stored) localStorage.setItem("dlea:user", JSON.stringify(stored));
      toast.success("پروفایل ذخیره شد");
    } catch (e) {
      toast.error(String(e instanceof Error ? e.message : "خطا در ذخیره"));
    }
    setSaving(false);
  }

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    try {
      const updated = await updateProfile({ avatarFile: file });
      setAvatarUrl(updated.avatar);
      toast.success("عکس پروفایل آپلود شد");
    } catch (e) {
      toast.error(String(e instanceof Error ? e.message : "خطا در آپلود عکس"));
    }
    setUploading(false);
  }

  return (
    <AppShell title="تنظیمات" subtitle="مدیریت حساب، اشتراک و اتصالات">
    <Tabs defaultValue="profile" dir="rtl">
        <TabsList>
          <TabsTrigger value="profile"><User className="ml-1 h-4 w-4" />پروفایل</TabsTrigger>
          <TabsTrigger value="subscription"><CreditCard className="ml-1 h-4 w-4" />اشتراک</TabsTrigger>
          <TabsTrigger value="mt"><Link2 className="ml-1 h-4 w-4" />متاتریدر</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="ml-1 h-4 w-4" />اعلان‌ها</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="card-surface p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={avatarUrl ?? undefined} alt={name} />
                  <AvatarFallback className="bg-primary/20 text-lg font-bold text-primary">{initials}</AvatarFallback>
                </Avatar>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleAvatarUpload(file);
                  }}
                />
              </div>
              <div>
                <div className="font-semibold">{name}</div>
                <div className="text-sm text-muted-foreground">{user?.email ?? ""}</div>
              </div>
              <Button variant="outline" className="w-full sm:w-auto sm:mr-auto" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Camera className="ml-1 h-4 w-4" />}
                {uploading ? "در حال آپلود..." : "تغییر عکس"}
              </Button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>نام</Label><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-secondary/60" /></div>
              <div className="space-y-2"><Label>نام خانوادگی</Label><Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-secondary/60" /></div>
              <div className="space-y-2"><Label>ایمیل</Label><Input defaultValue={user?.email ?? ""} className="bg-secondary/60" disabled /></div>
              <div className="space-y-2"><Label>موبایل</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="شماره موبایل" className="bg-secondary/60 tabular" dir="ltr" /></div>
            </div>
            <div className="mt-6"><Button onClick={handleSave} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saving ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : null}
              ذخیره تغییرات
            </Button></div>
          </div>
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="card-surface p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">اشتراک فعلی</div>
                  <div className="mt-1 text-2xl font-bold">{subscription?.plan ?? "رایگان"}</div>
                </div>
                <Badge className={subscription ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}>
                  {subscription ? "فعال" : "بدون اشتراک"}
                </Badge>
              </div>
              {subscription && (
                <div className="mt-6 grid gap-4 sm:grid-cols-3 text-sm">
                  <div><div className="text-muted-foreground">شروع</div><div className="mt-1 tabular">{subscription.startDate}</div></div>
                  <div><div className="text-muted-foreground">پایان</div><div className="mt-1 tabular">{subscription.endDate}</div></div>
                  <div><div className="text-muted-foreground">مبلغ ماهانه</div><div className="mt-1 tabular">{subscription.price}</div></div>
                </div>
              )}
              <div className="mt-6 flex gap-2">
                <Link to="/app/billing">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">خرید / تمدید اشتراک</Button>
                </Link>
                {subscription && <Button variant="outline">مشاهده فاکتورها</Button>}
              </div>
            </div>
            <div className="card-surface p-6">
              <div className="font-semibold">کد تخفیف</div>
              <div className="mt-3 flex gap-2">
                <Input placeholder="کد را وارد کنید" className="bg-secondary/60" />
                <Button variant="outline">اعمال</Button>
              </div>
              <div className="mt-4 rounded-lg bg-primary/10 p-3 text-sm text-primary">
                <CheckCircle2 className="ml-1 inline h-4 w-4" />
                پرداخت از طریق زرین‌پال
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="mt" className="mt-6">
          <MetaTraderTab />
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <div className="card-surface space-y-4 p-6">
            {[
              { t: "یادآوری ثبت ژورنال", d: "شب‌ها اگر ژورنال ثبت نشده باشد یادآوری کن." },
              { t: "هشدار نزدیک شدن به سقف ریسک", d: "وقتی ۸۰٪ ضرر روزانه رخ داد." },
              { t: "گزارش هفتگی AI", d: "خلاصه عملکرد هفتگی به ایمیل ارسال شود." },
              { t: "رفتار غیرعادی معاملاتی", d: "شناسایی FOMO یا Revenge Trading." },
            ].map((n, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-secondary/40 p-4">
                <div>
                  <div className="font-medium">{n.t}</div>
                  <div className="text-xs text-muted-foreground">{n.d}</div>
                </div>
                <Switch defaultChecked={i < 3} />
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
);
}

function MetaTraderTab() {
  const portfolios = usePortfolios();
  const [mt, setMt] = useState<MtStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platform, setPlatform] = useState("mt5");
  const [broker, setBroker] = useState("");
  const [server, setServer] = useState("");
  const [account, setAccount] = useState("");
  const [portfolioId, setPortfolioId] = useState<string>("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    get<MtStatus>("mt/status/")
      .then((d) => {
        setMt(d);
        if (d.connected) {
          setPlatform(d.platform ?? "mt5");
          setBroker(d.broker ?? "");
          setServer(d.server ?? "");
          setAccount(d.account ?? "");
          if (d.portfolioId) setPortfolioId(d.portfolioId);
        }
      })
      .catch(() => setMt({ connected: false }))
      .finally(() => setLoading(false));
  }, []);

  async function handleConnect() {
    if (!account.trim()) {
      toast.error("شماره حساب الزامی است");
      return;
    }
    if (!portfolioId) {
      toast.error("یک پرتفولیوی مقصد انتخاب کن");
      return;
    }
    setSaving(true);
    try {
      const data = await post<MtStatus>("mt/connect/", {
        platform,
        broker: broker.trim(),
        server: server.trim(),
        account: account.trim(),
        portfolioId,
      });
      setMt(data);
      toast.success("اتصال متاتریدر برقرار شد — حالا EA را نصب کن");
    } catch (e) {
      toast.error(String(e instanceof Error ? e.message : "خطا در اتصال"));
    }
    setSaving(false);
  }

  function copy(value: string, key: string) {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(key);
        setTimeout(() => setCopied(""), 1500);
      },
      () => toast.error("کپی ناموفق بود"),
    );
  }

  if (loading) {
    return (
      <div className="card-surface grid place-items-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const connected = mt?.connected;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Connection form */}
      <div className="card-surface p-6">
        <h3 className="font-semibold">اتصال حساب متاتریدر</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          معاملات بسته‌شده با نصب یک EA (اکسپرت) به‌صورت خودکار همگام می‌شوند.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>نسخه</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mt5">MT5</SelectItem>
                <SelectItem value="mt4">MT4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>بروکر</Label>
            <Input value={broker} onChange={(e) => setBroker(e.target.value)} placeholder="IC Markets" className="bg-secondary/60" />
          </div>
          <div className="space-y-2">
            <Label>سرور</Label>
            <Input value={server} onChange={(e) => setServer(e.target.value)} placeholder="ICMarkets-Live01" className="bg-secondary/60" />
          </div>
          <div className="space-y-2">
            <Label>شماره حساب</Label>
            <Input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="12345678" className="bg-secondary/60 tabular" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>پرتفولیوی مقصد</Label>
            <Select value={portfolioId} onValueChange={setPortfolioId}>
              <SelectTrigger className="bg-secondary/60"><SelectValue placeholder="انتخاب پرتفولیو" /></SelectTrigger>
              <SelectContent>
                {portfolios.map((p) => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.name} — {p.broker}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {portfolios.length === 0 && (
              <p className="text-xs text-amber-500">اول از بخش پرتفولیوها یک پرتفولیو بساز.</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <Button disabled={saving || portfolios.length === 0} className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleConnect}>
            {saving ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <Link2 className="ml-1 h-4 w-4" />}
            {connected ? "به‌روزرسانی اتصال" : "اتصال"}
          </Button>
        </div>
      </div>

      {/* Connection status + EA instructions */}
      {connected ? (
        <div className="space-y-4">
          <div className="card-surface p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">اتصال فعال</h3>
              <Badge className="bg-primary/15 text-primary">فعال</Badge>
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">حساب</dt><dd className="tabular">{mt?.account}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">سرور</dt><dd>{mt?.server || "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">نسخه</dt><dd>{mt?.platform?.toUpperCase()}</dd></div>
            </dl>
          </div>

          <div className="card-surface p-6">
            <h3 className="font-semibold">توکن و آدرس وب‌هوک</h3>
            <p className="mt-1 text-xs text-muted-foreground">این دو مقدار را هنگام نصب EA وارد کن.</p>
            <div className="mt-4 space-y-3">
              <div>
                <Label>آدرس وب‌هوک</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input readOnly value={mt?.webhookUrl ?? ""} dir="ltr" className="bg-secondary/60 font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => copy(mt?.webhookUrl ?? "", "url")}>
                    {copied === "url" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>توکن</Label>
                <div className="mt-1 flex items-center gap-2">
                  <Input readOnly value={mt?.token ?? ""} dir="ltr" className="bg-secondary/60 font-mono text-xs" />
                  <Button size="icon" variant="outline" onClick={() => copy(mt?.token ?? "", "token")}>
                    {copied === "token" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="card-surface p-6">
            <h3 className="font-semibold">نصب EA (اکسپرت)</h3>
            <ol className="mt-3 list-inside list-decimal space-y-1.5 text-sm text-muted-foreground">
              <li>فایل <span dir="ltr" className="font-mono">DleaSync.mq5</span> را دانلود کن.</li>
              <li>در MT5: File → Open Data Folder → پوشه MQL5/Experts.</li>
              <li>فایل را آنجا بگذار و در MetaEditor باز کن و F7 بزن (Compile).</li>
              <li>در MT5: Tools → Options → Expert Advisors → «Allow WebRequest» را تیک بزن و آدرس وب‌هوک را اضافه کن.</li>
              <li>EA را روی چارت بکش، توکن و آدرس وب‌هوک را وارد کن و Algo Trading را فعال کن.</li>
            </ol>
            <a href="/mt/DleaSync.mq5" download className="mt-4 inline-block">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> دانلود DleaSync.mq5
              </Button>
            </a>
          </div>
        </div>
      ) : (
        <div className="card-surface grid place-items-center p-12 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary/60 text-muted-foreground">
            <Link2 className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-semibold">هنوز متصل نیستی</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            فرم کنار را پر کن و «اتصال» را بزن تا توکن وب‌هوک برایت ساخته شود.
          </p>
        </div>
      )}
    </div>
  );
}
