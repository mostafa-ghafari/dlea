import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/portfolios")({
  head: () => ({
    meta: [
      { title: "پرتفولیوها | Dlea AI" },
      { name: "description", content: "مدیریت حساب‌های معاملاتی و پرتفولیوها." },
    ],
  }),
  lazy: () => import("../pages/app.portfolios.page").then((m) => ({ component: m.default })),
});
