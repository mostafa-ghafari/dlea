import { useState } from "react";
import { toast } from "sonner";
import { Megaphone, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  usePlatform,
  type NewsCategory,
  type NewsItem,
} from "@/lib/platform-store";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/RichTextEditor";
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

const NEWS_CATEGORIES: NewsCategory[] = ["تخفیف", "آپدیت", "اطلاعیه", "آموزش"];

export function NewsManager() {
  const { news, saveNews, deleteNews } = usePlatform();
  const [draft, setDraft] = useState<NewsItem | null>(null);

  function blank(): NewsItem {
    return {
      id: `N-${Date.now()}`,
      title: "",
      summary: "",
      body: "",
      category: "اطلاعیه",
      date: new Date().toLocaleDateString("fa-IR"),
      pinned: false,
    };
  }

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Megaphone className="h-4 w-4 text-primary" /> اخبار و اطلاعیه‌ها
        </div>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setDraft(blank())}
        >
          <Plus className="ml-1 h-4 w-4" /> خبر جدید
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {news.map((n) => (
          <div
            key={n.id}
            className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/50 p-3"
          >
            <Badge variant="outline">{n.category}</Badge>
            <span className="text-sm font-medium">{n.title}</span>
            <span className="text-xs text-muted-foreground tabular">
              {n.date}
            </span>
            <div className="mr-auto flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="ویرایش خبر"
                onClick={() => setDraft(n)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                aria-label="حذف خبر"
                onClick={() => {
                  deleteNews(n.id);
                  toast.success("خبر حذف شد");
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {news.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            خبری ثبت نشده است.
          </div>
        )}
      </div>

      <Dialog open={draft !== null} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          {draft && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {news.some((n) => n.id === draft.id)
                    ? "ویرایش خبر"
                    : "خبر جدید"}
                </DialogTitle>
                <DialogDescription>
                  خبر منتشرشده در صفحه اخبار و اعلانات کاربران نمایش داده
                  می‌شود.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>عنوان</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) =>
                      setDraft({ ...draft, title: e.target.value })
                    }
                    className="bg-secondary/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label>دسته‌بندی</Label>
                  <Select
                    value={draft.category}
                    onValueChange={(v) =>
                      setDraft({ ...draft, category: v as NewsCategory })
                    }
                  >
                    <SelectTrigger className="bg-secondary/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NEWS_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>خلاصه (برای اعلان)</Label>
                  <Input
                    value={draft.summary}
                    onChange={(e) =>
                      setDraft({ ...draft, summary: e.target.value })
                    }
                    className="bg-secondary/60"
                  />
                </div>
                <div className="space-y-2">
                  <Label>متن کامل</Label>
                  <RichTextEditor
                    value={draft.body}
                    onChange={(body) => setDraft({ ...draft, body })}
                    placeholder="متن کامل خبر را اینجا بنویس..."
                    minHeight={200}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label>سنجاق کردن به بالای لیست</Label>
                  <Switch
                    checked={draft.pinned}
                    onCheckedChange={(v) => setDraft({ ...draft, pinned: v })}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose asChild>
                  <Button variant="outline">انصراف</Button>
                </DialogClose>
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    if (!draft.title.trim() || !draft.summary.trim()) {
                      toast.error("عنوان و خلاصه الزامی است");
                      return;
                    }
                    const isNew = !news.some((n) => n.id === draft.id);
                    saveNews(draft);
                    toast.success(
                      isNew ? "خبر منتشر شد" : "خبر به‌روزرسانی شد",
                    );
                    setDraft(null);
                  }}
                >
                  ذخیره و انتشار
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
