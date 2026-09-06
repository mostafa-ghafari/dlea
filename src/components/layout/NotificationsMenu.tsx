import { useNavigate } from "@tanstack/react-router";
import { Bell, Megaphone, LifeBuoy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePlatform } from "@/lib/platform-store";

function notifIcon(kind: string) {
  if (kind === "news") return Megaphone;
  if (kind === "ticket") return LifeBuoy;
  return AlertTriangle;
}

export function NotificationsMenu() {
  const { notifications, dismissNotification, dismissAllNotifications } = usePlatform();
  const navigate = useNavigate();
  const all = notifications;
  const unread = all.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative h-10 w-10 border-border bg-secondary/60" aria-label="اعلان‌ها">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>اعلان‌ها</span>
          {all.length > 0 && (
            <button
              onClick={() => {
                dismissAllNotifications();
                toast.success("همه اعلان‌ها حذف شد");
              }}
              className="text-[11px] text-primary hover:underline"
            >
              علامت‌گذاری همه
            </button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {all.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              اعلانی وجود ندارد
            </div>
          )}
          {all.map((n) => {
            const Icon = notifIcon(n.kind);
            return (
              <DropdownMenuItem
                key={n.id}
                className="cursor-pointer items-start gap-3 py-2.5"
                onSelect={() => {
                  dismissNotification(n.id);
                  if (n.link) void navigate({ to: n.link });
                }}
              >
                <div
                  className={cn(
                    "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                    n.kind === "news" && "bg-accent/15 text-accent",
                    n.kind === "ticket" && "bg-primary/15 text-primary",
                    n.kind === "system" && "bg-destructive/15 text-destructive",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <div className="text-xs text-muted-foreground">{n.desc}</div>
                  <div className="mt-1 text-[10px] text-muted-foreground/70">{n.time}</div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
