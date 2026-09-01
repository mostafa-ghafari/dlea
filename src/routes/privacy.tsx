import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, LegalSection } from "@/components/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "حریم خصوصی | Dlea AI" },
      { name: "description", content: "سیاست حریم خصوصی Dlea AI: چه داده‌هایی جمع‌آوری می‌شود، چگونه نگهداری می‌شود و حقوق شما نسبت به داده‌ها." },
      { property: "og:title", content: "سیاست حریم خصوصی" },
      { property: "og:description", content: "نحوه جمع‌آوری، نگهداری و حذف داده‌های کاربران در Dlea AI." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  { title: "داده‌هایی که ذخیره می‌کنیم", body: "نام، ایمیل، اطلاعات اشتراک و محتوایی که خودتان وارد می‌کنید: معاملات، ژورنال‌ها، اسکرین‌شات‌ها و اهداف." },
  { title: "اتصال متاتریدر", body: "برای همگام‌سازی معاملات فقط از رمز Investor (فقط خواندنی) استفاده می‌شود. رمز اصلی حساب بروکر شما هرگز درخواست و ذخیره نمی‌شود." },
  { title: "استفاده از داده", body: "داده‌ها صرفاً برای نمایش آمار شخصی شما و تولید گزارش‌های مربی هوشمند به کار می‌رود. داده‌های شما به اشخاص ثالث فروخته نمی‌شود." },
  { title: "نگهداری و امنیت", body: "ارتباطات روی HTTPS رمزنگاری می‌شود و دسترسی به داده‌ها محدود به حساب خود شماست." },
  { title: "حذف حساب", body: "هر زمان می‌توانید از بخش تنظیمات درخواست حذف حساب بدهید؛ پس از حذف، محتوای ژورنال و معاملات شما پاک می‌شود." },
  { title: "کوکی‌ها", body: "تنها از کوکی‌ها و حافظه محلی برای نگه‌داشتن نشست ورود و ترجیحاتی مثل تم روشن/تیره استفاده می‌کنیم." },
];

function PrivacyPage() {
  return (
    <LegalPage
      title="سیاست حریم خصوصی"
      intro="داده‌های معاملاتی شما شخصی و محرمانه است. در این صفحه شفاف توضیح می‌دهیم چه چیزی ذخیره می‌شود و چگونه از آن محافظت می‌کنیم."
    >
      {sections.map((s) => (
        <LegalSection key={s.title} title={s.title} body={s.body} />
      ))}
    </LegalPage>
  );
}
