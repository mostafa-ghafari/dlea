import { ImagePlus, X } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

const ACCEPT = "image/jpeg,image/png,image/heic,image/heif,.heic,.heif";
const TARGET_BYTES = 200 * 1024; // ~200KB after server-side optimisation

/**
 * Screenshot uploader (chart / MT report history).
 * Accepts HEIC, JPG, PNG with no client-side size cap; images are
 * downscaled to roughly 200KB (this mirrors the server-side optimisation).
 */
async function optimize(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error("read failed"));
    fr.readAsDataURL(file);
  });

  // HEIC can't be decoded by canvas in most browsers — keep the original;
  // the server pipeline handles the conversion.
  if (/heic|heif/i.test(file.type) || /\.heic|\.heif$/i.test(file.name)) {
    return dataUrl;
  }

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = dataUrl;
    });

    const maxW = 1600;
    const scale = Math.min(1, maxW / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let quality = 0.85;
    let out = canvas.toDataURL("image/jpeg", quality);
    while (out.length * 0.75 > TARGET_BYTES && quality > 0.35) {
      quality -= 0.1;
      out = canvas.toDataURL("image/jpeg", quality);
    }
    return out;
  } catch {
    return dataUrl;
  }
}

export function ImageUploader({
  images,
  onChange,
  label = "اسکرین‌شات‌ها",
  hint = "چارت یا Report History — فرمت HEIC، JPG، PNG",
  compact = false,
}: {
  images: string[];
  onChange: (next: string[]) => void;
  label?: string;
  hint?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const results: string[] = [];
    for (const file of Array.from(files)) {
      results.push(await optimize(file));
    }
    onChange([...images, ...results]);
    toast.success(`${results.length} تصویر آپلود شد و به حدود ۲۰۰ کیلوبایت بهینه‌سازی شد`);
  }

  return (
    <div className="space-y-2">
      {!compact && <div className="text-sm font-medium">{label}</div>}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary/30 px-4 py-6 text-center transition-colors hover:border-primary/50 hover:bg-secondary/50"
      >
        <ImagePlus className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{hint}</span>
      </button>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((src, i) => (
            <div key={i} className="group relative overflow-hidden rounded-lg border border-border">
              <img src={src} alt={`اسکرین‌شات ${i + 1}`} loading="lazy" className="h-24 w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-md bg-background/85 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="حذف تصویر"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
