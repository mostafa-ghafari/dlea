import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  AlignRight,
  AlignCenter,
  AlignLeft,
  Link2,
  ImagePlus,
  Undo2,
  Redo2,
  Eraser,
  Code2,
  Minus,
} from "lucide-react";

/**
 * Full-featured rich-text editor (CKEditor-style toolbar) built on a
 * contentEditable surface so it stays SSR-safe and dependency-free.
 */
type Cmd = { icon: typeof Bold; label: string; run: () => void };

export function RichTextEditor({
  value,
  onChange,
  placeholder = "متن ژورنال را اینجا بنویس...",
  minHeight = 220,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [empty, setEmpty] = useState(!value);

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value || "";
    setEmpty(!value || value === "<br>");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sync() {
    const el = ref.current;
    if (!el) return;
    const html = el.innerHTML;
    setEmpty(!el.textContent?.trim() && !el.querySelector("img"));
    onChange(html);
  }

  function exec(command: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    sync();
  }

  function insertHtml(html: string) {
    ref.current?.focus();
    document.execCommand("insertHTML", false, html);
    sync();
  }

  const groups: Cmd[][] = [
    [
      { icon: Bold, label: "توپر", run: () => exec("bold") },
      { icon: Italic, label: "ایتالیک", run: () => exec("italic") },
      { icon: Underline, label: "زیرخط", run: () => exec("underline") },
      { icon: Strikethrough, label: "خط‌خورده", run: () => exec("strikeThrough") },
    ],
    [
      { icon: Heading1, label: "تیتر ۱", run: () => exec("formatBlock", "<h2>") },
      { icon: Heading2, label: "تیتر ۲", run: () => exec("formatBlock", "<h3>") },
      { icon: Heading3, label: "تیتر ۳", run: () => exec("formatBlock", "<h4>") },
      { icon: Quote, label: "نقل‌قول", run: () => exec("formatBlock", "<blockquote>") },
      { icon: Code2, label: "کد", run: () => exec("formatBlock", "<pre>") },
    ],
    [
      { icon: List, label: "لیست نامرتب", run: () => exec("insertUnorderedList") },
      { icon: ListOrdered, label: "لیست شماره‌دار", run: () => exec("insertOrderedList") },
      { icon: Minus, label: "خط جداکننده", run: () => insertHtml("<hr />") },
    ],
    [
      { icon: AlignRight, label: "راست‌چین", run: () => exec("justifyRight") },
      { icon: AlignCenter, label: "وسط‌چین", run: () => exec("justifyCenter") },
      { icon: AlignLeft, label: "چپ‌چین", run: () => exec("justifyLeft") },
    ],
    [
      {
        icon: Link2,
        label: "لینک",
        run: () => {
          const url = window.prompt("آدرس لینک:");
          if (url) exec("createLink", url);
        },
      },
      { icon: ImagePlus, label: "تصویر داخل متن", run: () => fileRef.current?.click() },
    ],
    [
      { icon: Undo2, label: "بازگردانی", run: () => exec("undo") },
      { icon: Redo2, label: "تکرار", run: () => exec("redo") },
      { icon: Eraser, label: "پاک کردن قالب", run: () => exec("removeFormat") },
    ],
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-secondary/20">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-secondary/50 p-1.5">
        {groups.map((g, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <span className="mx-1 h-5 w-px bg-border" />}
            {g.map((c) => (
              <button
                key={c.label}
                type="button"
                title={c.label}
                aria-label={c.label}
                onMouseDown={(e) => e.preventDefault()}
                onClick={c.run}
                className="grid h-7 w-7 place-items-center rounded text-muted-foreground transition-colors hover:bg-primary/15 hover:text-primary"
              >
                <c.icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        ))}

        <span className="mx-1 h-5 w-px bg-border" />
        <select
          onMouseDown={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.value) exec("foreColor", e.target.value);
            e.target.value = "";
          }}
          className="h-7 rounded bg-background/60 px-1 text-[11px] text-muted-foreground outline-none"
          defaultValue=""
        >
          <option value="">رنگ متن</option>
          <option value="#22c55e">سبز</option>
          <option value="#ef4444">قرمز</option>
          <option value="#eab308">زرد</option>
          <option value="#3b82f6">آبی</option>
          <option value="#ffffff">سفید</option>
        </select>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const fr = new FileReader();
          fr.onload = () =>
            insertHtml(`<img src="${String(fr.result)}" alt="تصویر ژورنال" style="max-width:100%;border-radius:8px" />`);
          fr.readAsDataURL(file);
        }}
      />

      <div className="relative">
        {empty && (
          <span className="pointer-events-none absolute right-4 top-3 text-sm text-muted-foreground">
            {placeholder}
          </span>
        )}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          dir="rtl"
          onInput={sync}
          onBlur={sync}
          style={{ minHeight }}
          className="rte-content max-w-none px-4 py-3 text-sm leading-relaxed outline-none"
        />
      </div>
    </div>
  );
}

/** Read-only renderer for stored journal HTML. */
export function RichTextView({ html, className = "" }: { html: string; className?: string }) {
  return (
    <div
      className={`rte-content text-sm leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
