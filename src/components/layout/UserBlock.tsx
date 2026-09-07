import { Link } from "@tanstack/react-router";
import {
  ChevronDown,
  CreditCard,
  Settings,
  Wallet,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fullName, ONBOARDING_KEY, useCurrentUser } from "@/lib/app-state";
import { useProfile, useRole, useSubscription, ROLE_NAMES } from "@/lib/api";

export function UserBlock({ compact = false }: { compact?: boolean }) {
  const user = useCurrentUser();
  const profile = useProfile();
  const name = fullName(user);
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0])
      .slice(0, 2)
      .join(".") || "کاربر";
  const subscription = useSubscription();
  const roleData = useRole();
  const roleKey = roleData?.effective ?? "trader";
  const roleName = ROLE_NAMES[roleKey] ?? "تریدر";
  const daysLeft = subscription?.daysLeft ?? 0;
  const totalDays = subscription?.totalDays ?? 1;
  const isAdmin = roleData?.effective === "admin";
  const planName = isAdmin ? null : (subscription?.plan ?? "رایگان");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2.5 text-right transition-colors hover:bg-sidebar-accent/70",
            compact &&
              "border-0 bg-transparent p-1.5 hover:bg-sidebar-accent/40",
          )}
        >
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={profile?.avatar ?? undefined}
              alt={name}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{name}</div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1">
              {planName && (
                <Badge
                  variant="outline"
                  className={cn(
                    "h-4 px-1.5 text-[10px]",
                    subscription
                      ? "border-primary/40 bg-primary/10 text-primary"
                      : "border-border bg-secondary/60 text-muted-foreground",
                  )}
                >
                  {planName}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "h-4 border-accent/40 bg-accent/10 px-1.5 text-[10px] text-accent",
                  isAdmin && "border-primary/40 bg-primary/10 text-primary",
                )}
              >
                {isAdmin ? "مدیر" : roleName}
              </Badge>
              {!isAdmin && subscription && (
                <Badge
                  variant="outline"
                  className="h-4 border-border bg-secondary/60 px-1.5 text-[10px] text-muted-foreground tabular"
                >
                  {daysLeft} روز
                </Badge>
              )}
            </div>
          </div>

          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>حساب کاربری</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          {isAdmin ? (
            <div className="text-xs text-muted-foreground">
              حساب مدیریتی — بدون محدودیت
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  اشتراک {subscription?.plan ?? "—"}
                </span>
                <span className="font-medium text-primary tabular">
                  {daysLeft} روز باقی‌مانده
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.round((daysLeft / totalDays) * 100)}%`,
                  }}
                />
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {subscription
                  ? `پایان: ${subscription.endDate}`
                  : "هنوز اشتراکی فعال نیست"}
              </div>
            </>
          )}
        </div>
        <DropdownMenuItem asChild>
          <Link to="/app/billing" className="cursor-pointer">
            <CreditCard className="ml-2 h-4 w-4" /> خرید / تمدید اشتراک
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/settings" className="cursor-pointer">
            <Settings className="ml-2 h-4 w-4" /> تنظیمات پروفایل
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/app/portfolios" className="cursor-pointer">
            <Wallet className="ml-2 h-4 w-4" /> پرتفولیوها
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onSelect={() => {
            localStorage.removeItem("dlea:access");
            localStorage.removeItem("dlea:refresh");
            localStorage.removeItem("dlea:user");
            localStorage.removeItem(ONBOARDING_KEY);
            window.location.href = "/login";
          }}
        >
          <LogOut className="ml-2 h-4 w-4" /> خروج از حساب
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
