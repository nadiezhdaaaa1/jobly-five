import { useEffect, useRef } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

const DOT_COUNT = 2600;
const PICK_COUNT = 5;
/** Sphere radius as a fraction of the canvas's short side. */
const RADIUS_RATIO = 0.46;
/** Inclination, radius multiplier and drift speed for each orbital ring. */
const RINGS = [
  { incl: 0.42, scale: 1.16, speed: 0.10 },
  { incl: -0.78, scale: 1.26, speed: 0.14 },
  { incl: 1.15, scale: 1.35, speed: 0.08 },
];
const RING_DOTS = 150;

type P = { x: number; y: number; z: number; pick: boolean; ring: boolean };

export function MatchSphere({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fibonacci sphere: even coverage with no clustering at the poles. A small
    // deterministic jitter keeps it from reading as a perfect geometric shell.
    const golden = Math.PI * (3 - Math.sqrt(5));
    const shell = Array.from({ length: DOT_COUNT }, (_, i) => {
      const y = 1 - (i / (DOT_COUNT - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      const jitter = 0.97 + 0.06 * ((Math.sin(i * 12.9898) * 43758.5453) % 1);
      return { x: Math.cos(theta) * r * jitter, y: y * jitter, z: Math.sin(theta) * r * jitter };
    });

    // The five picks, spread evenly through the sequence so they sit at
    // different latitudes and never bunch together.
    const picks = new Set(
      Array.from({ length: PICK_COUNT }, (_, k) =>
        Math.round(((k + 0.5) / PICK_COUNT) * (DOT_COUNT - 1)),
      ),
    );

    const styles = getComputedStyle(document.documentElement);
    const dotColor = styles.getPropertyValue("--text-secondary").trim() || "#4B585B";
    const pickColor = styles.getPropertyValue("--accent").trim() || "#00F1A9";

    // Pre-allocated so the render loop never allocates.
    const buf: P[] = Array.from({ length: DOT_COUNT + RINGS.length * RING_DOTS }, () => ({
      x: 0, y: 0, z: 0, pick: false, ring: false,
    }));

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
      const tilt = -0.24;
      const ct = Math.cos(tilt);
      const st = Math.sin(tilt);
      const radius = Math.min(width, height) * RADIUS_RATIO;
      const ox = width / 2;
      const oy = height / 2;

      ctx.clearRect(0, 0, width, height);

      let n = 0;
      const spin = t * 0.16;
      const cs = Math.cos(spin);
      const ss = Math.sin(spin);
      for (let i = 0; i < DOT_COUNT; i++) {
        const p = shell[i];
        const x1 = p.x * cs + p.z * ss;
        const z1 = -p.x * ss + p.z * cs;
        const o = buf[n++];
        o.x = ox + x1 * radius;
        o.y = oy + (p.y * ct - z1 * st) * radius;
        o.z = p.y * st + z1 * ct;
        o.pick = picks.has(i);
        o.ring = false;
      }
      for (const ring of RINGS) {
        const rs = t * ring.speed;
        const cr = Math.cos(rs);
        const sr = Math.sin(rs);
        const ci = Math.cos(ring.incl);
        const si = Math.sin(ring.incl);
        for (let k = 0; k < RING_DOTS; k++) {
          const a = (k / RING_DOTS) * Math.PI * 2;
          // Ring in its own plane, inclined about X, then spun about Y.
          const px = Math.cos(a) * ring.scale;
          const pz0 = Math.sin(a) * ring.scale;
          const py = -pz0 * si;
          const pz = pz0 * ci;
          const x1 = px * cr + pz * sr;
          const z1 = -px * sr + pz * cr;
          const o = buf[n++];
          o.x = ox + x1 * radius;
          o.y = oy + (py * ct - z1 * st) * radius;
          o.z = py * st + z1 * ct;
          o.pick = false;
          o.ring = true;
        }
      }

      // Painter's algorithm, so front points sit over back ones.
      // n always fills buf, so sort in place rather than allocating a copy each frame.
      buf.sort((a, b) => a.z - b.z);

      for (const p of buf) {
        const depth = (p.z + 1) / 2; // 0 back, 1 front
        if (p.pick) {
          // Luminous node: soft halo behind a solid core.
          const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
          halo.addColorStop(0, pickColor);
          halo.addColorStop(1, "transparent");
          ctx.globalAlpha = 0.28 * (0.5 + 0.5 * depth);
          ctx.fillStyle = halo;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 0.55 + 0.45 * depth;
          ctx.fillStyle = pickColor;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3.6 * (0.7 + 0.3 * depth), 0, Math.PI * 2);
          ctx.fill();
          continue;
        }
        ctx.fillStyle = dotColor;
        ctx.globalAlpha = p.ring ? 0.08 + 0.22 * depth : 0.12 + 0.42 * depth;
        const r = (p.ring ? 0.9 : 1.15) * (0.62 + 0.38 * depth);
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
