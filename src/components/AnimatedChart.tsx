import { useEffect, useRef, useState } from "react";

/**
 * Animated equity curve chart for the landing page.
 * Uses an SVG path with stroke-dash animation + a moving dot + glow pulses.
 */
export function AnimatedChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [progress, setProgress] = useState(0);
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  // Equity curve data points (normalized 0-1 for viewBox)
  const points = [
    { x: 0, y: 0.75 },
    { x: 0.04, y: 0.71 },
    { x: 0.08, y: 0.58 },
    { x: 0.12, y: 0.62 },
    { x: 0.16, y: 0.46 },
    { x: 0.20, y: 0.50 },
    { x: 0.24, y: 0.33 },
    { x: 0.28, y: 0.37 },
    { x: 0.32, y: 0.25 },
    { x: 0.36, y: 0.29 },
    { x: 0.40, y: 0.18 },
    { x: 0.44, y: 0.22 },
    { x: 0.48, y: 0.15 },
    { x: 0.52, y: 0.12 },
    { x: 0.56, y: 0.18 },
    { x: 0.60, y: 0.10 },
    { x: 0.64, y: 0.08 },
    { x: 0.68, y: 0.14 },
    { x: 0.72, y: 0.06 },
    { x: 0.76, y: 0.09 },
    { x: 0.80, y: 0.04 },
    { x: 0.84, y: 0.07 },
    { x: 0.88, y: 0.03 },
    { x: 0.92, y: 0.05 },
    { x: 0.96, y: 0.02 },
    { x: 1.0, y: 0.01 },
  ];

  // Build smooth SVG path
  const viewBox = { w: 400, h: 120 };
  const scaleX = (x: number) => x * viewBox.w;
  const scaleY = (y: number) => y * viewBox.h;

  let pathD = `M${scaleX(points[0].x)},${scaleY(points[0].y)}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (scaleX(prev.x) + scaleX(curr.x)) / 2;
    pathD += ` C${cpx},${scaleY(prev.y)} ${cpx},${scaleY(curr.y)} ${scaleX(curr.x)},${scaleY(curr.y)}`;
  }

  const areaD = pathD + ` L${viewBox.w},${viewBox.h} L0,${viewBox.h} Z`;

  // Intersection Observer to trigger animation when visible
  useEffect(() => {
    const el = svgRef.current?.closest("div");
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Animate progress
  useEffect(() => {
    if (!visible) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      setDotPos({ x: scaleX(points[points.length - 1]!.x), y: scaleY(points[points.length - 1]!.y) });
      return;
    }
    const duration = 2000;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setProgress(eased);
      // Find dot position along the path
      const idx = Math.min(Math.floor(eased * (points.length - 1)), points.length - 1);
      const pt = points[idx]!;
      setDotPos({ x: scaleX(pt.x), y: scaleY(pt.y) });
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible]);

  // Total path length (approximate)
  const totalLen = 1200;
  const dashOffset = totalLen * (1 - progress);

  return (
    <div className="relative h-48 rounded-lg border border-border bg-gradient-to-b from-primary/10 via-primary/5 to-transparent p-4 overflow-hidden">
      {/* Glow backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{ opacity: progress * 0.6 }}
      >
        <div className="absolute left-0 right-0 bottom-0 h-3/4 bg-gradient-to-t from-primary/20 to-transparent" />
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${viewBox.w} ${viewBox.h}`}
        className="relative h-full w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="dotGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.8} />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((y) => (
          <line
            key={y}
            x1={0}
            y1={scaleY(y)}
            x2={viewBox.w}
            y2={scaleY(y)}
            stroke="var(--color-border)"
            strokeWidth={0.5}
            strokeDasharray="4 4"
            opacity={0.4}
          />
        ))}

        {/* Area fill - appears after line draws */}
        <path
          d={areaD}
          fill="url(#chartGrad)"
          style={{
            opacity: Math.max(0, progress - 0.3) / 0.7,
            transformOrigin: "bottom",
            transform: `scaleY(${Math.min(1, progress / 0.5)})`,
          }}
        />

        {/* Main line with glow */}
        <path
          d={pathD}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={totalLen}
          strokeDashoffset={dashOffset}
          filter="url(#glow)"
        />

        {/* Moving dot */}
        {progress > 0.01 && (
          <>
            {/* Outer glow ring */}
            <circle
              cx={dotPos.x}
              cy={dotPos.y}
              r={10}
              fill="var(--color-primary)"
              opacity={0.15}
            >
              <animate
                attributeName="r"
                values="8;14;8"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.2;0.05;0.2"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>
            {/* Inner dot */}
            <circle
              cx={dotPos.x}
              cy={dotPos.y}
              r={4}
              fill="var(--color-primary)"
              stroke="var(--color-background)"
              strokeWidth={2}
            />
          </>
        )}

        {/* Y-axis labels */}
        <text x={4} y={scaleY(0.25) - 4} fill="var(--color-muted-foreground)" fontSize={9} opacity={progress > 0.2 ? 0.6 : 0}>
          +24.8%
        </text>
        <text x={4} y={scaleY(0.5) - 4} fill="var(--color-muted-foreground)" fontSize={9} opacity={progress > 0.3 ? 0.6 : 0}>
          +12%
        </text>
        <text x={4} y={scaleY(0.75) - 4} fill="var(--color-muted-foreground)" fontSize={9} opacity={progress > 0.1 ? 0.6 : 0}>
          شروع
        </text>
      </svg>
    </div>
  );
}
