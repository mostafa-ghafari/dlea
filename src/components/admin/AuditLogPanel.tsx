import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePlatform } from "@/lib/platform-store";
import { AdminPagination } from "./shared";

const AUDIT_PAGE_SIZE = 8;

export function AuditLogPanel() {
  const { audit } = usePlatform();
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(audit.length / AUDIT_PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paged = audit.slice(safePage * AUDIT_PAGE_SIZE, (safePage + 1) * AUDIT_PAGE_SIZE);

  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldAlert className="h-4 w-4 text-accent" /> Audit Log — تغییرات حساس
        </div>
        <span className="text-xs text-muted-foreground">
          {audit.length.toLocaleString("fa-IR")} رکورد
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {paged.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background/50 p-3 text-sm">
            <span className="text-xs text-muted-foreground tabular">{a.time}</span>
            <Badge variant="outline" className="border-accent/40 bg-accent/10 text-accent">{a.action}</Badge>
            <span className="font-medium">{a.target}</span>
            <span className="text-xs text-muted-foreground">{a.details}</span>
            <span className="mr-auto text-xs text-muted-foreground">{a.actor}</span>
          </div>
        ))}
        {audit.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">رویدادی ثبت نشده است.</div>}
      </div>
      {totalPages > 1 && (
        <AdminPagination page={safePage} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
