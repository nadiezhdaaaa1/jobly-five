import { useEffect, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

// Jobly palette: the showcase's warm accent (#f97316) is swapped for
// our brand accent #00F1A9. The cyans stay — they produce the corner bleed.
const BASE_COLORS = ["#000000", "#06b6d4", "#0891b2", "#164e63", "#00F1A9"];
const WIRE_COLORS = ["#000000", "#ffffff", "#06b6d4", "#00F1A9"];

// SSR + reduced-motion + WebGL-unavailable fallback. Approximates the
// animated mesh so there is never a flash of empty black.
const STATIC_FALLBACK =
  "radial-gradient(120% 110% at 0% 0%, #0bb8cf 0%, #0e6b74 22%, #12333a 48%, #090B0C 78%), " +
  "radial-gradient(80% 70% at 70% 100%, rgba(0,241,169,0.18) 0%, rgba(0,241,169,0) 60%)";

export function HeroShaderBackground() {
  // TanStack Start renders on the server; the shader canvas is client-only.
  const [mounted, setMounted] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: STATIC_FALLBACK }}
    >
      {mounted && (
        <>
          <MeshGradient
            className="absolute inset-0 h-full w-full"
            colors={BASE_COLORS}
            speed={reducedMotion ? 0 : 0.3}
            distortion={0.8}
            swirl={0.1}
          />
          <MeshGradient
            className="absolute inset-0 h-full w-full opacity-60"
            colors={WIRE_COLORS}
            speed={reducedMotion ? 0 : 0.2}
            distortion={1}
            swirl={0.8}
            grainOverlay={0.15}
          />
        </>
      )}

    </div>
  );
}
