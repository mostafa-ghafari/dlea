import { AppShell } from "@/components/AppShell";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Megaphone, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePlatform } from "@/lib/platform-store";

export const Route = createFileRoute("/app/news/")({
  head: () => ({
    meta: [
      { title: "اخبار و اطلاعیه‌ها | Dlea AI" },
      { name: "description", content: "آخرین اخبار، تخفیف‌ها، آپدیت‌های پلتفرم و اطلاعیه‌های تیم Dlea AI." },
      { property: "og:title", content: "اخبار و اطلاعیه‌ها" },
      { property: "og:description", content: "تخفیف‌ها، آپدیت‌ها و اطلاعیه‌های پلتفرم ژورنال معاملاتی." },
    ],
  }),
  component: NewsPage,
});

export function categoryClass(cat: string) {
  if (cat === "تخفیف") return "border-accent/40 bg-accent/10 text-accent";
  if (cat === "آپدیت") return "border-primary/40 bg-primary/10 text-primary";
  return "border-border bg-secondary/60 text-muted-foreground";
}

function NewsPage() {
  const { news } = usePlatform();

  return (
    <AppShell title="اخبار و اطلاعیه‌ها" subtitle="آخرین تخفیف‌ها، آپدیت‌ها و اطلاعیه‌های پلتفرم">
    <div className="grid gap-4">
        {news.map((n) => (
          <Link
            key={n.id}
            to="/app/news/$id"
            params={{ id: n.id }}
            className="card-surface block p-6 transition-colors hover:border-primary/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Megaphone className="h-4 w-4" />
              </div>
              <h2 className="text-base font-semibold">{n.title}</h2>
              <Badge variant="outline" className={categoryClass(n.category)}>{n.category}</Badge>
              {n.pinned && (
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                  <Pin className="ml-1 h-3 w-3" /> مهم
                </Badge>
              )}
              <span className="mr-auto text-xs text-muted-foreground tabular">{n.date}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{n.summary}</p>
          </Link>
        ))}
        {news.length === 0 && (
          <div className="card-surface p-10 text-center text-sm text-muted-foreground">خبری منتشر نشده است.</div>
        )}
      </div>
    </AppShell>
);
}
