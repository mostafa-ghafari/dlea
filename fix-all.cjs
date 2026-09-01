const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src', 'routes');

// All files that were modified
const files = fs.readdirSync(routesDir).filter(f => 
  f.startsWith('app.') && f.endsWith('.tsx') && !f.includes('__root') && f !== 'app.tsx'
);

// Mapping of file to AppShell props
const appShellProps = {
  'app.achievements.tsx': { title: 'نشان‌ها', subtitle: 'earned از achievements.length نشان کسب‌شده', hasActions: false },
  'app.admin.tsx': { title: 'پنل مدیریت', subtitle: 'مدیریت کاربران، اشتراک‌ها، APIها و تنظیمات سیستم', hasActions: false },
  'app.ai-coach.tsx': { title: 'مربی هوشمند AI', subtitle: 'تحلیل عملکرد در هر بازه زمانی؛ با تمرکز روی ضعف‌ها و راهکار رفع آن‌ها', hasActions: true },
  'app.billing.tsx': { title: 'اشتراک', subtitle: 'وضعیت اشتراک فعلی، تمدید و ارتقای پلن', hasActions: false },
  'app.calendar.tsx': { title: 'تقویم معاملاتی', subtitle: 'بررسی روزهای معاملاتی', hasActions: true },
  'app.dashboard.tsx': { title: 'داشبورد', subtitle: 'خلاصه عملکرد و آمار کلی حساب شما', hasActions: false },
  'app.goals.tsx': { title: 'اهداف', subtitle: 'تعیین و پیگیری اهداف معاملاتی', hasActions: true },
  'app.journal.tsx': { title: 'ژورنال معاملاتی', subtitle: 'یادداشت و تحلیل معاملات', hasActions: true },
  'app.news.$id.tsx': { title: '', subtitle: '', hasActions: true },
  'app.news.index.tsx': { title: 'اخبار و اطلاعیه‌ها', subtitle: 'آخرین تخفیف‌ها، آپدیت‌ها و اطلاعیه‌های پلتفرم', hasActions: false },
  'app.portfolios.tsx': { title: 'پرتفولیوها', subtitle: 'مدیریت حساب‌های معاملاتی', hasActions: true },
  'app.risk.tsx': { title: 'مدیریت ریسک', subtitle: 'قوانین شخصی خود را تعریف کنید و پایبندی به آن‌ها را بسنجید', hasActions: false },
  'app.settings.tsx': { title: 'تنظیمات', subtitle: 'مدیریت حساب، اشتراک و اتصالات', hasActions: false },
  'app.support.tsx': { title: 'پشتیبانی', subtitle: 'ارسال تیکت و پیگیری درخواست‌ها', hasActions: true },
  'app.trades.$id.tsx': { title: '', subtitle: '', hasActions: true },
  'app.trades.index.tsx': { title: 'معاملات', subtitle: 'لیست تمام معاملات ثبت‌شده', hasActions: true },
  'app.trades.new.tsx': { title: 'افزودن معامله', subtitle: 'ایمپورت گزارش متاتریدر یا اتصال خودکار حساب', hasActions: false },
};

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove useSetTitle import
  content = content.replace(/import \{ useSetTitle \} from ["']@\/lib\/page-context["'];\n/g, '');
  
  // Remove useSetTitle calls (various patterns)
  content = content.replace(/\s*useSetTitle\([^)]*\);\n/g, '\n');
  content = content.replace(/\s*useSetTitle\([^)]*\);/g, '');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('✅ Cleaned useSetTitle from all files');
console.log('⚠️  Now re-adding AppShell wrappers...');

// For each file, we need to add AppShell wrapper back
// Since we don't know the exact original structure, we'll use the script approach
// The key insight: each file's return statement now has bare JSX
// We need to find the return statement and wrap it in <AppShell>...</AppShell>

for (const file of files) {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!appShellProps[file]) continue;
  
  const props = appShellProps[file];
  
  // Find the main component function (not helper functions)
  // Pattern: function XxxPage() { ... return (
  // We need to find the right function
  
  // For most files, the main component is the one that has "return (" with JSX
  // Let's find all return statements and pick the one with JSX content
  
  // Find the import line for AppShell - if missing, add it
  if (!content.includes('import { AppShell } from "@/components/AppShell"')) {
    // Add after the last import line
    const lastImportIdx = content.lastIndexOf('import ');
    const endOfImportLine = content.indexOf('\n', lastImportIdx);
    content = content.slice(0, endOfImportLine + 1) + 
      'import { AppShell } from "@/components/AppShell";\n' +
      content.slice(endOfImportLine + 1);
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('✅ Added AppShell imports');
console.log('\nFiles need manual AppShell wrapper re-addition');
