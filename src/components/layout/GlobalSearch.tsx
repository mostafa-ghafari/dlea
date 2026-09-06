import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRole, useTrades, useJournalEntries, useUsers } from "@/lib/api";
import { nav } from "./nav";

/** Global search across pages, trades and journal entries. */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const roleData = useRole();
  const isAdmin = roleData?.effective === "admin";

  const adminPages = nav.filter((n) => n.admin);
  const userPages = nav.filter((n) => !n.admin);

  function go(to: string) {
    setOpen(false);
    void navigate({ to });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex h-10 w-full min-w-0 max-w-md items-center rounded-md border border-border bg-secondary/60 pr-9 pl-3 text-right text-sm text-muted-foreground transition-colors hover:border-primary/40"
      >
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <span className="truncate">{isAdmin ? "جستجو در بخش‌های مدیریت..." : "جستجو در صفحات، معاملات و ژورنال..."}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        {open && <GlobalSearchContent isAdmin={isAdmin} adminPages={adminPages} userPages={userPages} go={go} />}
      </Dialog>
    </>
  );
}

/** Rendered inside the Dialog — only mounts when open, so its heavy
 *  data hooks (trades, journal, users) don't fire on every page load. */
function GlobalSearchContent({ isAdmin, adminPages, userPages, go }: {
  isAdmin: boolean;
  adminPages: readonly typeof nav[number][];
  userPages: readonly typeof nav[number][];
  go: (to: string) => void;
}) {
  const [q, setQ] = useState("");
  const trades = useTrades();
  const journalEntries = useJournalEntries();
  const allUsers = useUsers();

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (isAdmin) {
      if (!term) return { pages: adminPages, trades: [], journals: [], users: [] } as const;
      return {
        pages: adminPages.filter((n) => n.label.toLowerCase().includes(term)),
        trades: [],
        journals: [],
        users: allUsers.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(term)).slice(0, 6),
      } as const;
    }
    if (!term) return { pages: userPages.slice(0, 5), trades: [], journals: [], users: [] } as const;
    return {
      pages: userPages.filter((n) => n.label.toLowerCase().includes(term)),
      trades: trades.filter((t) => `${t.symbol} ${t.id} ${t.ticket} ${t.strategy}`.toLowerCase().includes(term)).slice(0, 6),
      journals: journalEntries.filter((j) => `${j.title} ${j.symbol ?? ""}`.toLowerCase().includes(term)).slice(0, 5),
      users: [],
    } as const;
  }, [q, trades, journalEntries, isAdmin, allUsers]);

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>جستجوی سریع</DialogTitle>
        <DialogDescription>{isAdmin ? "نام بخش مدیریت را بنویس." : "نام صفحه، نماد معامله، شماره تیکت یا عنوان ژورنال را بنویس."}</DialogDescription>
      </DialogHeader>
      <Input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="مثلاً EURUSD یا ژورنال"
        className="mt-2 bg-secondary/60"
      />
      <div className="mt-2 max-h-80 space-y-4 overflow-y-auto">
        {results.pages.length > 0 && (
          <div>
            <div className="mb-1 text-[11px] text-muted-foreground">صفحات</div>
            {results.pages.map((p) => (
              <button key={p.to} onClick={() => go(p.to)} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70">
                <p.icon className="h-4 w-4 text-primary" /> {p.label}
              </button>
            ))}
          </div>
        )}
        {results.trades.length > 0 && (
          <div>
            <div className="mb-1 text-[11px] text-muted-foreground">معاملات</div>
            {results.trades.map((t) => (
              <button key={t.id} onClick={() => go(`/app/trades/${t.id}`)} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70">
                <span>{t.symbol} • {t.id}</span>
                <span className={cn("tabular", t.pnl >= 0 ? "gain" : "loss")}>${t.pnl}</span>
              </button>
            ))}
          </div>
        )}
        {results.journals.length > 0 && (
          <div>
            <div className="mb-1 text-[11px] text-muted-foreground">ژورنال‌ها</div>
            {results.journals.map((j) => (
              <button key={j.id} onClick={() => go("/app/journal")} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70">
                <BookOpen className="h-4 w-4 text-primary" /> {j.title}
              </button>
            ))}
          </div>
        )}
        {results.users && results.users.length > 0 && (
          <div>
            <div className="mb-1 text-[11px] text-muted-foreground">کاربران</div>
            {results.users.map((u) => (
              <button key={u.id} onClick={() => go("/app/admin/users")} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-right text-sm hover:bg-secondary/70">
                <Users className="h-4 w-4 text-primary" /> {u.name} <span className="text-xs text-muted-foreground">({u.email})</span>
              </button>
            ))}
          </div>
        )}
        {q.trim() && results.pages.length + results.trades.length + results.journals.length + (results.users?.length ?? 0) === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">نتیجه‌ای پیدا نشد.</div>
        )}
      </div>
    </DialogContent>
  );
}
