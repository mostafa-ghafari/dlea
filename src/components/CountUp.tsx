import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  /** Show a leading + for positive values */
  signed?: boolean;
};

function fa(n: number, decimals: number) {
  return n.toLocaleString("fa-IR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Counts from zero up to `value` when the element scrolls into view. */
export function CountUp({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1400,
  className,
  signed = false,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (started.current) return;
      started.current = true;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        setDisplay(value);
        return;
      }
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(value * eased);
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) {
      run();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            run();
            io.disconnect();
          }
        });
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  const sign = signed && value > 0 ? "+" : "";
  return (
    <span ref={ref} className={className}>
      {sign}
      {prefix}
      {fa(display, decimals)}
      {suffix}
    </span>
  );
}
