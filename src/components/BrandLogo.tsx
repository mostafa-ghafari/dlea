import { cn } from "@/lib/utils";

/**
 * The Dlea mark — a pre-tinted green PNG generated from the brand logo by
 * `scripts/make-logo.cjs` (background removed, hues shifted toward the brand
 * green). Rendered without a gradient tile so the artwork shows through.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/logo-192.png"
      alt="Dlea AI"
      draggable={false}
      className={cn("shrink-0 select-none", className)}
    />
  );
}
