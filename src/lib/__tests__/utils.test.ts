import { describe, expect, it } from "vitest";
import { cn, formatUsd } from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignores falsy values", () => {
    expect(cn("a", false, undefined, null, "b")).toBe("a b");
  });

  it("resolves tailwind conflicts (keeps the last)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});

describe("formatUsd", () => {
  it("puts the sign before the currency symbol", () => {
    expect(formatUsd(1.78)).toBe("+$1.78");
    expect(formatUsd(-4.49)).toBe("-$4.49");
  });

  it("never emits a currency sign followed by a minus", () => {
    expect(formatUsd(-1234.5)).not.toContain("$-");
  });

  it("treats zero as non-negative", () => {
    expect(formatUsd(0)).toBe("+$0");
  });

  it("formats the magnitude with a custom formatter", () => {
    expect(formatUsd(-12.4, (n) => n.toFixed(0))).toBe("-$12");
  });
});
