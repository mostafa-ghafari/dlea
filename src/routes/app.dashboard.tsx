import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/dashboard")({
  head: () => ({
    meta: [
      { title: "داشبورد | Dlea AI" },
      { name: "description", content: "داشبورد جامع معاملات با نمودارها و آمار کلیدی." },
    ],
  }),
  lazy: () => import("../pages/app.dashboard.page").then((m) => ({ component: m.default })),
});
