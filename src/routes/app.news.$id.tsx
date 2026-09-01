import { Link, createFileRoute, useParams } from "@tanstack/react-router";
import { ArrowRight, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSetTitle } from "@/lib/page-context";
import { AppShell } from "@/components/AppShell";
import { usePlatform } from "@/lib/platform-store";
import { categoryClass } from "./app.news.index";

export const Route = createFileRoute("/app/news/$id")({
  head: () => ({
    meta: [
      { title: "جزئیات خبر | Dlea AI" },
      { name: "description", content: "متن کامل خبر، اطلاعیه یا آپدیت منتشرشده در پلتفرم ژورنال معاملاتی." },
      { property: "og:title", content: "جزئیات خبر" },
      { property: "og:description", content: "متن کامل اطلاعیه پلتفرم." },
    ],
  }),
  component: NewsDetail,
});

function NewsDetail() {
  useSetTitle("خبر پیدا نشد", "این خبر حذف شده یا وجود ندارد");
  const { id } = useParams({ from: "/app/news/$id" });
  const { news } = usePlatform();
  const item = news.find((n) => n.id === id);

  if (!item) {
    return (
      <div className="card-surface p-8 text-center">
          <Link to="/app/news">
            <Button variant="outline">بازگشت به اخبار</Button>
          </Link>
        </div>
);
  }

  return (
    <AppShell
      title={item.title}
      subtitle={`${item.category} • ${item.date}`}
      actions={
        <Link to="/app/news">
          <Button variant="outline">
            بازگشت <ArrowRight className="mr-1 h-4 w-4" />
          </Button>
        </Link>
      }
    >
      <article className="card-surface mx-auto max-w-3xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Megaphone className="h-4 w-4" />
          </div>
          <Badge variant="outline" className={categoryClass(item.category)}>{item.category}</Badge>
          <span className="text-xs text-muted-foreground tabular">{item.date}</span>
        </div>

        <h1 className="mt-4 text-2xl font-bold leading-relaxed">{item.title}</h1>
        <p className="mt-3 rounded-lg border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-muted-foreground">
          {item.summary}
        </p>

        <div className="mt-6 space-y-4 text-sm leading-8">
          {item.body.split("\n").filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>
    </AppShell>
  );
}
