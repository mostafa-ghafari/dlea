# راهنمای عملیات استقرار (Runbook) — Dlea AI

> **محیط اجرا:** شبکه داخلی همراه اول (MCI)
> **سرور تولید:** `ghafari@37.255.212.55` → `/opt/dlea`
> **آدرس سایت:** https://dlea.piqagram.ir
> **تاریخ آخرین به‌روزرسانی:** سپتامبر ۲۰۲۶

---

## فهرست مطالب

1. [پیش‌نیازها](#۱-پیش‌نیازها)
2. [تست‌های محلی پیش از استقرار (درگاه ۱)](#۲-تست‌های-محلی-پیش-از-استقرار-دروازه-۱)
3. [اجرای CI و تأیید نتایج (دروازه ۲)](#۳-اجرای-ci-و-تأیید-نتایج-دروازه-۲)
4. [بیلد تولید و بسته‌بندی (دروازه ۳)](#۴-بیلد-تولید-و-بسته‌بندی-دروازه-۳)
5. [آپلود و استقرار روی سرور](#۵-آپلود-و-استقرار-روی-سرور)
6. [تست‌های سمت سرور پیش از ریستارت (دروازه ۴)](#۶-تست‌های-سمت-سرور-پیش-از-ریستارت-دروازه-۴)
7. [ریستارت سرویس‌ها و بررسی سلامت (دروازه ۵)](#۷-ریستارت-سرویس‌ها-و-بررسی-سلامت-دروازه-۵)
8. [تست نهایی روی سایت زنده (دروازه ۶)](#۸-تست-نهایی-روی-سایت-زنده-دروازه-۶)
9. [بازگشت به عقب (Rollback)](#۹-بازگشت-به-عقب-rollback)
10. [عیب‌یابی مشکلات رایج](#۱۰-عیب‌یابی-مشکلات-رایج)
11. [چک‌لیست نهایی](#۱۱-چک‌لیست-نهایی)

---

## ۱. پیش‌نیازها

### ۱.۱ نرم‌افزار مورد نیاز روی ماشین محلی

| نرم‌افزار | نسخه حداقل | نحوه بررسی |
|-----------|------------|------------|
| Node.js | ۲۲.۱۲+ | `node -v` |
| npm | ۱۰+ | `npm -v` |
| Python | ۳.۱۲+ | `python3 --v` |
| pip | — | `pip --version` |
| Git | — | `git --v` |
| SSH client | — | `ssh -V` |

### ۱.۲ دسترسی‌ها

- [ ] اتصال به شبکه داخلی MCI فعال است (IP سرور از اینترنت عمومی قابل دسترسی نیست)
- [ ] کلید SSH برای کاربر `ghafari` روی سرور `37.255.212.55` تنظیم شده
- [ ] دسترسی `sudo` برای دستورات nginx در سرور فعال است (`setup-server-sudo.sh` یک‌بار اجرا شده)
- [ ] کد مخزنه (repository) به‌روز است: `git pull origin main`

### ۱.۳ اطلاعات سرور

```
آدرس:      37.255.212.55
کاربر:     ghafari
پوشه اصلی: /opt/dlea
لینک فعلی: /opt/dlea/current
محرک بک‌اند: Gunicorn روی 127.0.0.1:8000 (یا 8002 در حالت deploy.sh)
محرک فرانت‌اند: TanStack Start SSR روی 127.0.0.1:3000
پروکسی:    Nginx روی ۸۰/۴۴۳
دیتابیس:   PostgreSQL 16 ( Container یا محلی )
```

---

## ۲. تست‌های محلی پیش از استقرار (دروازه ۱)

> **هدف:** اطمینان از اینکه کد جدید روی ماشین توسعه‌کننده بدون خطا کار می‌کند.
> **شرط عبور:** تمام تست‌ها سبز، typecheck و lint بدون خطا.

### ۲.۱ نصب وابستگی‌ها

```bash
npm ci
cd backend && pip install -r requirements-dev.txt && cd ..
```

### ۲.۲ تست‌های بک‌اند (۱۷۷ تست)

```bash
cd backend
python manage.py test api --settings config.settings_test
```

خروجی مورد انتظار:
```
Ran 177 tests in X.XXXs

OK
```

### ۲.۳ تست‌های فرانت‌اند (۳۷ تست)

```bash
npx vitest run
```

### ۲.۴ بررسی TypeCheck

```bash
npx tsc --noEmit
```

### ۲.۵ بررسی Lint

```bash
npm run lint
```

### ۲.۶ تست‌های E2E (Playwright)

```bash
npm run test:e2e
```

> ⚠️ **نکته:** این دستور ابتدا بیلد تولید را اجرا می‌کند (از طریق `pretest:e2e`) و سپس سناریوهای ثبت‌نام تا داشبورد و پنل مدیریت را تست می‌کند.

### ۲.۷ خلاصه درگاه ۱

| لایه | دستور | تعداد تست | شرط عبور |
|------|--------|-----------|----------|
| بک‌اند | `python manage.py test api --settings config.settings_test` | ۱۷۷ | ✅ همه OK |
| فرانت‌اند (واحد) | `npx vitest run` | ۳۷ | ✅ همه سبز |
| TypeCheck | `npx tsc --noEmit` | — | بدون خطا |
| Lint | `npm run lint` | — | بدون خطا |
| E2E | `npm run test:e2e` | ۲ سناریو | ✅ همه سبز |

> ❌ **اگر هر یک از موارد بالا شکست خورد، استقرار را ادامه ندهید. خطا را رفع کنید و دوباره از درگاه ۱ شروع کنید.**

---

## ۳. اجرای CI و تأیید نتایج (دروازه ۲)

> **هدف:** اطمینان از اینکه تست‌ها روی محیط CI (GitHub Actions) هم سبز هستند.

### ۳.۱ اجرای CI

```bash
git push origin main
```

### ۳.۲ بررسی نتایج

1. به صفحه Actions در GitHub مخزنه بروید
2. جریان کاری `CI` را پیدا کنید
3. مطمئن شوید تمام jobها سبز هستند:
   - `backend-tests` ✅
   - `frontend-checks` ✅ (TypeCheck + Lint + Unit tests + Build)
   - `e2e-tests` ✅ (وابسته به دو job قبلی)

### ۳.۳ خلاصه درگاه ۲

| job | شامل | شرط عبور |
|-----|-------|----------|
| `backend-tests` | ۱۷۷ تست Django/DRF | ✅ Pass |
| `frontend-checks` | TypeCheck + Lint + ۳۷ تست Vitest + بیلد | ✅ Pass |
| `e2e-tests` | ۲ سناریوی Playwright | ✅ Pass |

> ❌ **اگر CI شکست خورد، استقرار را ادامه ندهید.**

---

## ۴. بیلد تولید و بسته‌بندی (دروازه ۳)

> **هدف:** تولید بیلد نهایی و ایجاد بسته استقرار.

### ۴.۱ بیلد فرانت‌اند

```bash
npm run build
```

### ۴.۲ ایجاد بسته استقرار

```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar czf /tmp/dlea-deploy-$TIMESTAMP.tar.gz \
  --exclude='node_modules' \
  --exclude='.tanstack' \
  --exclude='backend/.venv' \
  --exclude='backend/__pycache__' \
  --exclude='*.pyc' \
  --exclude='backend/db.sqlite3' \
  --exclude='.git' \
  --exclude='.freebuff' \
  .
```

### ۴.۳ تأیید بسته

```bash
ls -lh /tmp/dlea-deploy-$TIMESTAMP.tar.gz
tar tzf /tmp/dlea-deploy-$TIMESTAMP.tar.gz | head -20
```

### ۴.۴ خلاصه درگاه ۳

| مرحله | شرط عبور |
|-------|----------|
| بیلد فرانت‌اند | `npm run build` بدون خطا |
| ایجاد بسته | فایل tar.gz با حجم معقول ایجاد شده |
| تأیید محتوا | فایل‌های ضروری در بسته وجود دارند |

---

## ۵. آپلود و استقرار روی سرور

> **این بخش فقط از شبکه داخلی MCI قابل اجراست.**

### ۵.۱ روش خودکار (توصیه‌شده)

```bash
bash deploy/local-deploy.sh
```

این اسکریپت به‌صورت خودکار:
1. بیلد فرانت‌اند را اجرا می‌کند
2. بسته استقرار را ایجاد می‌کند
3. از طریق SCP آپلود می‌کند
4. روی سرور استخراج، نصب وابستگی‌ها، مایگریشن و ریستارت را انجام می‌دهد

### ۵.۲ روش دستی

اگر روش خودکار کار نکرد، مراحل زیر را دستی اجرا کنید:

#### ۵.۲.۱ آپلود بسته

```bash
scp /tmp/dlea-deploy-$TIMESTAMP.tar.gz ghafari@37.255.212.55:/tmp/
```

#### ۵.۲.۲ اتصال به سرور

```bash
ssh ghafari@37.255.212.55
```

#### ۵.۲.۳ استخراج و نصب

```bash
set -e

DEPLOY_DIR="/opt/dlea"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="$DEPLOY_DIR/releases/$TIMESTAMP"
CURRENT_LINK="$DEPLOY_DIR/current"
SHARED_DIR="$DEPLOY_DIR/shared"

# ایجاد پوشه ریلیس
mkdir -p "$RELEASE_DIR" "$SHARED_DIR"
cd "$RELEASE_DIR"

# استخراج بسته
tar xzf /tmp/dlea-deploy-*.tar.gz
rm -f /tmp/dlea-deploy-*.tar.gz

# پیوند فایل .env مشترک
if [ -f "$SHARED_DIR/backend/.env" ]; then
  ln -sf "$SHARED_DIR/backend/.env" "$RELEASE_DIR/backend/.env"
fi

# نصب وابستگی‌های بک‌اند
cd backend
python3 -m venv .venv 2>/dev/null || true
.venv/bin/pip install --upgrade pip -q 2>/dev/null || true
.venv/bin/pip install -r requirements.txt -q

# اجرای مایگریشن
.venv/bin/python manage.py migrate --noinput

# پیوند ریلیس جدید به current
cd "$DEPLOY_DIR"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

echo "✅ ریلیس $TIMESTAMP آماده ریستارت است."
```

> ⚠️ **مهم:** در این مرحله هنوز سرویس‌ها را ریستارت نکنید! ابتدا درگاه ۴ را اجرا کنید.

---

## ۶. تست‌های سمت سرور پیش از ریستارت (دروازه ۴)

> **هدف:** اطمینان از اینکه تست‌ها روی سرور تولید هم عبور می‌کنند.

### ۶.۱ تست‌های بک‌اند روی سرور

```bash
ssh ghafari@37.255.212.55

cd /opt/dlea/current/backend
USE_SQLITE=1 .venv/bin/python manage.py test api --settings config.settings_test
```

> ⚠️ **نکته:** از `USE_SQLITE=1` استفاده می‌کنیم تا نیازی به PostgreSQL تستی نداشته باشیم و تست‌ها سریع‌تر اجرا شوند.

### ۶.۲ بررسی سلامت دیتابیس

```bash
.venv/bin/python manage.py showmigrations --plan | tail -5
```

مطمئن شوید تمام مایگریشن‌ها اعمال شده‌اند.

### ۶.۳ خلاصه درگاه ۴

| مرحله | دستور | شرط عبور |
|-------|--------|----------|
| تست بک‌اند روی سرور | `python manage.py test api --settings config.settings_test` | ✅ ۱۷۷ تست OK |
| سلامت مایگریشن | `manage.py showmigrations` | همه applied |

> ❌ **اگر تست‌ها روی سرور شکست خوردند، ریستارت نکنید. مشکل را بررسی و رفع کنید.**

---

## ۷. ریستارت سرویس‌ها و بررسی سلامت (دروازه ۵)

> **هدف:** ریستارت سرویس‌ها و اطمینان از بالا آمدن آنها.

### ۷.۱ ریستارت سرویس‌ها

```bash
# ریستارت بک‌اند
sudo systemctl restart dlea-backend

# ریستارت فرانت‌اند
sudo systemctl restart dlea-frontend

# ریستارت Nginx
sudo systemctl reload nginx
```

### ۷.۲ بررسی وضعیت سرویس‌ها

```bash
# بررسی وضعیت
sudo systemctl status dlea-backend --no-pager
sudo systemctl status dlea-frontend --no-pager
sudo systemctl status nginx --no-pager
```

مطمئن شوید همه سرویس‌ها **active (running)** هستند.

### ۷.۳ بررسی پورت‌ها

```bash
# بررسی گوش دادن پورت‌ها
ss -tlnp | grep -E ':(3000|8000|443|80) '
```

خروجی مورد انتظار:
```
LISTEN  0  128  127.0.0.1:3000   ...
LISTEN  0  128  127.0.0.1:8000   ...
LISTEN  0  511  0.0.0.0:443      ...
LISTEN  0  511  0.0.0.0:80       ...
```

### ۷.۴ تست سلامت HTTP

```bash
# تست بک‌اند
curl -s -o /dev/null -w "Backend: HTTP %{http_code}\n" \
  http://127.0.0.1:8000/api/auth/password-reset-request/ \
  -X POST -H "Content-Type: application/json" -d '{"email":"test"}'

# تست فرانت‌اند
curl -s -o /dev/null -w "Frontend: HTTP %{http_code}\n" \
  http://127.0.0.1:3000/

# تست از طریق Nginx (HTTPS)
curl -s -o /dev/null -w "Nginx:   HTTP %{http_code}\n" \
  https://dlea.piqagram.ir/
```

### ۷.۵ بررسی لاگ‌ها در صورت خطا

```bash
# لاگ Gunicorn
sudo journalctl -u dlea-backend --since "5 minutes ago" --no-pager | tail -30

# لاگ فرانت‌اند
sudo journalctl -u dlea-frontend --since "5 minutes ago" --no-pager | tail -30

# لاگ Nginx
sudo tail -20 /var/log/nginx/error.log
```

### ۷.۶ خلاصه درگاه ۵

| مرحله | شرط عبور |
|-------|----------|
| سرویس بک‌اند | `active (running)` |
| سرویس فرانت‌اند | `active (running)` |
| Nginx | `active (running)` |
| پورت ۳۰۰۰ (فرانت‌اند) | گوش می‌دهد |
| پورت ۸۰۰۰ (بک‌اند) | گوش می‌دهد |
| پورت ۴۴۳ (HTTPS) | گوش می‌دهد |
| HTTP بک‌اند | ۲۰۰ یا ۴۰۵ |
| HTTP فرانت‌اند | ۲۰۰ |
| HTTP از طریق Nginx | ۲۰۰ |

> ❌ **اگر هر سرویسی بالا نیامد، ریستارت نکنید! ابتدا لاگ‌ها را بررسی کنید و مشکل را پیدا کنید.**

---

## ۸. تست نهایی روی سایت زنده (دروازه ۶)

> **هدف:** تأیید عملکرد صحیح سایت زنده پس از استقرار.

### ۸.۱ تست دستی سریع

1. مرورگر را باز کنید: **https://dlea.piqagram.ir**
2. مطمئن شوید صفحه اصلی بدون خطا بارگذاری می‌شود
3. با حساب آزمایشی وارد شوید
4. بخش‌های اصلی را بررسی کنید:
   - [ ] داشبورد بارگذاری می‌شود و KPIها نمایش داده می‌شوند
   - [ ] لیست معاملات خالی یا داده‌دار بارگذاری می‌شود
   - [ ] ژورنال باز می‌شود
   - [ ] تنظیمات قابل دسترسی است

### ۸.۲ اجرای تست دود (Smoke Test) خودکار

```bash
# از روی ماشین محلی
npm run record:smoke
```

> این دستور یک مرورگر باز می‌کند، حساب جدید می‌سازد و تمام بخش‌های اصلی را طی می‌کند. خروجی در `smoke-test/smoke-test-<timestamp>.webm` ذخیره می‌شود.

### ۸.۳ چک‌لیست دستی کامل

چک‌لیست کامل در فایل **`QA-CHECKLIST.md`** موجود است. موارد حیاتی:

| بخش | مورد حیاتی |
|------|-----------|
| ثبت‌نام و ورود | ارسال OTP، ورود، خروج |
| پروفایل | ویرایش نام، آواتار، تغییر رمز |
| پرتفولیو | ساخت، ویرایش، فعال‌سازی |
| معاملات | ایمپورت CSV، جزئیات، فیلتر |
| ژورنال | ثبت یادداشت، تاریخ شمسی |
| داشبورد | KPIها، نمودارها |
| مربی هوشمند | تولید گزارش |
| پنل مدیریت | دسترسی admin فقط |
| امنیت | جداسازی داده کاربران |

### ۸.۴ خلاصه درگاه ۶

| مرحله | شرط عبور |
|-------|----------|
| بارگذاری صفحه اصلی | HTTP ۲۰۰ بدون خطا |
| ورود و خروج | عملکرد صحیح |
| Smoke Test | خروجی ضبط شده بدون خطا |
| بررسی دستی بخش‌های حیاتی | ✅ همه تأیید |

---

## ۹. بازگشت به عقب (Rollback)

اگر مشکلی پس از استقرار پیش آمد، مراحل زیر را اجرا کنید:

### ۹.۱ بازگشت به ریلیس قبلی

```bash
ssh ghafari@37.255.212.55

# لیست ریلیس‌ها
ls -la /opt/dlea/releases/

# پیدا کردن ریلیس قبلی (بزرگ‌ترین عدد بعد از فعلی)
ls -t /opt/dlea/releases/ | head -5

# پیوند به ریلیس قبلی
ln -sfn /opt/dlea/releases/<TIMESTAMP_PREVIOUS> /opt/dlea/current

# ریستارت سرویس‌ها
sudo systemctl restart dlea-backend
sudo systemctl restart dlea-frontend
```

### ۹.۲ بازگشت مایگریشن (در صورت نیاز)

> ⚠️ **فقط در صورتی که مایگریشن جدید مشکل‌ساز باشد.**

```bash
cd /opt/dlea/current/backend
.venv/bin/python manage.py migrate api <شماره_مایگریشن_قبلی> --settings config.settings
```

### ۹.۳ تأیید بازگشت

```bash
curl -s -o /dev/null -w "Backend: HTTP %{http_code}\n" \
  http://127.0.0.1:8000/api/auth/password-reset-request/ \
  -X POST -H "Content-Type: application/json" -d '{"email":"test"}'
curl -s -o /dev/null -w "Frontend: HTTP %{http_code}\n" http://127.0.0.1:3000/
```

---

## ۱۰. عیب‌یابی مشکلات رایج

### مشکل: سرویس بک‌اند بالا نمی‌آید

```bash
# بررسی لاگ
sudo journalctl -u dlea-backend -n 50 --no-pager

# رایج‌ترین دلایل:
# 1. خطای Python — وابستگی‌ها نصب نشده‌اند
cd /opt/dlea/current/backend && .venv/bin/pip install -r requirements.txt

# 2. خطای مایگریشن
cd /opt/dlea/current/backend && .venv/bin/python manage.py migrate --noinput

# 3. خطای .env — فایل .env وجود ندارد
ls -la /opt/dlea/current/backend/.env
```

### مشکل: فرانت‌اند بالا نمی‌آید

```bash
# بررسی لاگ
sudo journalctl -u dlea-frontend -n 50 --no-pager

# رایج‌ترین دلیل: فایل .output/server/index.mjs وجود ندارد
ls -la /opt/dlea/current/.output/server/index.mjs

# راه‌حل: بیلد مجدد
cd /opt/dlea/current && npm run build
```

### مشکل: Nginx 502 برمی‌گرداند

```bash
# بررسی اینکه سرویس‌ها گوش می‌دهند
ss -tlnp | grep -E ':(3000|8000)'

# ریستارت Nginx
sudo systemctl restart nginx
```

### مشکل: دیتابیس PostgreSQL متصل نیست

```bash
# بررسی وضعیت PostgreSQL
sudo systemctl status postgresql

# بررسی اتصال
psql -U dlea -d dlea -c "SELECT 1;"
```

---

## ۱۱. چک‌لیست نهایی

پس از اتمام استقرار، مطمئن شوید:

- [ ] **دروازه ۱:** تست‌های محلی سبز هستند
- [ ] **دروازه ۲:** CI روی GitHub Actions سبز است
- [ ] **دروازه ۳:** بیلد تولید موفق و بسته ایجاد شده
- [ ] **دروازه ۴:** تست‌های سمت سرور عبور کرده‌اند
- [ ] **دروازه ۵:** تمام سرویس‌ها فعال و سالم هستند
- [ ] **دروازه ۶:** سایت زنده عملکرد صحیح دارد
- [ ] فایل `.env` مشترک روی سرور حفظ شده
- [ ] ریلیس قبلی برای بازگشت احتمالی موجود است
- [ ] لاگ‌های سرویس‌ها بررسی شده و خطای جدی وجود ندارد
- [ ] تاریخ و زمان استقرار یادداشت شده

---

> **نکته امنیتی:** تمام مراحل استقرار باید از شبکه داخلی MCI انجام شود. سرور از اینترنت عمومی قابل دسترسی نیست.
