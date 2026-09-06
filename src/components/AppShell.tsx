import { Link, useLocation } from "@tanstack/react-router";
import { LineChart, Plus, Menu, PanelRightClose, PanelRightOpen } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { GuideTour } from "@/components/GuideTour";
import { ThemeToggle } from "@/lib/theme";
import { fullName, useCurrentUser, useHasPortfolio, useLocalState } from "@/lib/app-state";
import { useProfile, useRole } from "@/lib/api";

import { UserBlock } from "@/components/layout/UserBlock";
import { NavList } from "@/components/layout/NavList";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { PortfolioGate } from "@/components/layout/PortfolioGate";

export function AppShell({ children, title, subtitle, actions }: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useLocalState<boolean>("tj:sidebar-collapsed", false);
  const location = useLocation();
  const [hasPortfolio, , onboardingReady] = useHasPortfolio();
  const user = useCurrentUser();
  const profile = useProfile();
  const initials = fullName(user)
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join(".") || "کاربر";
  const roleData = useRole();
  const roleLoaded = roleData !== null;
  const isAdminUser = roleData?.effective === "admin";
  const locked =
    roleLoaded && !isAdminUser && onboardingReady && !hasPortfolio && location.pathname !== "/app/portfolios";

  return (
    <div className="min-h-screen w-full max-w-full bg-background text-foreground" style={{overflowX:"hidden",maxWidth:"100vw"}}>
      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden shrink-0 border-l border-sidebar-border bg-sidebar transition-all duration-200 lg:flex lg:flex-col",
            collapsed ? "w-[74px]" : "w-64",
          )}
        >
          <div className={cn("flex h-16 items-center gap-2 border-b border-sidebar-border px-5", collapsed && "justify-center px-2")}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]">
              <LineChart className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold">Dlea AI</span>
                <span className="text-[10px] text-muted-foreground">ژورنال هوشمند معامله‌گران</span>
              </div>
            )}
          </div>

          <div className={cn("border-b border-sidebar-border p-3", collapsed && "flex justify-center px-2")}>
            {collapsed ? (
              <Avatar className="h-9 w-9">
                <AvatarImage src={profile?.avatar ?? undefined} alt="avatar" className="object-cover" />
                <AvatarFallback className="bg-primary/20 text-xs font-bold text-primary">{initials}</AvatarFallback>
              </Avatar>
            ) : (
              <UserBlock />
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-3">
            {!collapsed && (
              <div className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                منو
              </div>
            )}
            <NavList collapsed={collapsed} />
          </nav>

          <div className="border-t border-sidebar-border p-3">
            <Button
              variant="outline"
              size="sm"
              className={cn("w-full gap-2 border-sidebar-border bg-sidebar-accent/40", collapsed && "px-0")}
              aria-label={collapsed ? "باز کردن منو" : "جمع کردن منو"}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <PanelRightOpen className="h-4 w-4" /> : <><PanelRightClose className="h-4 w-4" /> جمع کردن منو</>}
            </Button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col w-full overflow-x-hidden">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 overflow-hidden border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-8">
            {/* Mobile/Tablet menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 border-border bg-secondary/60 lg:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 border-l border-sidebar-border bg-sidebar p-0">
                <SheetTitle className="sr-only">منوی اصلی</SheetTitle>
                <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground shadow-[var(--shadow-glow)]">
                    <LineChart className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold">Dlea AI</span>
                    <span className="text-[10px] text-muted-foreground">ژورنال هوشمند معامله‌گران</span>
                  </div>
                </div>
                <div className="border-b border-sidebar-border p-3">
                  <UserBlock />
                </div>
                <nav className="flex-1 overflow-y-auto p-3">
                  <div className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    منو
                  </div>
                  <NavList onNavigate={() => setMobileOpen(false)} />
                </nav>
              </SheetContent>
            </Sheet>

            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
              <div className="min-w-0 max-w-md flex-1">
                <GlobalSearch />
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <ThemeToggle />
                <GuideTour path={location.pathname} locked={locked} />
                <NotificationsMenu />
                {roleLoaded && !isAdminUser && (
                  <>
                    <Link to="/app/trades/new" className="hidden sm:block">
                      <Button size="sm" className="h-10 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                        معامله جدید
                      </Button>
                    </Link>
                    <Link to="/app/trades/new" className="sm:hidden">
                      <Button size="icon" className="h-10 w-10 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page header */}
          <div className="overflow-hidden border-b border-border bg-background/40 px-4 py-6 md:px-8">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 overflow-hidden sm:flex sm:items-center sm:justify-between">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold tracking-tight">{locked ? "شروع کار" : title}</h1>
                {subtitle && !locked && (
                  <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                )}
              </div>
              {actions && !locked && <div className="shrink-0">{actions}</div>}
            </div>
          </div>

          <main className="flex-1 p-4 md:p-8">
            {locked ? <PortfolioGate /> : children}
          </main>

        </div>
      </div>
    </div>
  );
}
