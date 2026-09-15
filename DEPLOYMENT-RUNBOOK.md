# راهنمای استقرار و عملیات (Runbook) — Dlea AI

> **سرور تولید:** `ghafari@37.255.212.55` (فقط از شبکه داخلی MCI)
> **آدرس سایت:** https://dlea.piqagram.ir
> **آخرین هم‌راست‌سازی با سرور:** سپتامبر ۲۰۲۶
>
> این سند تنها منبع درست عملیات است. اگر جایی با واقعیت سرور نمی‌خواند،
> **سرور درست است**؛ اول با دستورهای بخش ۸ وضعیت را بگیر، بعد سند را اصلاح کن.

---

## ۰. معماری واقعی

```
مرورگر
  │  https://dlea.piqagram.ir
  ▼
ArvanCloud            ← TLS اینجاست (گواهی صادرشده توسط CDN)، کش و WAF
  │  http://37.255.212.55:80
  ▼
nginx  (vhost: /etc/nginx/sites-enabled/dlea.piqagram.ir)
  ├── /api/    → 127.0.0.1:8002   gunicorn  (PM2 app: dlea-api)
  ├── /media/  → /var/www/dlea.piqagram.ir/backend/media/   (فایل‌های آپلودی)
  └── /        → 127.0.0.1:3000   node .output/server/index.mjs  (PM2 app: dlea)
```

نکات حیاتی این معماری:

- **TLS روی سرور تمام نمی‌شود.** vhost فقط `listen 80` دارد؛ بلاک `listen 443`
  اضافه نکن. روی همین ماشین سایت‌های دیگری هم روی `:443` هستند.
- **پورت ۸۰۰۰ مال این پروژه نیست؛** سایت دیگری روی آن گوش می‌دهد. هیچ سرویس،
  یونیت systemd یا کانفیگی نباید `:8000` را بگیرد. بک‌اند دلئا روی **۸۰۰۲** است.
- **پروسه‌ها مال PM2 هستند، نه systemd.** یونیت systemd برای دلئا وجود ندارد و
  نباید ساخته شود.

### پروسه‌ها (PM2)

| نام در PM2 | اجرا | cwd | آرگومان‌ها |
|---|---|---|---|
| `dlea-api` | `backend/.venv/bin/gunicorn` | `/var/www/dlea.piqagram.ir/backend` | `config.wsgi:application --bind 127.0.0.1:8002 --workers 3 --timeout 120` |
| `dlea` | `npm start` → `node .output/server/index.mjs` | `/var/www/dlea.piqagram.ir` | `start` |

- سرویس بوت: `pm2-ghafari.service` (enabled). یعنی بعد از ریبوت، PM2 دقیقاً همان
  چیزی را برمی‌گرداند که در `~/.pm2/dump.pm2` ذخیره شده است.
- **بعد از هر تغییر در تعریف اپ‌ها** یک بار `pm2 save` بزن، وگرنه بعد از ریبوت
  تعریف قدیمی برمی‌گردد.

### مسیرها

| مسیر | چیست | در استقرار دست‌خورده می‌ماند؟ |
|---|---|---|
| `~/dlea/releases/<timestamp>` | هر استقرار یک ریلیس کامل (کد + `pip-wheels` + `.output`) | — |
| `~/dlea/current` | لینک نمادین به آخرین ریلیس (آرشیو؛ سرو نمی‌شود) | — |
| `/var/www/dlea.piqagram.ir/backend` | **کدی که واقعاً اجرا می‌شود** (`api/`, `config/`, `manage.py`) | `api/` و `config/` آینه می‌شوند؛ `.env`، `media/` و `.venv` دست‌نخورده می‌مانند |
| `/var/www/dlea.piqagram.ir/.output` | بیلد فرانت که PM2 سرو می‌کند | از ریلیس بازنویسی می‌شود |
| `backend/media/` | آواتار، رسید پرداخت و … (۸ فایل در آخرین بررسی) | هرگز |
| `backend/.env` | تنظیمات تولید (DB، کلیدها) | هرگز |

> هر ریلیس حدود **۸۰ مگابایت** است و در آخرین بررسی ۲۸ ریلیس (۲.۲ گیگ) روی دیسک
> بود. دیسک سرور ~۱۴ گیگ آزاد دارد؛ بخش ۹ را دوره‌ای اجرا کن.

---

## ۱. پیش‌نیازها

