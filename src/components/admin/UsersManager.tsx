import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  MoreVertical,
  Activity,
  Eye,
  Trash2,
  Mail,
  ShieldAlert,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteUser, fetchPayments, fetchUsers, updateUser, type Payment } from "@/lib/api";
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
} from "@/components/ui/dialog";
import { useAdminContext, TableSearch } from "./shared";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  role?: string;
  joined: string;
};

const PLAN_OPTIONS = ["رایگان", "Pro", "Pro Max", "VIP"];
const ROLE_OPTIONS = [
  { value: "trader", label: "تریدر" },
  { value: "professional", label: "حرفه‌ای" },
  { value: "master", label: "استاد" },
  { value: "admin", label: "مدیر" },
  { value: "vip", label: "ویژه" },
  { value: "trader-vip", label: "تریدر ویژه" },
  { value: "professional-vip", label: "حرفه‌ای ویژه" },
  { value: "master-vip", label: "استاد ویژه" },
];

export function UsersManager() {
  const { userQuery, setUserQuery } = useAdminContext();
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [planTarget, setPlanTarget] = useState<AdminUser | null>(null);
  const [userPage, setUserPage] = useState(1);
  const USER_PAGE_SIZE = 20;
  const userTotalPages = Math.max(1, Math.ceil(totalCount / USER_PAGE_SIZE));

  useEffect(() => { setUserPage(1); }, [userQuery]);

  useEffect(() => {
    let alive = true;
    fetchUsers(userPage, USER_PAGE_SIZE, userQuery)
      .then((page) => { if (alive) { setRows(page.results); setTotalCount(page.count); } })
      .catch(() => alive && toast.error("دریافت کاربران از سرور ممکن نشد"));
    return () => { alive = false; };
  }, [userPage, userQuery]);
  const [newPlan, setNewPlan] = useState("Pro");
  const [details, setDetails] = useState<AdminUser | null>(null);
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null);
  const [emailTarget, setEmailTarget] = useState<AdminUser | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState("trader");
  const [userPaymentsList, setUserPaymentsList] = useState<Payment[]>([]);

  useEffect(() => {
    let alive = true;
    fetchPayments()
      .then((list) => alive && setUserPaymentsList(list))
      .catch(() => alive && toast.error("دریافت پرداخت‌ها از سرور ممکن نشد"));
    return () => { alive = false; };
  }, []);

  const userSafePage = Math.min(userPage, userTotalPages);
  const userPayments = (name: string) => userPaymentsList.filter((p) => p.user === name);

  async function applyPlan() {
    if (!planTarget) return;
    try {
      const updated = await updateUser(planTarget.id, { plan: newPlan });
      setRows((list) => list.map((u) => (u.id === planTarget.id ? updated : u)));
      toast.success(`پلن ${planTarget.name} بدون پرداخت به ${newPlan} تغییر کرد`);
      setPlanTarget(null);
    } catch (err) {
      toast.error(`تغییر پلن ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function applyEmail() {
    if (!emailTarget) return;
    const value = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("ایمیل معتبر نیست");
      return;
    }
    try {
      const updated = await updateUser(emailTarget.id, { email: value });
      setRows((list) => list.map((u) => (u.id === emailTarget.id ? updated : u)));
      toast.success("ایمیل کاربر تغییر کرد و در Audit Log ثبت شد");
      setEmailTarget(null);
    } catch (err) {
      toast.error(`تغییر ایمیل ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function applyRole() {
    if (!roleTarget) return;
    try {
      const updated = await updateUser(roleTarget.id, { role: newRole });
      setRows((list) => list.map((u) => (u.id === roleTarget.id ? updated : u)));
      const rl = ROLE_OPTIONS.find((r) => r.value === newRole)?.label ?? newRole;
      toast.success(`نقش ${roleTarget.name} به «${rl}» تغییر کرد`);
      setRoleTarget(null);
    } catch (err) {
      toast.error(`تغییر نقش ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function removeUser() {
    if (!removeTarget) return;
    try {
      await deleteUser(removeTarget.id);
      setRows((list) => list.filter((u) => u.id !== removeTarget.id));
      toast.success(`کاربر ${removeTarget.name} حذف شد`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error(`حذف کاربر ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  async function toggleStatus(u: AdminUser) {
    const next = u.status === "فعال" ? "غیرفعال" : "فعال";
    try {
      const updated = await updateUser(u.id, { status: next });
      setRows((list) => list.map((r) => (r.id === u.id ? updated : r)));
      toast.success(`وضعیت ${u.name} به ${next} تغییر کرد`);
    } catch (err) {
      toast.error(`تغییر وضعیت ناموفق بود: ${err instanceof Error ? err.message : err}`);
    }
  }

  return (
    <div className="card-surface p-5">
      <TableSearch value={userQuery} onChange={setUserQuery} placeholder="جستجوی کاربر، ایمیل، پلن..." />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-border text-xs text-muted-foreground">
              <th className="py-3 text-right">کاربر</th>
              <th className="py-3 text-right">ایمیل</th>
              <th className="py-3 text-right">نقش</th>
              <th className="py-3 text-right">پلن</th>
              <th className="py-3 text-right">وضعیت</th>
              <th className="py-3 text-right">تاریخ عضویت</th>
              <th className="py-3 text-right">تراکنش‌ها</th>
              <th className="py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30">
                <td className="py-3 font-medium">{u.name}</td>
                <td className="py-3 text-muted-foreground">{u.email}</td>
                <td className="py-3">
                  <Badge variant="outline" className={
                    u.role === "vip" || u.role?.includes("vip") ? "border-accent/40 bg-accent/10 text-accent" :
                    u.role === "admin" ? "border-destructive/40 bg-destructive/10 text-destructive" :
                    u.role === "master" || u.role === "master-vip" ? "border-primary/40 bg-primary/10 text-primary" :
                    u.role === "professional" || u.role === "professional-vip" ? "border-secondary-foreground/30 bg-secondary/20" :
                    ""
                  }>
                    {ROLE_OPTIONS.find((r) => r.value === u.role)?.label ?? u.role ?? "تریدر"}
                  </Badge>
                </td>
                <td className="py-3">
                  <Badge variant="outline" className={u.plan === "Pro Max" ? "border-primary/40 bg-primary/10 text-primary" : ""}>
                    {u.plan}
                  </Badge>
                </td>
                <td className="py-3">
                  <Badge
                    variant="outline"
                    className={u.status === "فعال" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}
                  >
                    {u.status}
                  </Badge>
                </td>
                <td className="py-3 text-xs text-muted-foreground tabular">{u.joined}</td>
                <td className="py-3 text-xs tabular text-muted-foreground">{userPayments(u.name).length} مورد</td>
                <td className="py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem onSelect={() => setDetails(u)}>
                        <Eye className="ml-2 h-4 w-4" /> جزئیات و ریز تراکنش‌ها
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => { setNewPlan(u.plan); setPlanTarget(u); }}>
                        <CreditCard className="ml-2 h-4 w-4" /> تغییر پلن بدون پرداخت
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => { setNewEmail(u.email); setEmailTarget(u); }}>
                        <Mail className="ml-2 h-4 w-4" /> تغییر ایمیل کاربر
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => { setNewRole(u.role ?? "trader"); setRoleTarget(u); }}>
                        <ShieldAlert className="ml-2 h-4 w-4" /> تغییر نقش
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => toggleStatus(u)}>
                        <Activity className="ml-2 h-4 w-4" /> {u.status === "فعال" ? "غیرفعال کردن" : "فعال کردن"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setRemoveTarget(u)}>
                        <Trash2 className="ml-2 h-4 w-4" /> حذف کاربر
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">کاربری پیدا نشد.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalCount > USER_PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            نمایش {(userSafePage - 1) * USER_PAGE_SIZE + 1}–{Math.min(userSafePage * USER_PAGE_SIZE, totalCount)} از {totalCount} کاربر
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" disabled={userSafePage <= 1} onClick={() => setUserPage((p) => Math.max(1, p - 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(userTotalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (userTotalPages <= 7) pageNum = i + 1;
              else if (userSafePage <= 4) pageNum = i + 1;
              else if (userSafePage >= userTotalPages - 3) pageNum = userTotalPages - 6 + i;
              else pageNum = userSafePage - 3 + i;
              return (
                <Button key={pageNum} variant={pageNum === userSafePage ? "default" : "outline"} size="sm"
                  className={pageNum === userSafePage ? "bg-primary text-primary-foreground" : ""}
                  onClick={() => setUserPage(pageNum)}>
                  {pageNum}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" disabled={userSafePage >= userTotalPages} onClick={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Change email */}
      <Dialog open={emailTarget !== null} onOpenChange={(o) => !o && setEmailTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر ایمیل {emailTarget?.name}</DialogTitle>
            <DialogDescription>تغییر ایمیل فقط توسط مدیر ممکن است و به‌صورت خودکار در Audit Log ثبت می‌شود.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label>ایمیل جدید</Label>
            <Input dir="ltr" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-secondary/60 text-left" />
          </div>
          <DialogFooter className="mt-6">
            <DialogClose asChild><Button type="button" variant="outline">انصراف</Button></DialogClose>
            <Button onClick={applyEmail} className="bg-primary text-primary-foreground hover:bg-primary/90">ثبت ایمیل جدید</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change role */}
      <Dialog open={roleTarget !== null} onOpenChange={(o) => !o && setRoleTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر نقش {roleTarget?.name}</DialogTitle>
            <DialogDescription>نقش کاربر را انتخاب کنید.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label>نقش جدید</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (<SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-6">
            <DialogClose asChild><Button type="button" variant="outline">انصراف</Button></DialogClose>
            <Button onClick={applyRole} className="bg-primary text-primary-foreground hover:bg-primary/90">اعمال نقش</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change plan */}
      <Dialog open={planTarget !== null} onOpenChange={(o) => !o && setPlanTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر پلن {planTarget?.name}</DialogTitle>
            <DialogDescription>پلن به‌صورت دستی و بدون نیاز به پرداخت اعمال می‌شود.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            <Label>پلن جدید</Label>
            <Select value={newPlan} onValueChange={setNewPlan}>
              <SelectTrigger className="bg-secondary/60"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="mt-6">
            <DialogClose asChild><Button type="button" variant="outline">انصراف</Button></DialogClose>
            <Button onClick={applyPlan} className="bg-primary text-primary-foreground hover:bg-primary/90">اعمال پلن</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details + transactions */}
      <Dialog open={details !== null} onOpenChange={(o) => !o && setDetails(null)}>
        <DialogContent className="max-w-2xl">
          {details && (
            <>
              <DialogHeader>
                <DialogTitle>{details.name}</DialogTitle>
                <DialogDescription>{details.email}</DialogDescription>
              </DialogHeader>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">پلن</div>
                  <div className="mt-1 font-medium">{details.plan}</div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">وضعیت</div>
                  <div className="mt-1 font-medium">{details.status}</div>
                </div>
                <div className="rounded-lg border border-border bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">عضویت</div>
                  <div className="mt-1 font-medium tabular">{details.joined}</div>
                </div>
              </div>
              <div className="mt-5">
                <h4 className="text-sm font-semibold">ریز تراکنش‌ها</h4>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs text-muted-foreground">
                        <th className="py-2 text-right">شناسه</th>
                        <th className="py-2 text-right">پلن</th>
                        <th className="py-2 text-right">مبلغ</th>
                        <th className="py-2 text-right">تاریخ</th>
                        <th className="py-2 text-right">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userPayments(details.name).map((p) => (
                        <tr key={p.id} className="border-b border-border/50 last:border-0">
                          <td className="py-2 text-xs tabular text-muted-foreground">{p.id}</td>
                          <td className="py-2">{p.plan}</td>
                          <td className="py-2 tabular">{p.amount}</td>
                          <td className="py-2 text-xs tabular text-muted-foreground">{p.date}</td>
                          <td className="py-2">
                            <Badge variant="outline" className={p.status === "موفق" ? "border-primary/40 bg-primary/10 text-primary" : "border-destructive/40 bg-destructive/10 text-destructive"}>{p.status}</Badge>
                          </td>
                        </tr>
                      ))}
                      {userPayments(details.name).length === 0 && (
                        <tr><td colSpan={5} className="py-6 text-center text-xs text-muted-foreground">تراکنشی ثبت نشده است.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={removeTarget !== null} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف کاربر</DialogTitle>
            <DialogDescription>کاربر «{removeTarget?.name}» و تمام داده‌هایش حذف می‌شود. این عمل قابل بازگشت نیست.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6">
            <DialogClose asChild><Button type="button" variant="outline">انصراف</Button></DialogClose>
            <Button variant="destructive" onClick={removeUser}>حذف قطعی</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
