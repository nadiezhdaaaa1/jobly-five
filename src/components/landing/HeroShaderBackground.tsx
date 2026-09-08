import { useEffect, useState } from "react";
import { GrainGradient } from "@paper-design/shaders-react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

// Full Figma palette, ordered dark -> light. GrainGradient maps the array onto a
// scalar field (for shape="wave" that field is directional along the pattern Y
// axis, grain-perturbed), so array order corresponds to a spatial axis that
// `rotation` aims.
const HERO_COLORS = [
  "#0E735A",
  "#22936C",
  "#7DA49C",
  "#CCCECF",
  "#2CDB84",
  "#56E29A",
  "#F3CAE1",
];
const HERO_COLOR_BACK = "#0E735A";


// Stands in for the shader canvas only (SSR, reduced motion, no WebGL): the same
// dark-green upper-left to light lower-right run the steered shader produces, so
// the pre-mount frame and the shader read the same way.
const STATIC_FALLBACK =
  "radial-gradient(120% 110% at 88% 96%, #F3CAE1 0%, #56E29A 14%, #2CDB84 28%, #CCCECF 44%, #7DA49C 58%, #22936C 74%, #0E735A 90%)";

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
      {/* speed 0 under reduced motion: one still frame. rotation + offsetY aim the
          light end of the ramp at the lower right, keeping the dark greens over the
          nav and the white hero copy at upper left. */}
      {mounted && (
        <GrainGradient
          className="absolute inset-0 h-full w-full"
          colors={HERO_COLORS}
          colorBack={HERO_COLOR_BACK}
          shape="wave"
          speed={reducedMotion ? 0 : 0.3}
          scale={1.4}
          softness={0.8}
          intensity={0.25}
          noise={0.3}
          rotation={315}
          offsetY={0.5}
        />
      )}


    </div>
  );
}
