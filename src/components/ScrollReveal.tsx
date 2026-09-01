import { useEffect } from "react";

/**
 * Progressive scroll reveal for landing sections.
 * Elements marked with `data-reveal` fade/slide in as they enter the viewport.
 */
export function ScrollReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (nodes.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((n) => n.classList.add("reveal-in"));
      return;
    }

    nodes.forEach((n) => n.classList.add("reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("reveal-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  return null;
}
