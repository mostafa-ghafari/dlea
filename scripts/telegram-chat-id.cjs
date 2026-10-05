#!/usr/bin/env node
/**
 * telegram-chat-id.cjs — گرفتن chat id گروه/چت تلگرام (برای رول جیرا یا CI)
 *
 * استفاده:
 *   ۱) بات را به گروه اضافه کن
 *   ۲) داخل گروه یک پیام بفرست (هر پیامی)
 *   ۳) اجرا:  node scripts/telegram-chat-id.cjs <BOT_TOKEN>
 *       یا:   TELEGRAM_BOT_TOKEN=xxx node scripts/telegram-chat-id.cjs
 *
 * نکته: اگر خروجی خالی بود، در @BotFather با /setprivacy گزینه Disable را
 * انتخاب کن (تا پیام‌های عادی گروه به بات برسد) و دوباره در گروه پیام بفرست.
 */
'use strict';

const token = process.argv[2] || process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('Usage: node scripts/telegram-chat-id.cjs <BOT_TOKEN>');
  console.error('   or: TELEGRAM_BOT_TOKEN=xxx node scripts/telegram-chat-id.cjs');
  process.exit(1);
}

(async () => {
  const base = `https://api.telegram.org/bot${token}`;
  const res = await fetch(`${base}/getUpdates?limit=100`);
  const data = await res.json();

  if (!data.ok) {
    console.error('Telegram API error:', data.error_code, data.description);
    process.exit(1);
  }

  const chats = new Map();
  for (const u of data.result) {
    const m = u.message || u.edited_message || u.channel_post || u.edited_channel_post;
    if (m && m.chat) chats.set(m.chat.id, m.chat);
  }

  if (chats.size === 0) {
    console.log('هیچ چتی پیدا نشد.');
    console.log('۱) بات را به گروه اضافه کن و داخل گروه یک پیام بفرست،');
    console.log('۲) اگر باز هم خالی بود، Privacy Mode را در @BotFather با /setprivacy → Disable خاموش کن و دوباره پیام بفرست.');
    process.exit(0);
  }

  console.log('Chat id(s) پیدا شده:\n');
  for (const c of chats.values()) {
    const title = c.title || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.username || '-';
    console.log(`  ${c.id}\t${c.type}\t${title}`);
  }
  console.log('\nعدد chat id گروه معمولاً منفی است (مثل -1001234567890).');
})().catch((e) => {
  console.error('خطا:', e.message);
  process.exit(1);
});
