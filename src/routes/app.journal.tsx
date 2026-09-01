import { AppShell } from "@/components/AppShell";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  BookOpen,
  CheckCircle2,
  XCircle,
  Filter,
  Search as SearchIcon,
  Star,
  Pencil,
  FolderPlus,
  Folder,
  Trash2,
  Check,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { RichTextEditor, RichTextView } from "@/components/RichTextEditor";
import { ImageUploader } from "@/components/ImageUploader";
import {
  createJournalEntry,
  createJournalGroup,
  deleteJournalGroup,
  fetchJournalEntries,
  fetchJournalGroups,
  renameJournalGroup,
  updateJournalEntry,
  updateJournalFavorite,
  type JournalEntryInput,
} from "@/lib/api";
import type { JournalEntry, JournalGroup } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/app/journal")({
  head: () => ({
    meta: [
      { title: "ژورنال معاملاتی | Dlea AI" },
      { name: "description", content: "ثبت، ویرایش، گروه‌بندی و فیلتر ژورنال‌های معاملاتی همراه با اسکرین‌شات و ویرایشگر پیشرفته." },
      { property: "og:title", content: "ژورنال معاملاتی" },
      { property: "og:description", content: "ژورنال‌های خود را با ویرایشگر پیشرفته بنویسید، گروه‌بندی و فیلتر کنید." },
    ],
  }),
  component: JournalPage,
});

const EMOTIONS = ["آرام", "متمرکز", "طمع", "ترس", "انتقام"];

type Draft = {
  title: string;
  tradeId: string;
  symbol: string;
  emotion: string;
  mistakes: string;
  lesson: string;
  plan: boolean;
  favorite: boolean;
  groupId: string | null;
  html: string;
  images: string[];
};

const emptyDraft: Draft = {
  title: "",
  tradeId: "",
  symbol: "EURUSD",
  emotion: "آرام",
  mistakes: "",
  lesson: "",
  plan: true,
  favorite: false,
  groupId: null,
  html: "",
  images: [],
};

