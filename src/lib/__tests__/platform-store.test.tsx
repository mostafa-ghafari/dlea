import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const api = vi.hoisted(() => ({
  fetchNews: vi.fn(),
  fetchTickets: vi.fn(),
  fetchNotifications: vi.fn(),
  fetchAudit: vi.fn(),
  post: vi.fn(),
  del: vi.fn(),
  patch: vi.fn(),
  invalidateCache: vi.fn(),
}));

vi.mock("@/lib/api", () => api);

import { PlatformProvider, usePlatform } from "@/lib/platform-store";

beforeEach(() => {
  vi.clearAllMocks();
  api.fetchNews.mockResolvedValue([
    {
      id: "1",
      title: "خبر اول",
      summary: "",
      body: "",
      category: "آپدیت",
      date: "۱۴۰۵/۰۶/۰۱",
      pinned: false,
    },
  ]);
  api.fetchTickets.mockResolvedValue([]);
  api.fetchNotifications.mockResolvedValue([]);
  api.fetchAudit.mockResolvedValue([]);
  api.post.mockResolvedValue({ id: "server-1" });
  api.del.mockResolvedValue({ ok: true });
  api.patch.mockResolvedValue({ ok: true });
});

function Probe() {
  const store = usePlatform();
  return (
    <div>
      <span data-testid="news-count">{store.news.length}</span>
      <span data-testid="ticket-count">{store.tickets.length}</span>
      <span data-testid="notif-count">{store.notifications.length}</span>
      <button
        onClick={() =>
          store.createTicket({
            subject: "مشکل",
            topic: "فنی",
            body: "سلام",
            attachments: [],
          })
        }
      >
        new-ticket
      </button>
      <button onClick={() => store.markAllRead()}>read-all</button>
      <button onClick={() => store.dismissAllNotifications()}>
        clear-notifs
      </button>
    </div>
  );
}

function renderStore() {
  return render(
    <PlatformProvider>
      <Probe />
    </PlatformProvider>,
  );
}

describe("PlatformProvider", () => {
  it("hydrates news/tickets/notifications/audit from the API", async () => {
    renderStore();
    await waitFor(() =>
      expect(screen.getByTestId("news-count")).toHaveTextContent("1"),
    );
    expect(screen.getByTestId("ticket-count")).toHaveTextContent("0");
    expect(screen.getByTestId("notif-count")).toHaveTextContent("0");
    expect(api.fetchNews).toHaveBeenCalledTimes(1);
    expect(api.fetchAudit).toHaveBeenCalledTimes(1);
  });

  it("creates a ticket optimistically and posts it", async () => {
    const user = userEvent.setup();
    renderStore();
    await user.click(screen.getByRole("button", { name: "new-ticket" }));
    await waitFor(() =>
      expect(screen.getByTestId("ticket-count")).toHaveTextContent("1"),
    );
    expect(api.post).toHaveBeenCalledWith(
      "tickets/",
      expect.objectContaining({ subject: "مشکل", topic: "فنی", email: "" }),
    );
  });

  it("markAllRead posts the read-all action", async () => {
    api.fetchNotifications.mockResolvedValue([
      {
        id: "n1",
        kind: "system",
        title: "x",
        desc: "y",
        time: "۱۴۰۵",
        link: "",
        read: false,
      },
    ]);
    const user = userEvent.setup();
    renderStore();
    await waitFor(() =>
      expect(screen.getByTestId("notif-count")).toHaveTextContent("1"),
    );
    await user.click(screen.getByRole("button", { name: "read-all" }));
    expect(api.post).toHaveBeenCalledWith("notifications/read_all/");
  });

  it("dismissAllNotifications clears the list and calls the API", async () => {
    api.fetchNotifications.mockResolvedValue([
      {
        id: "n1",
        kind: "system",
        title: "x",
        desc: "y",
        time: "۱۴۰۵",
        link: "",
        read: false,
      },
    ]);
    const user = userEvent.setup();
    renderStore();
    await waitFor(() =>
      expect(screen.getByTestId("notif-count")).toHaveTextContent("1"),
    );
    await user.click(screen.getByRole("button", { name: "clear-notifs" }));
    await waitFor(() =>
      expect(screen.getByTestId("notif-count")).toHaveTextContent("0"),
    );
    expect(api.post).toHaveBeenCalledWith("notifications/delete_all/");
  });
});

describe("usePlatform outside provider", () => {
  it("throws a helpful error", () => {
    function Broken() {
      usePlatform();
      return null;
    }
    // Suppress the expected console error from React
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Broken />)).toThrow(/PlatformProvider/);
    spy.mockRestore();
  });
});
