import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Render a USD amount with the sign BEFORE the currency symbol.
 *
 * Writing `{value >= 0 ? "+" : ""}${value}` puts the `$` first and the minus
 * after it, which reads as `$-4.49`. This keeps the sign where it belongs:
 * `+$1.78` / `-$4.49`.
 *
 * Pass `formatMagnitude` when the magnitude needs custom formatting (grouping,
 * fixed decimals); it receives the absolute value.
 */
export function formatUsd(
  value: number,
  formatMagnitude: (magnitude: number) => string = String,
): string {
  return `${value < 0 ? "-" : "+"}$${formatMagnitude(Math.abs(value))}`;
}
