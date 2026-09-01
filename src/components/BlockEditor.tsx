import { Heading2, List, Quote, Type as TypeIcon, Trash2, Plus, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { JournalBlock } from "@/lib/mock-data";

const TYPES: { type: JournalBlock["type"]; label: string; icon: typeof TypeIcon }[] = [
  { type: "p", label: "متن", icon: TypeIcon },
  { type: "h2", label: "تیتر", icon: Heading2 },
  { type: "list", label: "لیست", icon: List },
  { type: "quote", label: "نقل‌قول", icon: Quote },
];

function uid() {
  return `b${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;
}

/**
 * Lightweight block editor (Notion-like) for journal entries.
 * Built in-house to stay SSR-safe and dependency-free.
 */
export function BlockEditor({
  blocks,
  onChange,
  onAddImage,
}: {
  blocks: JournalBlock[];
  onChange: (next: JournalBlock[]) => void;
  onAddImage?: () => void;
}) {
  function add(type: JournalBlock["type"]) {
    onChange([...blocks, { id: uid(), type, text: "" }]);
  }
  function update(id: string, text: string) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, text } : b)));
  }
  function remove(id: string) {
    onChange(blocks.filter((b) => b.id !== id));
  }
  function setType(id: string, type: JournalBlock["type"]) {
    onChange(blocks.map((b) => (b.id === id ? { ...b, type } : b)));
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-3">
      {blocks.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          هنوز بلوکی اضافه نشده — از دکمه‌های پایین شروع کن.
        </p>
      )}

      {blocks.map((b) => (
        <div key={b.id} className="rounded-lg border border-border/70 bg-background/50 p-2.5">
          <div className="mb-2 flex items-center gap-1">
            {TYPES.map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => setType(b.id, t.type)}
                className={`rounded px-2 py-1 text-[11px] transition-colors ${
                  b.type === t.type
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => remove(b.id)}
              className="mr-auto rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
              aria-label="حذف بلوک"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <Textarea
            rows={b.type === "h2" ? 1 : 3}
            value={b.text}
            onChange={(e) => update(b.id, e.target.value)}
            placeholder={
              b.type === "h2"
                ? "عنوان بخش..."
                : b.type === "list"
                  ? "هر خط یک آیتم لیست"
                  : b.type === "quote"
                    ? "نقل‌قول یا جمله کلیدی..."
                    : "متن پاراگراف..."
            }
            className={`bg-secondary/50 ${b.type === "h2" ? "font-bold" : ""}`}
          />
        </div>
      ))}

      <div className="flex flex-wrap gap-2 border-t border-border pt-3">
        {TYPES.map((t) => (
          <Button key={t.type} type="button" size="sm" variant="outline" onClick={() => add(t.type)}>
            <Plus className="ml-1 h-3 w-3" />
            {t.label}
          </Button>
        ))}
        {onAddImage && (
          <Button type="button" size="sm" variant="outline" onClick={onAddImage}>
            <ImagePlus className="ml-1 h-3 w-3" />
            تصویر
          </Button>
        )}
      </div>
    </div>
  );
}

export function BlockRenderer({ blocks }: { blocks: JournalBlock[] }) {
  return (
    <div className="space-y-3 text-sm">
      {blocks.map((b) => {
        if (b.type === "h2") return <h4 key={b.id} className="font-semibold">{b.text}</h4>;
        if (b.type === "quote")
          return (
            <blockquote key={b.id} className="border-r-2 border-primary/50 pr-3 text-muted-foreground italic">
              {b.text}
            </blockquote>
          );
        if (b.type === "list")
          return (
            <ul key={b.id} className="list-inside list-disc space-y-1 text-foreground/90">
              {b.text.split("\n").filter(Boolean).map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          );
        return <p key={b.id} className="text-foreground/90">{b.text}</p>;
      })}
    </div>
  );
}
