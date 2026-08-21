import { useEffect, useState } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

type Props = {
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  /** Draw the arc and count the number up on mount. */
  animate?: boolean;
  /** Stagger, in ms, before this ring starts drawing. */
  delayMs?: number;
};

export function ScoreRing({ value, label, size = 72, strokeWidth = 6, animate = false, delayMs = 0 }: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const target = circumference - (value / 100) * circumference;

  const reduced = usePrefersReducedMotion();
  const active = animate && !reduced;

  const [offset, setOffset] = useState(active ? circumference : target);
  const [shown, setShown] = useState(active ? 0 : value);

  useEffect(() => {
    if (!active) {
      setOffset(target);
      setShown(value);
      return;
    }
    const DURATION = 700;
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / DURATION);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const timer = window.setTimeout(() => {
      setOffset(target);
      raf = requestAnimationFrame(tick);
    }, delayMs);
    // Safety net: if the main thread is busy enough that rAF never fires (the
    // hero shader can starve it), land on the real number instead of holding 0%.
    const snap = window.setTimeout(() => {
      setOffset(target);
      setShown(value);
    }, delayMs + DURATION + 80);
    return () => {
      clearTimeout(timer);
      clearTimeout(snap);
      cancelAnimationFrame(raf);
    };

  }, [active, value, target, circumference, delayMs]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--color-surface-2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--color-green)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: active ? "stroke-dashoffset 700ms cubic-bezier(0.22,1,0.36,1)" : undefined }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-display)", fontSize: size >= 72 ? 18 : 14 }}>
            {shown}%
          </span>
        </div>
      </div>
      <span className="text-xs text-[color:var(--color-text-secondary)]">{label}</span>
    </div>
  );
}
