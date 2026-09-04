import { AppShell } from "@/components/AppShell";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileSpreadsheet, Link2, UploadCloud, CheckCircle2, Loader2, Download, Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";
import { bulkImportTrades, get, post, usePortfolios, type TradeInput } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/trades/new")({
  head: () => ({
    meta: [
      { title: "افزودن معامله — ایمپورت یا اتصال متاتریدر" },
      { name: "description", content: "معاملات را از فایل گزارش متاتریدر ایمپورت کن یا حساب MT4/MT5 را متصل کن تا معاملات خودکار جمع‌آوری شوند." },
      { property: "og:title", content: "افزودن معامله" },
      { property: "og:description", content: "ایمپورت گزارش متاتریدر یا اتصال خودکار حساب معاملاتی." },
    ],
  }),
  component: NewTrade,
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

const ACCEPT = ".csv,.htm,.html,.xlsx,.xls";

type ParsedTrade = {
  ticket: string;
  symbol: string;
  side: string;
  volume: string;
  openTime: string;
  closeTime: string;
  profit: string;
};

function splitCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if ((ch === "," || ch === ";" || ch === "\t") && !quoted) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

/** Extracts closed-deal rows from a MetaTrader CSV or HTML statement. */
function parseStatement(text: string, isHtml: boolean): ParsedTrade[] {
  const rows: string[][] = [];

  if (isHtml) {
    const trs = text.match(/<tr[\s\S]*?<\/tr>/gi) ?? [];
    trs.forEach((tr) => {
      const cells = (tr.match(/<t[dh][\s\S]*?<\/t[dh]>/gi) ?? []).map((c) =>
        c.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim(),
      );
      if (cells.length >= 6) rows.push(cells);
    });
  } else {
    text
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0)
      .forEach((l) => rows.push(splitCsvLine(l)));
  }

  const num = (v: string) => Number(String(v).replace(/[^\d.\-]/g, ""));
  const trades: ParsedTrade[] = [];

  rows.forEach((c) => {
    const symbolIdx = c.findIndex((v) => /^[A-Za-z]{6}(\.[a-z]+)?$|^(XAUUSD|XAGUSD|US30|NAS100)/i.test(v.trim()));
    const sideIdx = c.findIndex((v) => /^(buy|sell)$/i.test(v.trim()));
    if (symbolIdx === -1 || sideIdx === -1) return;

    const ticket = c.find((v) => /^\d{6,}$/.test(v.trim())) ?? "-";
    const times = c.filter((v) => /\d{4}[./-]\d{2}[./-]\d{2}[ T]\d{2}:\d{2}/.test(v));
    // Only import closed positions (require both open and close times)
    if (times.length < 2) return;
    const numbers = c.filter((v) => /^-?[\d\s,]*\.?\d+$/.test(v.trim()) && v.trim() !== ticket);
    const profitRaw = numbers.length ? numbers[numbers.length - 1]! : "0";
    const volumeRaw = c[sideIdx + 1] && num(c[sideIdx + 1]!) ? c[sideIdx + 1]! : (numbers[0] ?? "0");

    trades.push({
      ticket,
      symbol: c[symbolIdx]!.toUpperCase(),
      side: c[sideIdx]!.toLowerCase() === "buy" ? "خرید" : "فروش",
      volume: String(num(volumeRaw) || 0),
      openTime: times[0] ?? "-",
      closeTime: times[1] ?? "-",
      profit: String(num(profitRaw) || 0),
    });
  });

  return trades;
}

function normalizeMtDate(raw: string): string {
  const cleaned = raw.replace(/\./g, "-").trim();
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(cleaned)) {
    // MetaTrader timestamps have no seconds — Django needs them.
    const withSeconds = /:\d{2}$/.test(cleaned) ? cleaned : `${cleaned}:00`;
    return withSeconds.replace(" ", "T");
  }
  return new Date().toISOString();
}

