import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LOGS_PAGE_SIZE = 8;

const ALL_LOGS = [
  { t: "12:04:32", l: "INFO", m: "New user registered: maryam@example.com" },
  { t: "12:03:11", l: "INFO", m: "AI analysis completed for user U1" },
  { t: "11:58:07", l: "WARN", m: "Rate limit approaching for API openai_prod" },
  { t: "11:45:22", l: "INFO", m: "Payment successful: PY1 — ۲,۰۰۰,۰۰۰ تومان" },
  { t: "11:32:00", l: "ERROR", m: "MetaTrader sync failed for portfolio P4" },
  { t: "11:20:15", l: "INFO", m: "User session started: ahmad@domain.com" },
  { t: "11:15:44", l: "WARN", m: "API key expiry approaching: binance_prod" },
  { t: "11:02:33", l: "INFO", m: "News article published: بروزرسانی سیستم" },
  { t: "10:58:12", l: "ERROR", m: "Database connection timeout on replica-2" },
  { t: "10:45:00", l: "INFO", m: "Backup completed successfully" },
  { t: "10:30:22", l: "INFO", m: "New subscription activated: PRO plan" },
  { t: "10:22:11", l: "WARN", m: "Memory usage at 85% on worker-3" },
  { t: "10:10:05", l: "INFO", m: "Scheduled job completed: daily-report" },
  { t: "09:55:30", l: "ERROR", m: "Email delivery failed to test@domain.com" },
  { t: "09:40:18", l: "INFO", m: "Cache cleared for product catalog" },
  { t: "09:30:00", l: "INFO", m: "System health check passed" },
  { t: "09:15:42", l: "WARN", m: "Rate limit approaching for API deepseek_prod" },
  { t: "09:00:10", l: "INFO", m: "Server restart completed successfully" },
  { t: "08:45:55", l: "INFO", m: "New API key generated for admin" },
  { t: "08:30:20", l: "ERROR", m: "WebSocket connection dropped for dashboard" },
];

export const Route = createFileRoute("/app/admin/logs")({
  component: AdminLogsPage,
});

function AdminLogsPage() {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(ALL_LOGS.length / LOGS_PAGE_SIZE);
  const paged = ALL_LOGS.slice(page * LOGS_PAGE_SIZE, (page + 1) * LOGS_PAGE_SIZE);

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {ALL_LOGS.length.toLocaleString("fa-IR")} رویداد
        </span>
      </div>
      <div className="mt-4 space-y-2 font-mono text-xs">
        {paged.map((log, i) => (
          <div key={i} className="flex items-center gap-3 rounded border border-border bg-background/50 p-2.5">
            <span className="text-muted-foreground tabular">{log.t}</span>
            <Badge variant="outline" className={
              log.l === "ERROR" ? "border-destructive/40 bg-destructive/10 text-destructive" :
              log.l === "WARN" ? "border-accent/40 bg-accent/10 text-accent" :
              "border-primary/40 bg-primary/10 text-primary"
            }>{log.l}</Badge>
            <span className="flex-1 truncate">{log.m}</span>
            <Activity className="h-3 w-3 text-muted-foreground" />
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(p)}
            >
              {(p + 1).toLocaleString("fa-IR")}
            </Button>
          ))}
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