function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [groups, setGroups] = useState<JournalGroup[]>([]);

  useEffect(() => {
    let alive = true;
    Promise.all([fetchJournalGroups(), fetchJournalEntries()])
      .then(([g, e]) => {
        if (!alive) return;
        setGroups(g);
        setEntries(e);
      })
      .catch(() => alive && toast.error("دریافت ژورنال از سرور ممکن نشد"));
    return () => {
      alive = false;
    };
  }, []);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const [groupOpen, setGroupOpen] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupNameDraft, setGroupNameDraft] = useState("");

  const [filterOpen, setFilterOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "yes" | "no">("all");
  const [emotionFilter, setEmotionFilter] = useState("all");
  const [symbolFilter, setSymbolFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [favOnly, setFavOnly] = useState(false);
  const [periodFilter, setPeriodFilter] = useState("all");

  const symbols = useMemo(
    () => Array.from(new Set(entries.map((e) => e.symbol).filter(Boolean))),
    [entries],
  );
  const months = useMemo(() => Array.from(new Set(entries.map((e) => e.month))), [entries]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (query && !`${e.title} ${e.tradeId} ${e.symbol} ${e.emotion}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      if (planFilter === "yes" && !e.plan) return false;
      if (planFilter === "no" && e.plan) return false;
      if (emotionFilter !== "all" && e.emotion !== emotionFilter) return false;
      if (symbolFilter !== "all" && e.symbol !== symbolFilter) return false;
      if (groupFilter !== "all" && (e.groupId ?? "none") !== groupFilter) return false;
      if (favOnly && !e.favorite) return false;
      if (periodFilter !== "all" && e.month !== periodFilter) return false;
      return true;
    });
  }, [entries, query, planFilter, emotionFilter, symbolFilter, groupFilter, favOnly, periodFilter]);

  const activeFilters =
    Boolean(query) ||
    planFilter !== "all" ||
    emotionFilter !== "all" ||
    symbolFilter !== "all" ||
    groupFilter !== "all" ||
    periodFilter !== "all" ||
    favOnly;

  function clearFilters() {
    setQuery("");
    setPlanFilter("all");
    setEmotionFilter("all");
    setSymbolFilter("all");
    setGroupFilter("all");
    setPeriodFilter("all");
    setFavOnly(false);
  }

  function openNew() {
    setEditingId(null);
    setDraft(emptyDraft);
    setEditorOpen(true);
  }

  function openEdit(entry: JournalEntry) {
    setEditingId(entry.id);
    setDraft({
      title: entry.title,
      tradeId: entry.tradeId,
      symbol: entry.symbol,
      emotion: entry.emotion,
      mistakes: entry.mistakes,
      lesson: entry.lesson,
      plan: entry.plan,
      favorite: entry.favorite,
      groupId: entry.groupId,
      html: entry.html,
      images: entry.images,
    });
    setEditorOpen(true);
  }

  async function toggleFavorite(id: string, favorite: boolean) {
    try {
      const updated = await updateJournalFavorite(id, !favorite);
      setEntries((list) => list.map((e) => (e.id === id ? updated : e)));
      toast.success(favorite ? "از علاقه‌مندی‌ها حذف شد" : "به علاقه‌مندی‌ها اضافه شد");
    } catch (err) {
      toast.error(`تغییر وضعیت ژورنال ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!draft.title.trim()) {
      toast.error("عنوان ژورنال را وارد کنید");
      return;
    }

    const payload: JournalEntryInput = {
      title: draft.title.trim(),
      symbol: draft.symbol,
      tradeId: draft.tradeId,
      emotion: draft.emotion,
      mistakes: draft.mistakes,
      lesson: draft.lesson,
      plan: draft.plan,
      favorite: draft.favorite,
      group_id: draft.groupId,
      html: draft.html,
      images: draft.images,
    };

    try {
      if (editingId) {
        const updated = await updateJournalEntry(editingId, payload);
        setEntries((list) => list.map((e) => (e.id === editingId ? updated : e)));
        toast.success("ژورنال ویرایش شد");
      } else {
        const created = await createJournalEntry(payload);
        setEntries((list) => [created, ...list]);
        toast.success("ژورنال با موفقیت ثبت شد");
      }
    } catch (err) {
      toast.error(`ثبت ژورنال ناموفق بود: ${err instanceof Error ? err.message : err}`);
      return;
    }
    setEditorOpen(false);
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function createGroup(ev: React.FormEvent) {
    ev.preventDefault();
    if (!newGroup.trim()) {
      toast.error("نام گروه را وارد کنید");
      return;
    }
    try {
      const created = await createJournalGroup({ name: newGroup.trim(), color: "primary" });
      setGroups((g) => [...g, created]);
      setNewGroup("");
      setGroupOpen(false);
      toast.success("گروه جدید ساخته شد");
    } catch (err) {
      toast.error(`ساخت گروه ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function renameGroup(id: string) {
    if (!groupNameDraft.trim()) {
      toast.error("نام گروه نمی‌تواند خالی باشد");
      return;
    }
    try {
      const updated = await renameJournalGroup(id, { name: groupNameDraft.trim() });
      setGroups((g) => g.map((x) => (x.id === id ? updated : x)));
      setEditingGroupId(null);
      setGroupNameDraft("");
      toast.success("نام گروه ویرایش شد");
    } catch (err) {
      toast.error(`ویرایش گروه ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function deleteGroup(id: string) {
    try {
      await deleteJournalGroup(id);
      setGroups((g) => g.filter((x) => x.id !== id));
      setEntries((list) => list.map((e) => (e.groupId === id ? { ...e, groupId: null } : e)));
      if (groupFilter === id) setGroupFilter("all");
      toast.success("گروه حذف شد؛ ژورنال‌های آن بدون گروه شدند");
    } catch (err) {
      toast.error(`حذف گروه ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  const groupName = (id: string | null) => groups.find((g) => g.id === id)?.name ?? null;

  return (
    <AppShell title="ژورنال معاملاتی" subtitle="یادداشت و تحلیل معاملات" actions={
      <Button variant="outline" onClick={() => setGroupOpen(true)}>
        <FolderPlus className="ml-1 h-4 w-4" />
        گروه‌ها
      </Button>
    }>
      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
            <DialogContent>
              <form onSubmit={createGroup}>
                <DialogHeader>
                  <DialogTitle>مدیریت گروه‌های ژورنال</DialogTitle>
                  <DialogDescription>ژورنال‌ها را در گروه‌های دلخواه دسته‌بندی کن.</DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                  <Label>نام گروه</Label>
                  <Input value={newGroup} onChange={(e) => setNewGroup(e.target.value)} placeholder="مثلاً سشن نیویورک" className="bg-secondary/60" />
                  <div className="space-y-2 pt-2">
                    <div className="text-xs text-muted-foreground">گروه‌های موجود — قابل ویرایش و حذف</div>
                    {groups.length === 0 && (
                      <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                        هنوز گروهی نساخته‌ای.
                      </div>
                    )}
                    {groups.map((g) => (
                      <div key={g.id} className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 p-2">
                        <Folder className="h-4 w-4 shrink-0 text-primary" />
                        {editingGroupId === g.id ? (
                          <>
                            <Input
                              value={groupNameDraft}
                              onChange={(e) => setGroupNameDraft(e.target.value)}
                              className="h-8 bg-background/60"
                            />
                            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => renameGroup(g.id)} aria-label="ذخیره نام گروه">
                              <Check className="h-4 w-4 text-primary" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="min-w-0 flex-1 truncate text-sm">{g.name}</span>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              aria-label="ویرایش گروه"
                              onClick={() => {
                                setEditingGroupId(g.id);
                                setGroupNameDraft(g.name);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive"
                              aria-label="حذف گروه"
                              onClick={() => deleteGroup(g.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">انصراف</Button>
                  </DialogClose>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">ساخت گروه</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Filter className="ml-1 h-4 w-4" />
                فیلترها
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>فیلتر ژورنال</DialogTitle>
                <DialogDescription>نتایج را با معیارهای زیر محدود کن.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>جستجو</Label>
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="عنوان، نماد، شناسه معامله..." className="bg-secondary/60 pr-9" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>دارایی</Label>
                    <Select value={symbolFilter} onValueChange={setSymbolFilter}>
                      <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه</SelectItem>
                        {symbols.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>احساس</Label>
                    <Select value={emotionFilter} onValueChange={setEmotionFilter}>
                      <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه</SelectItem>
                        {EMOTIONS.map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>گروه</Label>
                    <Select value={groupFilter} onValueChange={setGroupFilter}>
                      <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه</SelectItem>
                        <SelectItem value="none">بدون گروه</SelectItem>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>دوره</Label>
                    <Select value={periodFilter} onValueChange={setPeriodFilter}>
                      <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">همه</SelectItem>
                        {months.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>پایبندی به پلن</Label>
                  <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as "all" | "yes" | "no")}>
                    <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="yes">فقط طبق پلن</SelectItem>
                      <SelectItem value="no">فقط خارج از پلن</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-3">
                  <div className="text-sm">فقط علاقه‌مندی‌ها</div>
                  <Switch checked={favOnly} onCheckedChange={setFavOnly} />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => { clearFilters(); toast.success("فیلترها پاک شد"); }}>پاک کردن</Button>
                <DialogClose asChild>
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90">اعمال</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <form onSubmit={submit}>
            <DialogHeader>
              <DialogTitle>{editingId ? "ویرایش ژورنال" : "ژورنال جدید"}</DialogTitle>
              <DialogDescription>یادداشت خود درباره یک معامله را با ویرایشگر پیشرفته بنویس.</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label>عنوان</Label>
                  <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="bg-secondary/60" />
                </div>
                <div className="space-y-2">
                  <Label>نماد</Label>
                  <Input value={draft.symbol} onChange={(e) => setDraft({ ...draft, symbol: e.target.value.toUpperCase() })} placeholder="EURUSD" className="tabular bg-secondary/60" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>شناسه معامله</Label>
                  <Input value={draft.tradeId} onChange={(e) => setDraft({ ...draft, tradeId: e.target.value })} placeholder="T-1043" className="tabular bg-secondary/60" />
                </div>
                <div className="space-y-2">
                  <Label>احساس</Label>
                  <Select value={draft.emotion} onValueChange={(v) => setDraft({ ...draft, emotion: v })}>
                    <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EMOTIONS.map((e) => (
                        <SelectItem key={e} value={e}>{e}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>گروه</Label>
                  <Select value={draft.groupId ?? "none"} onValueChange={(v) => setDraft({ ...draft, groupId: v === "none" ? null : v })}>
                    <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون گروه</SelectItem>
                      {groups.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>توضیحات کامل ژورنال</Label>
                <RichTextEditor value={draft.html} onChange={(html) => setDraft((d) => ({ ...d, html }))} />
              </div>

              <ImageUploader
                images={draft.images}
                onChange={(images) => setDraft((d) => ({ ...d, images }))}
                label="اسکرین‌شات ژورنال"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>اشتباهات</Label>
                  <Textarea rows={2} value={draft.mistakes} onChange={(e) => setDraft({ ...draft, mistakes: e.target.value })} className="bg-secondary/60" />
                </div>
                <div className="space-y-2">
                  <Label>درس آموخته‌شده</Label>
                  <Textarea rows={2} value={draft.lesson} onChange={(e) => setDraft({ ...draft, lesson: e.target.value })} className="bg-secondary/60" />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-3">
                  <div className="text-sm">طبق پلن معامله شد؟</div>
                  <Switch checked={draft.plan} onCheckedChange={(v) => setDraft({ ...draft, plan: v })} />
                </div>
                <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-3">
                  <div className="text-sm">علاقه‌مندی</div>
                  <Switch checked={draft.favorite} onCheckedChange={(v) => setDraft({ ...draft, favorite: v })} />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">انصراف</Button>
              </DialogClose>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {editingId ? "ذخیره تغییرات" : "ثبت ژورنال"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {activeFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">فیلتر فعال:</span>
          {query && <Badge variant="outline">جستجو: {query}</Badge>}
          {symbolFilter !== "all" && <Badge variant="outline">نماد: {symbolFilter}</Badge>}
          {emotionFilter !== "all" && <Badge variant="outline">احساس: {emotionFilter}</Badge>}
          {groupFilter !== "all" && <Badge variant="outline">گروه: {groupFilter === "none" ? "بدون گروه" : groupName(groupFilter)}</Badge>}
          {periodFilter !== "all" && <Badge variant="outline">دوره: {periodFilter}</Badge>}
          {planFilter !== "all" && <Badge variant="outline">{planFilter === "yes" ? "طبق پلن" : "خارج از پلن"}</Badge>}
          {favOnly && <Badge variant="outline">فقط علاقه‌مندی‌ها</Badge>}
          <button className="text-primary hover:underline" onClick={clearFilters}>پاک کردن</button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.length === 0 && (
          <div className="card-surface col-span-full p-12 text-center text-sm text-muted-foreground">
            هیچ ژورنالی با این فیلتر پیدا نشد.
          </div>
        )}
        {filtered.map((j) => {
          const hasImages = j.images.length > 0;
          return (
            <article key={j.id} className={`card-surface p-6 ${hasImages ? "lg:col-span-2" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{j.title}</h3>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="tabular">{j.date}</span>
                      <span>•</span>
                      <span className="tabular">{j.symbol}</span>
                      <span>•</span>
                      <span className="tabular">{j.tradeId}</span>
                      {groupName(j.groupId) && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1"><Folder className="h-3 w-3" />{groupName(j.groupId)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(j.id, j.favorite)}
                    aria-label="علاقه‌مندی"
                    className={`grid h-8 w-8 place-items-center rounded-lg border transition-colors ${
                      j.favorite
                        ? "border-warning/40 bg-warning/10 text-warning"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star className={`h-4 w-4 ${j.favorite ? "fill-current" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(j)}
                    aria-label="ویرایش ژورنال"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <Badge variant="outline" className={j.plan ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}>
                    {j.plan ? <CheckCircle2 className="ml-1 h-3 w-3" /> : <XCircle className="ml-1 h-3 w-3" />}
                    {j.plan ? "طبق پلن" : "خارج از پلن"}
                  </Badge>
                </div>
              </div>

              <div className={`mt-5 gap-5 ${hasImages ? "grid lg:grid-cols-2" : "block"}`}>
                <div className="space-y-3 text-sm">
                  {j.html && <RichTextView html={j.html} />}
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">احساس</div>
                    <div className="mt-1">{j.emotion}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground">اشتباهات</div>
                    <div className="mt-1 text-foreground/90">{j.mistakes}</div>
                  </div>
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <div className="text-xs font-medium text-primary">درس آموخته‌شده</div>
                    <div className="mt-1 text-foreground/90">{j.lesson}</div>
                  </div>
                </div>

                {hasImages && (
                  <div className="grid grid-cols-2 gap-2 self-start">
                    {j.images.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`اسکرین‌شات ژورنال ${j.title} شماره ${i + 1}`}
                        loading="lazy"
                        className="h-40 w-full rounded-lg border border-border object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
);
}
