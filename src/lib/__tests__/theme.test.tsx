import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeToggle, useTheme } from "@/lib/theme";

const KEY = "tj:theme";

describe("useTheme", () => {
  it("defaults to dark and applies the class to <html>", () => {
    renderHook(() => useTheme());
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("respects a stored light theme on fresh module load", async () => {
    window.localStorage.setItem(KEY, "light");
    // Re-import the module so its mount-time apply() sees the stored theme
    vi.resetModules();
    const fresh = await import("@/lib/theme");
    renderHook(() => fresh.useTheme());
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggles the theme and persists it", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.setTheme("light"));
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(window.localStorage.getItem(KEY)).toBe("light");
  });
});

describe("ThemeToggle", () => {
  it("renders the current state and toggles on click", () => {
    window.localStorage.setItem(KEY, "dark");
    render(<ThemeToggle />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-label", "تغییر به تم روشن");
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-label", "تغییر به تم تیره");
    expect(window.localStorage.getItem(KEY)).toBe("light");
  });
});
