import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Lock, CreditCard } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlanLimits, type PlanFeature } from "@/lib/api";
import { useRole } from "@/lib/api";
import { nav } from "./nav";

export function NavList({ onNavigate, collapsed = false }: { onNavigate?: () => void; collapsed?: boolean }) {
  const location = useLocation();
  const limits = usePlanLimits();
  const roleData = useRole();
  const roleLoaded = roleData !== null;
  const isAdmin = roleData?.effective === "admin";
  const [lockedFeature, setLockedFeature] = useState<PlanFeature | null>(null);
  const navigate = useNavigate();

  const regularItems = !roleLoaded ? [] : (isAdmin ? [] : nav.filter((item) => !item.admin));
  const adminItems = nav.filter((item) => item.admin);

  function isActive(item: typeof nav[number]) {
    return location.pathname === item.to;
  }

  return (
    <>
    <ul className="space-y-1">
      {regularItems.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        const locked = item.feature !== null && !limits.features.includes(item.feature);
        return (
          <li key={item.to}>
            {locked ? (
              <button
                onClick={() => setLockedFeature(item.feature!)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  collapsed && "justify-center px-0",
                  "text-sidebar-foreground/40 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground/60",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0 opacity-50")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {!collapsed && <Lock className="mr-auto h-3 w-3 text-amber-500" />}
              </button>
            ) : (
              <Link
                to={item.to}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {active && !collapsed && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-primary" />}
              </Link>
            )}
          </li>
        );
      })}
    </ul>

    {/* Admin section */}
    {isAdmin && adminItems.length > 0 && (
      <>
        {!collapsed && (
          <div className="mt-4 mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            مدیریت
          </div>
        )}
        {collapsed && <div className="my-2 mx-3 border-t border-sidebar-border" />}
        <ul className="space-y-1">
          {adminItems.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <button
                  onClick={() => {
                    navigate({ to: item.to });
                    onNavigate?.();
                  }}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {active && !collapsed && <span className="mr-auto h-1.5 w-1.5 rounded-full bg-primary" />}
                </button>
              </li>
            );
          })}
        </ul>
      </>
    )}

    {/* Upgrade dialog */}
    <Dialog open={lockedFeature !== null} onOpenChange={() => setLockedFeature(null)}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-500" /> این بخش قفل است
          </DialogTitle>
          <DialogDescription>
            {lockedFeature === "ai-coach" && "مربی هوشمند فقط در پلن Pro و بالاتر فعال است."}
            {lockedFeature === "risk" && "مدیریت ریسک فقط در پلن Pro و بالاتر فعال است."}
            {lockedFeature === "mt-connection" && "اتصال MetaTrader فقط در پلن Pro و بالاتر فعال است."}
            {lockedFeature === "reports" && "گزارش‌های پیشرفته فقط در پلن Pro و بالاتر فعال است."}
            {lockedFeature === "psychology" && "تحلیل روانشناسی فقط در پلن Pro Max فعال است."}
            {!"ai-coach risk mt-connection reports psychology".includes(lockedFeature ?? "") &&
              `این بخش نیاز به ارتقای پلن دارد.`}
          </DialogDescription>
        </DialogHeader>
        <Button className="w-full bg-primary text-primary-foreground" onClick={() => { setLockedFeature(null); navigate({ to: "/app/billing" }); }}>
          <CreditCard className="ml-2 h-4 w-4" /> ارتقای پلن
        </Button>
      </DialogContent>
    </Dialog>
    </>
  );
}
