import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/journal")({
  head: () => ({
    meta: [
      { title: "ژورنال معاملاتی | Dlea AI" },
      { name: "description", content: "ثبت، ویرایش، گروه‌بندی و فیلتر ژورنال‌های معاملاتی همراه با اسکرین‌شات و ویرایشگر پیشرفته." },
      { property: "og:title", content: "ژورنال معاملاتی" },
      { property: "og:description", content: "ژورنال‌های خود را با ویرایشگر پیشرفته بنویسید، گروه‌بندی و فیلتر کنید." },
    ],
  }),
  lazy: () => import("../pages/app.journal.page").then((m) => ({ component: m.default })),
});
