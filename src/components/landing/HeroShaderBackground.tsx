import { useEffect, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

// Jobly palette, deliberately held dark enough to carry white hero copy.
// Every value is measured against white; the floor is the wireframe layer's
// composited bloom at roughly 4.7:1. The bright accent (#00F1A9) is reserved
// for the CTA, never used as a large wash behind type.
const BASE_COLORS = ["#090B0C", "#0A7185", "#0E6B74", "#104F57", "#0E735A"];
// The brights (#2CFF8E 1.33:1, #FBBCDE 1.58:1 vs white) live only here, at low
// opacity, so they read as bloom and never form a wash behind the headline.
const WIRE_COLORS = ["#090B0C", "#0E735A", "#2CFF8E", "#FBBCDE"];

// SSR + reduced-motion + WebGL-unavailable fallback. Approximates the
// animated mesh so there is never a flash of empty black.
const STATIC_FALLBACK =
  "radial-gradient(120% 110% at 0% 0%, #0A7185 0%, #0E6B74 22%, #104F57 46%, #12333A 64%, #090B0C 84%), " +
  "radial-gradient(80% 70% at 70% 100%, rgba(14, 115, 90, 0.28) 0%, rgba(14, 115, 90, 0) 60%)";

export function HeroShaderBackground() {
  // TanStack Start renders on the server; the shader canvas is client-only.
  const [mounted, setMounted] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setMounted(true);
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
            className="absolute inset-0 h-full w-full opacity-35"
            colors={WIRE_COLORS}
            speed={reducedMotion ? 0 : 0.2}
            distortion={1}
            swirl={0.8}
            grainOverlay={0.15}
          />
        </>
      )}

      {/* Contrast scrim: guarantees the headline stays legible wherever the
          mesh (and its brights) wander. Left 55%, deep to transparent. */}
      <div
        className="absolute inset-y-0 left-0 w-[55%]"
        style={{
          background:
            "linear-gradient(90deg, rgba(9, 11, 12, 0.45) 0%, rgba(9, 11, 12, 0) 100%)",
        }}
      />
    </div>
  );
}
