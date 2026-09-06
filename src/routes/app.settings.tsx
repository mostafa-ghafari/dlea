import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "تنظیمات | Dlea AI" },
      { name: "description", content: "تنظیمات پروفایل، اشتراک و اتصال متاتریدر." },
    ],
  }),
  lazy: () => import("../pages/app.settings.page").then((m) => ({ component: m.default })),
});
