import { createContext, useContext, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchAdminStats, fetchAdminAiApis, type AdminStats, type AiApiInfo } from "@/lib/api";

// ─── Context ────────────────────────────────────────────────────────

export type AdminCtx = {
  userQuery: string;
  setUserQuery: (v: string) => void;
  paymentQuery: string;
  setPaymentQuery: (v: string) => void;
  stats: AdminStats | null;
  aiApis: { apis: AiApiInfo[]; gemini_configured: boolean } | null;
};

const AdminContext = createContext<AdminCtx>({
  userQuery: "",
  setUserQuery: () => {},
  paymentQuery: "",
  setPaymentQuery: () => {},
  stats: null,
  aiApis: null,
});

export function useAdminContext() {
  return useContext(AdminContext);
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [userQuery, setUserQuery] = useState("");
  const [paymentQuery, setPaymentQuery] = useState("");
  const stats = useAdminStats();
  const aiApis = useAdminAiApis();

  return (
    <AdminContext.Provider value={{ userQuery, setUserQuery, paymentQuery, setPaymentQuery, stats, aiApis }}>
      {children}
    </AdminContext.Provider>
  );
}

// ─── Hooks ──────────────────────────────────────────────────────────

function useAdminStats() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  useEffect(() => {
    fetchAdminStats().then(setStats).catch(() => {});
  }, []);
  return stats;
}

function useAdminAiApis() {
  const [data, setData] = useState<{ apis: AiApiInfo[]; gemini_configured: boolean } | null>(null);
  useEffect(() => { fetchAdminAiApis().then(setData).catch(() => {}); }, []);
  return data;
}

// ─── Helpers ────────────────────────────────────────────────────────

export function formatNum(n: number) {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 }) + " میلیارد";
  if (n >= 1_000_000) return (n / 1_000_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 }) + " میلیون";
  if (n >= 1_000) return (n / 1_000).toLocaleString("fa-IR", { maximumFractionDigits: 1 }) + " هزار";
  return n.toLocaleString("fa-IR");
}

export function TableSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative mb-4 max-w-xs">
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-secondary/60 pr-9" />
    </div>
  );
}

// ─── Shared Pagination ──────────────────────────────────────────────

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const addPage = (p: number) => {
    if (!pages.includes(p)) pages.push(p);
  };

  addPage(0);
  for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) addPage(i);
  addPage(totalPages - 1);

  const withEllipsis: (number | "...")[] = [];
  let prev = -1;
  for (const p of pages) {
    if (typeof p === "number" && prev !== -1 && p - prev > 1) withEllipsis.push("...");
    withEllipsis.push(p);
    if (typeof p === "number") prev = p;
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {withEllipsis.map((p, i) =>
        p === "..." ? (
          <span key={`e${i}`} className="flex h-8 w-8 items-center justify-center text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(p)}
          >
            {(p + 1).toLocaleString("fa-IR")}
          </Button>
        ),
      )}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}
