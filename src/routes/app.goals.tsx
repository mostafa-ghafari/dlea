import { AppShell } from "@/components/AppShell";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Target, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { createGoal, deleteGoal, fetchGoals, updateGoal, type Goal } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/app/goals")({
  head: () => ({ meta: [{ title: "اهداف معاملاتی" }] }),
  component: GoalsPage,
});

function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("سود");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editProgress, setEditProgress] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchGoals()
      .then((list) => alive && setGoals(list))
      .catch(() => alive && toast.error("دریافت اهداف از سرور ممکن نشد"));
    return () => {
      alive = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("عنوان هدف را وارد کنید");
      return;
    }
    try {
      const created = await createGoal({ title: title.trim(), progress: 0 });
      setGoals((g) => [...g, created]);
      toast.success(`هدف «${created.title}» اضافه شد`);
    } catch (err) {
      toast.error(`ثبت هدف ناموفق بود: ${err instanceof Error ? err.message : err}`);
      return;
    }
    setTitle("");
    setType("سود");
    setOpen(false);
  }

  return (
    <AppShell title="اهداف" subtitle="تعیین و پیگیری اهداف معاملاتی" actions={
      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setOpen(true)}>
        <Plus className="ml-1 h-4 w-4" />هدف جدید
      </Button>
    }>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
            <form onSubmit={submit}>
              <DialogHeader>
                <DialogTitle>هدف معاملاتی جدید</DialogTitle>
                <DialogDescription>یک هدف قابل اندازه‌گیری تعریف کن تا پیشرفتت را دنبال کنیم.</DialogDescription>
              </DialogHeader>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label>عنوان هدف</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلاً: ۱۵٪ سود ماهانه" className="bg-secondary/60" />
                </div>
                <div className="space-y-2">
                  <Label>نوع هدف</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["سود", "ریسک", "نظم", "یادگیری"].map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>مقدار هدف</Label>
                    <Input type="number" placeholder="۱۵" className="bg-secondary/60 tabular" />
                  </div>
                  <div className="space-y-2">
                    <Label>مهلت (روز)</Label>
                    <Input type="number" min={1} placeholder="۳۰" className="bg-secondary/60 tabular" />
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-6">
                <DialogClose asChild><Button type="button" variant="outline">انصراف</Button></DialogClose>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">ثبت هدف</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      <div className="grid gap-4 md:grid-cols-2">
        {goals.map((g) => (
          <div key={g.id} className="card-surface p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <Target className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{g.title}</h3>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="ویرایش هدف"
                      onClick={() => {
                        setEditId(g.id);
                        setEditTitle(g.title);
                        setEditProgress(g.progress);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      aria-label="حذف هدف"
                      onClick={async () => {
                        try {
                          await deleteGoal(g.id);
                          setGoals((list) => list.filter((x) => x.id !== g.id));
                          toast.success(`هدف «${g.title}» حذف شد`);
                        } catch (err) {
                          toast.error(`حذف هدف ناموفق بود: ${err instanceof Error ? err.message : err}`);
                        }
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">پیشرفت</span>
                  <span className="font-bold tabular gain">{g.progress}٪</span>
                </div>
                <Progress value={g.progress} className="mt-2 h-2" />
              </div>
            </div>
          </div>
        ))}
        {goals.length === 0 && (
          <div className="card-surface p-8 text-center text-sm text-muted-foreground md:col-span-2">
            هنوز هدفی تعریف نکردی — با دکمه «هدف جدید» شروع کن.
          </div>
        )}
      </div>

      <Dialog open={editId !== null} onOpenChange={(o) => !o && setEditId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ویرایش هدف</DialogTitle>
            <DialogDescription>عنوان و درصد پیشرفت هدف را به‌روزرسانی کن.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>عنوان هدف</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="bg-secondary/60" />
            </div>
            <div className="space-y-2">
              <Label>پیشرفت (٪)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={editProgress}
                onChange={(e) => setEditProgress(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                className="bg-secondary/60 tabular"
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">انصراف</Button>
            </DialogClose>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={async () => {
                if (!editTitle.trim() || !editId) {
                  toast.error("عنوان هدف را وارد کنید");
                  return;
                }
                try {
                  const updated = await updateGoal(editId, { title: editTitle.trim(), progress: editProgress });
                  setGoals((list) => list.map((x) => (x.id === editId ? updated : x)));
                  toast.success("هدف به‌روزرسانی شد");
                } catch (err) {
                  toast.error(`ویرایش هدف ناموفق بود: ${err instanceof Error ? err.message : err}`);
                  return;
                }
                setEditId(null);
              }}
            >
              ذخیره تغییرات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
);
}