- [ ] اتصال به شبکه داخلی MCI فعال است (سرور از اینترنت عمومی در دسترس نیست)
- [ ] کلید SSH کاربر `ghafari` روی `37.255.212.55` کار می‌کند: `ssh ghafari@37.255.212.55 true`
- [ ] مخزن به‌روز است: `git pull origin main`
- [ ] Node و npm محلی نصب‌اند (بیلد فرانت روی همین ماشین انجام می‌شود)

---

## ۲. دروازه ۱ — تست‌های محلی

```bash
# بک‌اند
cd backend && ./.venv/Scripts/python.exe manage.py test api --settings config.settings_test && cd ..
# انتظار: Ran 242 tests ... OK

# فرانت‌اند
npx vitest run        # انتظار: 116 passed
npx tsc --noEmit      # انتظار: بدون خطا
npm run lint          # انتظار: بدون خطا
```

> استقرار خودش هم همین تست بک‌اند را **روی سرور** و قبل از هر تغییری اجرا می‌کند و
> در صورت شکست متوقف می‌شود (بخش ۴، مرحله ۳). پس دروازه ۱ برای گرفتن خطای زودتر است.

---

## ۳. دروازه ۲ — CI

push روی `main` جریان‌های `backend-tests`, `frontend-checks`, `e2e-tests` را در
GitHub Actions اجرا می‌کند. اگر سبز نبود استقرار را ادامه نده.

---

## ۴. دروازه ۳ — استقرار (یک دستور)

```bash
# از ویندوز (مسیر معمول این تیم، از Git Bash یا cmd):
deploy\local-deploy.bat

# از لینوکس/مک یا همان Git Bash:
bash deploy/local-deploy.sh
```

هر دو اسکریپت **دقیقاً یک کار** می‌کنند و منطق سمت سرور در یک جا
(`deploy/deploy.sh`) زندگی می‌کند؛ فقط بیلد و آپلود محلی است:

1. `npm run build` → `.output/`
2. دانلود `pip-wheels` برای لینوکس/پایتون ۳.۱۲ (سرور به PyPI دسترسی ندارد)
3. `deploy/check_wheels.py` بررسی می‌کند بستهٔ ویل‌ها کامل است
4. ساخت آرشیو در پوشهٔ موقت با **نام نسبی**
   (اگر مسیر `C:\...` به tar داده شود، GNU tar آن را «هاست ریموت» می‌فهمد و
   اصلاً آرشیو نمی‌سازد؛ این تله یک‌بار ما را زمین زد)
5. `scp` آرشیو و `deploy/deploy.sh` به `/tmp` سرور
6. `ssh` → `bash /tmp/deploy.sh`

و `deploy/deploy.sh` روی سرور به ترتیب:

1. پورت واقعی `/api/` را **از کانفیگ زندهٔ nginx** می‌خواند (پیش‌فرض ۸۰۰۲) تا
   هرگز روی پورتی که کسی پروکسی نمی‌کند بالا نیاید.
2. آرشیو را در `~/dlea/releases/<timestamp>` باز می‌کند، و اگر آرشیو نبود
   همان‌جا با پیام روشن متوقف می‌شود.
3. تست‌های بک‌اند را با SQLite اجرا می‌کند (شکست = توقف، بدون هیچ تغییری).
4. `migrate` را روی دیتابیس واقعی اجرا می‌کند.
5. `~/dlea/current` را به ریلیس جدید لینک می‌کند.
6. **آینه‌کردن** `backend/api/` و `backend/config/` در پوشهٔ اجرا
   (`rsync --delete`؛ فایل‌های حذف‌شده هم پاک می‌شوند) و بعد بررسی می‌کند درخت
   اجرا با ریلیس مو‌به‌مو یکی است.
7. `.output/` را از ریلیس به پوشهٔ اجرا منتشر و با `cmp` تأیید می‌کند.
8. اگر `requirements.txt` عوض شده باشد، همان بسته را **آفلاین** (از ویل‌های
   داخل ریلیس) در venv پوشهٔ اجرا نصب می‌کند؛ چون آن venv است که کد را ایمپورت
   می‌کند، نه venv ریلیس. این هم قبل از ری‌استارت انجام می‌شود.
9. `migrate` را در پوشهٔ اجرا هم می‌زند (قبل از کشتن پروسهٔ فعلی، تا خطای
   مایگریشن سایت را نخواباند).
10. `pm2 restart dlea-api` و `pm2 restart dlea` (اگر PM2 نبود، روش جایگزین با
    بررسی آزادبودن پورت).
11. چهار بررسی سلامت؛ اگر هر کدام سبز نباشد با کد خطا و لاگ‌ها خارج می‌شود.

خروجی مورد انتظار در پایان:

