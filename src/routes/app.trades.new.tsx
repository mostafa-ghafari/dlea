import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/trades/new")({
  head: () => ({
    meta: [
      { title: "افزودن معامله | Dlea AI" },
      { name: "description", content: "ایمپورت گزارش متاتریدر یا اتصال خودکار حساب معاملاتی." },
    ],
  }),
  lazy: () => import("../pages/app.trades.new.page").then((m) => ({ component: m.default })),
});
