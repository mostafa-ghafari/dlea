import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { del, fetchAudit, fetchNews, fetchNotifications, fetchTickets, patch, post } from "@/lib/api";
import { fullName, getCurrentUser } from "@/lib/app-state";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type NewsCategory = "تخفیف" | "آپدیت" | "اطلاعیه" | "آموزش";

export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  body: string;
  category: NewsCategory;
  date: string;
  pinned: boolean;
};

export type TicketTopic = "فنی" | "پرداخت" | "حساب کاربری" | "اشتراک" | "سایر";
export type TicketStatus = "باز" | "در حال بررسی" | "پاسخ داده شد" | "بسته";

export type TicketMessage = {
  id: string;
  author: "user" | "admin";
  authorName: string;
  body: string;
  time: string;
  attachments: string[];
};

export type Ticket = {
  id: string;
  subject: string;
  topic: TicketTopic;
  status: TicketStatus;
  user: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
};

export type AppNotification = {
  id: string;
  kind: "news" | "ticket" | "system";
  title: string;
  desc: string;
  time: string;
  link?: string;
  read: boolean;
};

export type AuditEntry = {
  id: string;
  time: string;
  actor: string;
  action: string;
  target: string;
  details: string;
};

/* ------------------------------------------------------------------ */
/* Store                                                               */
/* ------------------------------------------------------------------ */

type Store = {
  news: NewsItem[];
  tickets: Ticket[];
  notifications: AppNotification[];
  audit: AuditEntry[];
  saveNews: (item: NewsItem) => void;
  deleteNews: (id: string) => void;
  createTicket: (input: { subject: string; topic: TicketTopic; body: string; attachments: string[] }) => string;
  replyTicket: (id: string, input: { author: "user" | "admin"; body: string; attachments: string[] }) => void;
  setTicketStatus: (id: string, status: TicketStatus) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  pushNotification: (n: Omit<AppNotification, "id" | "read" | "time"> & { time?: string }) => void;
  logAudit: (entry: Omit<AuditEntry, "id" | "time">) => void;
};

const PlatformContext = createContext<Store | null>(null);

const fa = (n: number) => String(n).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);

function nowStamp() {
  const d = new Date();
  return `${fa(d.getFullYear())}/${fa(d.getMonth() + 1).padStart(2, "۰")}/${fa(d.getDate())} ${fa(d.getHours())}:${String(fa(d.getMinutes())).padStart(2, "۰")}`;
}

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  // hydrate from the Django API
  useEffect(() => {
    let alive = true;
    Promise.all([fetchNews(), fetchTickets(), fetchNotifications(), fetchAudit()])
      .then(([n, t, notif, a]) => {
        if (!alive) return;
        setNews(n);
        setTickets(t);
        setNotifications(notif);
        setAudit(a);
      })
      .catch(() => {
        /* API unavailable — the app keeps running with empty lists */
      });
    return () => {
      alive = false;
    };
  }, []);

  const pushNotification = useCallback<Store["pushNotification"]>((n) => {
    const item: AppNotification = {
      id: `AN-${Date.now()}`,
      read: false,
      time: n.time ?? nowStamp(),
      ...n,
    };
    setNotifications((list) => [item, ...list]);
    void post<AppNotification>("notifications/", {
      kind: item.kind,
      title: item.title,
      desc: item.desc,
      time: isoDate(),
      link: item.link ?? "",
      read: false,
    }).catch(() => {
      /* optimistic write failed — keep local copy */
    });
  }, []);

  const logAudit = useCallback<Store["logAudit"]>((entry) => {
    setAudit((list) => [{ id: `A-${Date.now()}`, time: nowStamp(), ...entry }, ...list]);
    void post<AuditEntry>("audit/", entry).catch(() => {
      /* optimistic write failed */
    });
  }, []);

  const value = useMemo<Store>(
    () => ({
      news,
      tickets,
      notifications,
      audit,
      saveNews: (item) => {
        setNews((list) =>
          list.some((n) => n.id === item.id) ? list.map((n) => (n.id === item.id ? item : n)) : [item, ...list],
        );
        void post<NewsItem>("news/", {
          title: item.title,
          summary: item.summary,
          body: item.body,
          category: item.category,
          date: isoDate(),
          pinned: item.pinned,
        }).catch(() => {
          /* optimistic write failed */
        });
      },
      deleteNews: (id) => {
        setNews((list) => list.filter((n) => n.id !== id));
        void del(`news/${id}/`).catch(() => {
          /* optimistic delete failed */
        });
      },
      createTicket: ({ subject, topic, body, attachments }) => {
        const id = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
        const stamp = nowStamp();
        const current = getCurrentUser();
        const authorName = fullName(current);
        const ticket: Ticket = {
          id,
          subject,
          topic,
          status: "باز",
          user: authorName,
          email: current?.email ?? "",
          createdAt: stamp,
          updatedAt: stamp,
          messages: [{ id: `M-${Date.now()}`, author: "user", authorName, body, time: stamp, attachments }],
        };
        setTickets((list) => [ticket, ...list]);
        void post<Ticket>("tickets/", {
          subject,
          topic,
          status: "باز",
          user: ticket.user,
          email: ticket.email,
        })
          .then((created) => {
            if (created?.id) {
              void post(`tickets/${created.id}/reply/`, { author: "user", body, attachments }).catch(() => {});
            }
          })
          .catch(() => {
            /* optimistic write failed */
          });
        return id;
      },
      replyTicket: (id, { author, body, attachments }) => {
        const stamp = nowStamp();
        setTickets((list) =>
          list.map((t) =>
            t.id === id
              ? {
                  ...t,
                  updatedAt: stamp,
                  status: author === "admin" ? "پاسخ داده شد" : t.status === "بسته" ? "باز" : t.status,
                  messages: [
                    ...t.messages,
                    {
                      id: `M-${Date.now()}`,
                      author,
                      authorName: author === "admin" ? "پشتیبانی" : fullName(getCurrentUser()),
                      body,
                      time: stamp,
                      attachments,
                    },
                  ],
                }
              : t,
          ),
        );
        void post(`tickets/${id}/reply/`, { author, body, attachments }).catch(() => {
          /* optimistic write failed */
        });
        if (author === "admin") {
          pushNotification({
            kind: "ticket",
            title: `پاسخ جدید برای تیکت ${id}`,
            desc: body.slice(0, 70),
            link: "/app/support",
          });
        }
      },
      setTicketStatus: (id, status) => {
        setTickets((list) => list.map((t) => (t.id === id ? { ...t, status, updatedAt: nowStamp() } : t)));
        void post(`tickets/${id}/set_status/`, { status }).catch(() => {
          /* optimistic write failed */
        });
      },
      markAllRead: () => {
        setNotifications((list) => list.map((n) => ({ ...n, read: true })));
        void post("notifications/read_all/").catch(() => {
          /* optimistic write failed */
        });
      },
      markRead: (id) => {
        setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
        void patch(`notifications/${id}/`, { read: true }).catch(() => {
          /* optimistic write failed */
        });
      },
      pushNotification,
      logAudit,
    }),
    [news, tickets, notifications, audit, pushNotification, logAudit],
  );

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) throw new Error("usePlatform must be used inside PlatformProvider");
  return ctx;
}