```
Backend (port 8002): HTTP 200
Frontend (port 3000): HTTP 200
API through nginx (loopback): HTTP 200
Public API (https://dlea.piqagram.ir): HTTP 200
=== Deployment complete ===
```

---

## ۵. دروازه ۴ — بررسی دستی بعد از استقرار

```bash
ssh ghafari@37.255.212.55

pm2 list                                    # هر سه اپ online
curl -s -o /dev/null -w '%{http_code}\n' -H 'Host: dlea.piqagram.ir' http://127.0.0.1/api/plans/
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/
ls -l --time-style=long-iso /var/www/dlea.piqagram.ir/.output/server/index.mjs   # باید امروز باشد
```

سپس در مرورگر: ورود با حساب واقعی، باز شدن داشبورد، لیست معاملات و پنل `/admin`.

> نکته: `/api/auth/login/` با متد `GET` عدد **۴۰۵** می‌دهد و این درست است؛
> فقط `POST` مجاز است.

---

## ۶. بازگشت به عقب (Rollback)

ریلیس‌های قبلی همیشه روی سرور می‌مانند، ولی توجه کن که **فقط `~/dlea/current`
عوض‌کردن کافی نیست**: فرانت و بک‌اند از پوشهٔ اجرا سرو می‌شوند. یعنی باید از
ریلیس قدیمی دوباره «آینه» کنی:

```bash
ssh ghafari@37.255.212.55
ls -1t ~/dlea/releases | head -5          # ریلیس‌ها از جدید به قدیم

PREV=$(ls -1t ~/dlea/releases | sed -n 2p)   # ریلیس قبلی
echo "$PREV"

# ۱) کد بک‌اند را از ریلیس قبلی برگردان
rsync -a --delete --exclude='__pycache__' \
  ~/dlea/releases/$PREV/backend/api/ /var/www/dlea.piqagram.ir/backend/api/
rsync -a --delete --exclude='__pycache__' \
  ~/dlea/releases/$PREV/backend/config/ /var/www/dlea.piqagram.ir/backend/config/
cp -f ~/dlea/releases/$PREV/backend/manage.py /var/www/dlea.piqagram.ir/backend/manage.py

# ۲) فرانت را از همان ریلیس برگردان
rsync -a --delete ~/dlea/releases/$PREV/.output/ /var/www/dlea.piqagram.ir/.output/

# ۳) لینک current را هم به همان ریلیس برگردان و پروسه‌ها را ری‌استارت کن
ln -sfn ~/dlea/releases/$PREV ~/dlea/current
cd /var/www/dlea.piqagram.ir/backend && .venv/bin/python manage.py migrate --noinput
pm2 restart dlea-api && pm2 restart dlea

# ۴) تأیید
curl -s -o /dev/null -w 'API: %{http_code}\n' -H 'Host: dlea.piqagram.ir' http://127.0.0.1/api/plans/
curl -s -o /dev/null -w 'front: %{http_code}\n' http://127.0.0.1:3000/
```

> ⚠️ **مایگریشن‌ها به عقب برنمی‌گردند.** اگر ریلیس قدیمی به ستون‌های حذف‌شده
> وابسته باشد، برگشت کد کافی نیست. در عمل: تا وقتی مایگریشن جدید فقط ستون اضافه
> کرده باشد، برگشت کد بی‌خطر است.

---

## ۷. عیب‌یابی

