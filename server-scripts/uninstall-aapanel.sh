#!/bin/bash
# ============================================
# حذف aaPanel - با بکاپ
# ============================================
set -e

echo "========================================="
echo "  حذف aaPanel از سرور"
echo "========================================="

# 1. بکاپ تنظیمات aaPanel
echo "[1/4] بکاپ گیری از aaPanel..."
BACKUP_DIR="/root/aapanel-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r /www/server/panel/data "$BACKUP_DIR/data" 2>/dev/null || true
cp -r /www/server/panel/plugin "$BACKUP_DIR/plugin" 2>/dev/null || true
echo "  بکاپ در: $BACKUP_DIR"

# 2. حذف سرویس‌های aaPanel
echo "[2/4] توقف سرویس‌ها..."
systemctl stop bt 2>/dev/null || true
systemctl disable bt 2>/dev/null || true

# 3. اجرای اسکریپت حذف رسمی
echo "[3/4] اجرای اسکریپت حذف aaPanel..."
cd /tmp
wget -q http://www.aapanel.com/script/bt-uninstall.sh
chmod +x bt-uninstall.sh
echo "y" | ./bt-uninstall.sh

# 4. پاکسازی نهایی
echo "[4/4] پاکسازی..."
rm -f /tmp/bt-uninstall.sh

echo "========================================="
echo "  ✅ aaPanel حذف شد!"
echo "  بکاپ در: $BACKUP_DIR"
echo "========================================="
echo ""
echo "نکته: Nginx, PHP, MySQL, PostgreSQL همچنان فعال هستند"
echo "فایل‌های Nginx در /etc/nginx/sites-enabled/ باقی مانده‌اند"
