import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

const DOT_COUNT = 460;
const PICK_COUNT = 5;
/** Sphere radius as a fraction of the canvas's short side. Tune to taste. */
const RADIUS_RATIO = 0.44;

export function MatchSphere({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fibonacci sphere: even coverage with no clustering at the poles.
    const golden = Math.PI * (3 - Math.sqrt(5));
    const points = Array.from({ length: DOT_COUNT }, (_, i) => {
      const y = 1 - (i / (DOT_COUNT - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
    });

    // The five picks, spread evenly through the sequence so they sit at
    // different latitudes and never bunch together.
    const picks = new Set(
      Array.from({ length: PICK_COUNT }, (_, k) =>
        Math.round(((k + 0.5) / PICK_COUNT) * (DOT_COUNT - 1)),
      ),
    );

    const styles = getComputedStyle(document.documentElement);
    const dotColor = styles.getPropertyValue("--alt-light-mist").trim() || "#D0D6D8";
    const pickColor = styles.getPropertyValue("--accent").trim() || "#00F1A9";

    let raf = 0;
    let width = 0;
    let height = 0;
    let visible = document.visibilityState === "visible";
    let inView = true;
    let disposed = false;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      raf = 0;
      if (disposed) return;
      const t = reduced ? 0 : (now - start) / 1000;
      const spin = t * 0.16;
      const tilt = -0.24;
      const cy = Math.cos(spin);
      const sy = Math.sin(spin);
      const cx = Math.cos(tilt);
      const sx = Math.sin(tilt);
      const radius = Math.min(width, height) * RADIUS_RATIO;
      const ox = width / 2;
      const oy = height / 2;

      ctx.clearRect(0, 0, width, height);

      const projected = points.map((p, i) => {
        // Rotate about Y, then tilt about X.
        const x1 = p.x * cy + p.z * sy;
        const z1 = -p.x * sy + p.z * cy;
        const y2 = p.y * cx - z1 * sx;
        const z2 = p.y * sx + z1 * cx;
        return { x: ox + x1 * radius, y: oy + y2 * radius, z: z2, pick: picks.has(i) };
      });
      // Painter's algorithm, so front dots sit over back ones.
      projected.sort((a, b) => a.z - b.z);

      for (const p of projected) {
        const depth = (p.z + 1) / 2; // 0 back, 1 front
        ctx.globalAlpha = p.pick ? 0.45 + 0.55 * depth : 0.2 + 0.8 * depth;
        ctx.fillStyle = p.pick ? pickColor : dotColor;
        const r = (p.pick ? 4.2 : 1.7) * (0.62 + 0.38 * depth);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (!reduced) request();
    };

    function request() {
      if (!disposed && visible && inView && raf === 0) raf = requestAnimationFrame(draw);
    }

    const onResize = () => {
      resize();
      request();
    };

    resize();
    // Paint one frame synchronously so a still sphere is always present, even
    // under reduced motion or if an observer cancels the first rAF.
    draw(performance.now());

    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
      if (inView) request();
      else if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(canvas);
    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      if (visible) request();
      else if (raf !== 0) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