| نشانه | تشخیص سریع | راه‌حل |
|---|---|---|
| **همهٔ مسیرهای `/api/` حتی مسیرهای ناموجود ۵۰۰ می‌دهند** و صفحهٔ ۵۰۰ خالی/کوچک است | ایمپورت URLconf خطا می‌دهد؛ یعنی ماژولی در پوشهٔ اجرا نیست | `cd /var/www/dlea.piqagram.ir/backend && .venv/bin/python -c "import api.urls"` تا خطا را ببینی؛ بعد یک استقرار کامل بزن تا آینه‌سازی انجام شود |
| `gunicorn` با `Address already in use` بالا نمی‌آید | PM2 پروسهٔ قدیمی را دوباره آورده | `pm2 restart dlea-api` (به‌جای `pkill` + اجرای دستی) |
| پاسخ `/api/...` در زمان `curl` سریع است ولی در مرورگر ۵۰۰ | Cloudflare/ArvanCloud کش کرده | در پنل ArvanCloud کش را پاک کن؛ کش `X-Cache` را در هدرها ببین |
| سایت قدیمی به‌نظر می‌رسد (CSS/JS کهنه) | `.output` پوشهٔ اجرا به‌روز نشده | `ls -l /var/www/dlea.piqagram.ir/.output/server/index.mjs`؛ باید تاریخ امروز باشد. استقرار جدید این را با `cmp` تأیید می‌کند |
| `migrate` می‌گوید `multiple leaf nodes in the migration graph` | فایل مایگریشن قدیمی در پوشهٔ اجرا مانده | `ls /var/www/dlea.piqagram.ir/backend/api/migrations/` را با `~/dlea/current/backend/api/migrations/` مقایسه کن؛ فایل اضافه را پاک کن |
| بک‌اند ۵۰۰ می‌دهد ولی همهٔ ماژول‌ها سرجایشان‌اند | `requirements.txt` عوض شده و venv پوشهٔ اجرا وابستگی جدید را ندارد | استقرار خودش این را نصب می‌کند (مرحلهٔ ۸ بخش ۴). اگر دستی لازم شد: `cd /var/www/dlea.piqagram.ir/backend && .venv/bin/pip install --no-index --find-links ~/dlea/current/pip-wheels -r requirements.txt` |
| هیچ پروسه‌ای روی ۸۰۰۲ نیست | PM2 اپ را نگه نداشته یا کرش کرده | `pm2 logs dlea-api --lines 50`؛ سپس `pm2 restart dlea-api` و `pm2 save` |
| فرانت بالا نمی‌آید | `.output/server/index.mjs` نبود | `pm2 logs dlea --lines 50`؛ بیلد محلی + استقرار مجدد |
| دیسک پر شده | `df -h /` | بخش ۸ (پاک‌سازی ریلیس‌های قدیمی) |
| بعد از ریبوت هیچ‌چیز بالا نیست | `systemctl status pm2-ghafari` و محتوای `~/.pm2/dump.pm2` | `pm2 resurrect` و بعد از درستی، `pm2 save` |

لاگ‌ها:

```bash
pm2 logs dlea-api --lines 100     # بک‌اند
pm2 logs dlea     --lines 100     # فرانت
sudo tail -50 /var/log/nginx/error.log
```

---

## ۸. نگهداری دوره‌ای

```bash
# وضعیت کلی
pm2 list
df -h /
(ss -ltn || netstat -ltn) | grep -E ':(80|3000|8002) '

# نگه‌داشتن ۱۰ ریلیس آخر (هر کدام ~۸۰ مگ)
cd ~/dlea/releases && ls -1t | tail -n +11 | xargs -r rm -rf

# بعد از هر تغییر در تعریف اپ‌های PM2
pm2 save
```

فهرست کارهای سرور (نصب پیش‌نیاز، vhost، PM2 startup) در
`deploy/setup-server.sh` است و **قابل اجرای مکرر** است: چیزی را بدون
`--force` بازنویسی نمی‌کند، قبل از `reload` با `nginx -t` تست می‌کند و به فایل
سایت‌های دیگر دست نمی‌زند.

---

## ۹. چیزهایی که آگاهانه انجام نمی‌شود

- **پنل ادمین خود جنگو از بیرون در دسترس نیست.** کانفیگ nginx مسیری برای
  `/admin/` ندارد، پس `/admin/` به اپ فرانت (SPA) می‌رسد. پنل مدیریتی که
  استفاده می‌کنی همان `/admin` خودِ اپ است. اگر یک روز پنل جنگو لازم شد، باید
  یک `location /admin/` و یک `location /static/` (فایل‌های استاتیک جنگو هم
  سرو نمی‌شوند؛ whitenoise نصب نیست) اضافه شود.
- **دیپلوی بیلد فرانت را دوباره اجرا نمی‌کند** روی سرور؛ `.output` را از ماشین
  محلی می‌آورد. Node روی سرور فقط آن را اجرا می‌کند.
- **کش ArvanCloud به‌صورت خودکار پاک نمی‌شود.** اگر بعد از استقرار هنوز
  asset قدیمی دیدی، کش را از پنل پاک کن.

---

## ۱۰. چک‌لیست نهایی

- [ ] تست‌های محلی سبز (۲۴۲ بک‌اند، ۱۱۶ فرانت، tsc، lint)
- [ ] استقرار با `local-deploy.bat` یا `local-deploy.sh` تمام شد
- [ ] چهار خط خلاصهٔ استقرار همه ۲۰۰ بودند
- [ ] `pm2 list` سه اپ را `online` نشان می‌دهد
- [ ] تاریخ `.output/server/index.mjs` امروز است
- [ ] ورود و داشبورد در مرورگر سالم است
- [ ] ریلیس قبلی برای بازگشت موجود است (`ls -1t ~/dlea/releases | head`)
- [ ] اگر تعریف PM2 عوض شده: `pm2 save`