/** Parse XLSX file and extract trade rows as string arrays. */
function parseXlsx(buffer: ArrayBuffer): ParsedTrade[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  // Convert each row to the same format parseStatement expects
  const rows: string[][] = raw.filter((r: string[]) => r.length >= 6);
  const num = (v: string) => Number(String(v).replace(/[^\d.\-]/g, ""));
  const trades: ParsedTrade[] = [];

  rows.forEach((c) => {
    const symbolIdx = c.findIndex((v) => /^[A-Za-z]{6}(\.[a-z]+)?$|^(XAUUSD|XAGUSD|US30|NAS100)/i.test(v.trim()));
    const sideIdx = c.findIndex((v) => /^(buy|sell)$/i.test(v.trim()));
    if (symbolIdx === -1 || sideIdx === -1) return;

    const ticket = c.find((v) => /^\d{6,}$/.test(v.trim())) || "-";
    const times = c.filter((v) => /\d{4}[./-]\d{2}[./-]\d{2}[ T]\d{2}:\d{2}/.test(v));
    // Only import closed positions (require both open and close times)
    if (times.length < 2) return;
    const numbers = c.filter((v) => /^-?[\d\s,]*\.?\d+$/.test(v.trim()) && v.trim() !== ticket);

    const profitRaw = numbers.length ? numbers[numbers.length - 1]! : "0";
    const volumeRaw = c[sideIdx + 1] && num(c[sideIdx + 1]!) ? c[sideIdx + 1]! : (numbers[0] || "0");

    trades.push({
      ticket,
      symbol: c[symbolIdx]!.toUpperCase(),
      side: c[sideIdx]!.toLowerCase() === "buy" ? "خرید" : "فروش",
      volume: String(num(volumeRaw) || 0),
      openTime: times[0] || "-",
      closeTime: times[1] || "-",
      profit: String(num(profitRaw) || 0),
    });
  });

  return trades;
}

function ImportPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const portfolios = usePortfolios();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState<ParsedTrade[]>([]);
  const [portfolioId, setPortfolioId] = useState<string>("");

  async function pick(f: File | null) {
    if (!f) return;
    if (!/\.(csv|html?|xlsx?|xls)$/i.test(f.name)) {
      toast.error("فرمت فایل پشتیبانی نمی‌شود (CSV، HTML یا Excel)");
      return;
    }
    setFile(f);
    setParsed([]);

    if (/\.(csv|html?)$/i.test(f.name)) {
      try {
        const text = await f.text();
        const rows = parseStatement(text, /\.html?$/i.test(f.name));
        setParsed(rows);
        if (rows.length === 0) {
          toast.warning("معامله‌ای در فایل شناسایی نشد — ساختار گزارش را بررسی کن");
        } else {
          toast.success(`${rows.length} معامله در فایل «${f.name}» شناسایی شد`);
        }
      } catch {
        toast.error("خواندن فایل ناموفق بود");
      }
    } else if (/\.xlsx?$/i.test(f.name)) {
      try {
        const buffer = await f.arrayBuffer();
        const rows = parseXlsx(buffer);
        setParsed(rows);
        if (rows.length === 0) {
          toast.warning("معامله‌ای در فایل شناسایی نشد — ساختار گزارش را بررسی کن");
        } else {
          toast.success(`${rows.length} معامله در فایل «${f.name}» شناسایی شد`);
        }
      } catch {
        toast.error("خواندن فایل XLSX ناموفق بود");
      }
    }
  }

  async function startImport() {
    if (!file) {
      toast.error("ابتدا فایل گزارش متاتریدر را انتخاب کن");
      return;
    }
    if (parsed.length === 0) {
      toast.error("معامله‌ای در فایل شناسایی نشد — از CSV یا HTML استفاده کن");
      return;
    }
    if (!portfolioId) {
      toast.error("پرتفولیوی مقصد را انتخاب کن");
      return;
    }
    const pid = Number(portfolioId);
    const items: TradeInput[] = parsed.map((t) => ({
      ticket: t.ticket === "-" ? `IMP-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}` : t.ticket,
      symbol: t.symbol,
      side: t.side === "خرید" ? "buy" : "sell",
      volume: Number(t.volume) || 0,
      pnl: Number(t.profit) || 0,
      entry: 0,
      exit: 0,
      sl: 0,
      tp: 0,
      rr: 0,
      pips: 0,
      commission: 0,
      swap: 0,
      taxes: 0,
      open_time: normalizeMtDate(t.openTime),
      close_time: normalizeMtDate(t.closeTime),
      magic: 0,
      comment: "",
      reason: "Client",
      strategy: "",
      portfolio_id: pid,
      followedPlan: true,
      emotion: "آرام",
      screenshots: [],
    }));
    setBusy(true);
    try {
      const res = await bulkImportTrades(items);
      if (res.created === 0) {
        toast.error("هیچ معامله‌ای ثبت نشد — داده‌های فایل را بررسی کن");
        setBusy(false);
        return;
      }
      toast.success(`${res.created} معامله از فایل «${file.name}» ایمپورت شد`);
      navigate({ to: "/app/trades" });
    } catch (err) {
      setBusy(false);
      toast.error(`ایمپورت ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }


  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="card-surface space-y-4 p-6 lg:col-span-2">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">ایمپورت گزارش معاملات</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          از متاتریدر خروجی <span className="font-medium">History / Report</span> بگیر و فایل را اینجا بارگذاری کن.
          تمام فیلدها (Ticket، Symbol، Volume، Swap، Commission و ...) به‌صورت خودکار خوانده می‌شود.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            pick(e.dataTransfer.files?.[0] ?? null);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border bg-secondary/30 hover:bg-secondary/50"
          }`}
        >
          <div>
            <UploadCloud className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 text-sm">
              {file ? file.name : "فایل را بکش و رها کن یا کلیک کن"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">CSV, HTML, XLSX — حداکثر ۱۰ مگابایت</p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />

        {parsed.length > 0 && (
          <div className="rounded-xl border border-border bg-secondary/30 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-medium">پیش‌نمایش معاملات شناسایی‌شده</div>
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary tabular">
                {parsed.length} معامله
              </Badge>
            </div>
            <div className="max-h-64 overflow-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-2 text-right">تیکت</th>
                    <th className="py-2 text-right">نماد</th>
                    <th className="py-2 text-right">نوع</th>
                    <th className="py-2 text-right">حجم</th>
                    <th className="py-2 text-right">زمان باز</th>
                    <th className="py-2 text-right">سود/زیان</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 50).map((t, i) => (
                    <tr key={`${t.ticket}-${i}`} className="border-b border-border/40 last:border-0">
                      <td className="py-2 text-xs tabular text-muted-foreground">{t.ticket}</td>
                      <td className="py-2 font-medium">{t.symbol}</td>
                      <td className="py-2">{t.side}</td>
                      <td className="py-2 tabular">{t.volume}</td>
                      <td className="py-2 text-xs tabular text-muted-foreground">{t.openTime}</td>
                      <td className={`py-2 tabular ${Number(t.profit) >= 0 ? "gain" : "loss"}`}>{t.profit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}


        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>پرتفولیو مقصد</Label>
            <Select value={portfolioId} onValueChange={setPortfolioId}>
              <SelectTrigger className="bg-secondary/60"><SelectValue placeholder="انتخاب پرتفولیو" /></SelectTrigger>
              <SelectContent>
                {portfolios.length === 0 && (
                  <SelectItem value="none" disabled>اول یک پرتفولیو بساز</SelectItem>
                )}
                {portfolios.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>نسخه متاتریدر</Label>
            <Select defaultValue="mt5">
              <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="mt4">MT4</SelectItem>
                <SelectItem value="mt5">MT5</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={startImport}
            disabled={busy}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {busy ? <Loader2 className="ml-1 h-4 w-4 animate-spin" /> : <UploadCloud className="ml-1 h-4 w-4" />}
            شروع ایمپورت
          </Button>
          <Button variant="outline" onClick={() => { setFile(null); setParsed([]); }}>پاک کردن</Button>
        </div>
      </div>

      <div className="card-surface space-y-3 p-6">
        <h3 className="font-semibold">راهنمای خروجی گرفتن</h3>
        <ol className="space-y-3 text-sm text-muted-foreground">
          {[
            "در متاتریدر به تب History برو.",
            "بازه زمانی دلخواه را انتخاب کن.",
            "راست‌کلیک → Report → گزینه HTML یا XLSX.",
            "فایل ذخیره‌شده را اینجا بارگذاری کن.",
          ].map((t, i) => (
            <li key={i} className="flex gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-primary/15 text-[11px] font-bold text-primary tabular">
                {i + 1}
              </span>
              <span>{t}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}



function ConnectPanel() {
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
              <li>فایل <span dir="ltr" className="font-mono">DleaSync.ex5</span> را دانلود کن.</li>
              <li>در MT5: File → Open Data Folder → پوشه MQL5/Experts.</li>
              <li>فایل را در پوشه <span dir="ltr" className="font-mono">MQL5/Experts</span> متاتریدر کپی کن.</li>
              <li>در MT5: Tools → Options → Expert Advisors → «Allow WebRequest» را تیک بزن و آدرس وب‌هوک را اضافه کن.</li>
              <li>EA را روی چارت بکش، توکن و آدرس وب‌هوک را وارد کن و Algo Trading را فعال کن.</li>
            </ol>
            <a href="/mt/DleaSync.ex5" download className="mt-4 inline-block">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" /> دانلود DleaSync.ex5
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
function NewTrade() {
  return (
    <AppShell title="افزودن معامله" subtitle="ایمپورت فایل یا اتصال متاتریدر">
    <Tabs defaultValue="import" dir="rtl">
        <TabsList>
          <TabsTrigger value="import"><FileSpreadsheet className="ml-1 h-4 w-4" />ایمپورت فایل</TabsTrigger>
          <TabsTrigger value="connect"><Link2 className="ml-1 h-4 w-4" />اتصال متاتریدر</TabsTrigger>
        </TabsList>
        <TabsContent value="import" className="mt-6"><ImportPanel /></TabsContent>
        <TabsContent value="connect" className="mt-6"><ConnectPanel /></TabsContent>
      </Tabs>
    </AppShell>
);
}
