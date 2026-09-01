import { f as require_jsx_runtime } from "../_libs/@radix-ui/react-avatar+[...].mjs";
import { n as LegalSection, t as LegalPage } from "./LegalPage-CBj8eOLf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/privacy-BvzEeQA8.js
var import_jsx_runtime = require_jsx_runtime();
var sections = [
	{
		title: "داده‌هایی که ذخیره می‌کنیم",
		body: "نام، ایمیل، اطلاعات اشتراک و محتوایی که خودتان وارد می‌کنید: معاملات، ژورنال‌ها، اسکرین‌شات‌ها و اهداف."
	},
	{
		title: "اتصال متاتریدر",
		body: "برای همگام‌سازی معاملات فقط از رمز Investor (فقط خواندنی) استفاده می‌شود. رمز اصلی حساب بروکر شما هرگز درخواست و ذخیره نمی‌شود."
	},
	{
		title: "استفاده از داده",
		body: "داده‌ها صرفاً برای نمایش آمار شخصی شما و تولید گزارش‌های مربی هوشمند به کار می‌رود. داده‌های شما به اشخاص ثالث فروخته نمی‌شود."
	},
	{
		title: "نگهداری و امنیت",
		body: "ارتباطات روی HTTPS رمزنگاری می‌شود و دسترسی به داده‌ها محدود به حساب خود شماست."
	},
	{
		title: "حذف حساب",
		body: "هر زمان می‌توانید از بخش تنظیمات درخواست حذف حساب بدهید؛ پس از حذف، محتوای ژورنال و معاملات شما پاک می‌شود."
	},
	{
		title: "کوکی‌ها",
		body: "تنها از کوکی‌ها و حافظه محلی برای نگه‌داشتن نشست ورود و ترجیحاتی مثل تم روشن/تیره استفاده می‌کنیم."
	}
];
function PrivacyPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegalPage, {
		title: "سیاست حریم خصوصی",
		intro: "داده‌های معاملاتی شما شخصی و محرمانه است. در این صفحه شفاف توضیح می‌دهیم چه چیزی ذخیره می‌شود و چگونه از آن محافظت می‌کنیم.",
		children: sections.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LegalSection, {
			title: s.title,
			body: s.body
		}, s.title))
	});
}
//#endregion
export { PrivacyPage as component };
