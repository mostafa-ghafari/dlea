import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminContext } from "@/components/admin-context";
import { fetchPayments, type Payment } from "@/lib/api";
import { TableSearch } from "@/components/admin-context";

export const Route = createFileRoute("/app/admin/payments")({
  component: AdminPaymentsPage,
});

function AdminPaymentsPage() {
  const { paymentQuery, setPaymentQuery } = useAdminContext();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payPage, setPayPage] = useState(1);
  const PAY_PAGE_SIZE = 20;

  useEffect(() => {
    let alive = true;
    fetchPayments()
      .then((list) => alive && setPayments(list))
      .catch(() => alive && toast.error("دریافت پرداخت‌ها از سرور ممکن نشد"));
    return () => { alive = false; };
  }, []);

  const filteredPayments = useMemo(() => {
    const q = paymentQuery.trim().toLowerCase();
    if (!q) return payments;
    return payments.filter((p) => [p.id, p.user, p.plan, p.amount, p.status].some((v) => String(v).toLowerCase().includes(q)));
  }, [paymentQuery, payments]);

  useEffect(() => { setPayPage(1); }, [paymentQuery]);
  const payTotalPages = Math.max(1, Math.ceil(filteredPayments.length / PAY_PAGE_SIZE));
  const paySafePage = Math.min(payPage, payTotalPages);
  const paginatedPayments = filteredPayments.slice((paySafePage - 1) * PAY_PAGE_SIZE, paySafePage * PAY_PAGE_SIZE);

  return (
    <div className="card-surface p-5">
      <TableSearch value={paymentQuery} onChange={setPaymentQuery} placeholder="جستجوی پرداخت، کاربر، پلن..." />
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="py-3 text-right">شناسه</th>
            <th className="py-3 text-right">کاربر</th>
            <th className="py-3 text-right">پلن</th>
            <th className="py-3 text-right">مبلغ</th>
            <th className="py-3 text-right">تاریخ</th>
            <th className="py-3 text-right">وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {paginatedPayments.map((p) => (
            <tr key={p.id} className="border-b border-border/50 last:border-0">
              <td className="py-3 text-xs tabular text-muted-foreground">{p.id}</td>
              <td className="py-3">{p.user}</td>
              <td className="py-3">{p.plan}</td>
              <td className="py-3 tabular">{p.amount}</td>
              <td className="py-3 text-xs text-muted-foreground tabular">{p.date}</td>
              <td className="py-3"><Badge variant="outline" className={p.status === "موفق" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}>{p.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredPayments.length > PAY_PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            نمایش {(paySafePage - 1) * PAY_PAGE_SIZE + 1}–{Math.min(paySafePage * PAY_PAGE_SIZE, filteredPayments.length)} از {filteredPayments.length} پرداخت
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={paySafePage <= 1} onClick={() => setPayPage((p) => Math.max(1, p - 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(payTotalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (payTotalPages <= 7) pageNum = i + 1;
              else if (paySafePage <= 4) pageNum = i + 1;
              else if (paySafePage >= payTotalPages - 3) pageNum = payTotalPages - 6 + i;
              else pageNum = paySafePage - 3 + i;
              return (
                <Button key={pageNum} variant={pageNum === paySafePage ? "default" : "outline"} size="sm"
                  className={pageNum === paySafePage ? "bg-primary text-primary-foreground" : ""}
                  onClick={() => setPayPage(pageNum)}>
                  {pageNum}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={paySafePage >= payTotalPages} onClick={() => setPayPage((p) => Math.min(payTotalPages, p + 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
