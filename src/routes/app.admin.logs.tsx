import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchLogs, useApi } from "@/lib/api";
import type { AdminLogEntry } from "@/lib/api";

const LOGS_PAGE_SIZE = 8;

export const Route = createFileRoute("/app/admin/logs")({
  component: AdminLogsPage,
});

function AdminLogsPage() {
  const logsApi = useApi(fetchLogs);
  const logs: AdminLogEntry[] = logsApi.data ?? [];
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(logs.length / LOGS_PAGE_SIZE);
  const paged = logs.slice(page * LOGS_PAGE_SIZE, (page + 1) * LOGS_PAGE_SIZE);

  if (logsApi.loading) {
    return (
      <div className="card-surface p-5 text-center text-sm text-muted-foreground">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {logs.length.toLocaleString("fa-IR")} رویداد
        </span>
      </div>
      <div className="mt-4 space-y-2 font-mono text-xs">
        {paged.map((log, i) => (
          <div
            key={log.id ?? i}
            className="flex items-center gap-3 rounded border border-border bg-background/50 p-2.5"
          >
            <span className="text-muted-foreground tabular">{log.t}</span>
            <Badge
              variant="outline"
              className={
                log.l === "ERROR"
                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                  : log.l === "WARN"
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-primary/40 bg-primary/10 text-primary"
              }
            >
              {log.l}
            </Badge>
            <span className="flex-1 truncate">{log.m}</span>
            <Activity className="h-3 w-3 text-muted-foreground" />
          </div>
        ))}
        {logs.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            هیچ رویدادی ثبت نشده است.
          </div>
        )}
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
