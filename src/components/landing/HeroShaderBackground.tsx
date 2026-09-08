import { useEffect, useState } from "react";
import { ShaderBackground } from "./ShaderBackground";

// Jobly hero palette, sampled from the Figma concept. Index 0 is the shader's
// base wash. Every stop is dark enough to carry white hero copy; the brights
// (#2CFF8E, #FBBCDE) are deliberately kept out of the drifting mesh and only
// appear as the fixed, low-opacity blooms below.
const HERO_COLORS: [number, number, number][] = [
  [0.04313725490196078, 0.36470588235294120, 0.39607843137254900], // #0B5D65
  [0.03921568627450980, 0.44313725490196076, 0.52156862745098040], // #0A7185
  [0.05490196078431373, 0.45098039215686275, 0.35294117647058826], // #0E735A
  [0.07058823529411765, 0.20000000000000000, 0.22745098039215686], // #12333A
  [0.03529411764705882, 0.04313725490196078, 0.04705882352941176], // #090B0C
];

// SSR + reduced-motion + WebGL-unavailable fallback. Mirrors the Figma radial
// exactly so there is no colour shift when the canvas mounts.
const STATIC_FALLBACK =
  "radial-gradient(120% 110% at 0% 0%, #0A7185 0%, #0E6B74 22%, #104F57 35%, #12333A 48%, #0E1F23 63%, #090B0C 78%)";

// Fixed colour washes from the concept: two pink, one mint, one green. Static
// on purpose — feeding them into the mesh would let them drift behind copy.
// Opacities are contrast-checked against white text; do not raise them.
const BLOOMS = [
  {
    opacity: 0.18,
    background:
      "radial-gradient(closest-side, #FBBCDE 0%, rgba(251, 188, 222, 0) 100%)",
    className: "left-[35%] top-0 h-[820px] w-[1100px]",
  },
  {
    opacity: 0.12,
    background:
      "radial-gradient(closest-side, #FBBCDE 0%, rgba(251, 188, 222, 0) 100%)",
    className: "left-[85%] top-[5%] h-[520px] w-[640px]",
  },
  {
    opacity: 0.15,
    background:
      "radial-gradient(closest-side, #2CFF8E 0%, rgba(44, 255, 142, 0) 100%)",
    className: "left-[72%] top-[95%] h-[620px] w-[760px]",
  },
  {
    opacity: 0.2,
    background:
      "radial-gradient(closest-side, #0E735A 0%, rgba(14, 115, 90, 0) 100%)",
    className: "left-[78%] top-[45%] h-[900px] w-[1000px]",
  },
];

export function HeroShaderBackground() {
  // TanStack Start renders on the server; the shader canvas is client-only.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{ background: STATIC_FALLBACK }}
    >
      {/* Reduced motion is honoured inside ShaderBackground: one still frame. */}
      {mounted && (
        <ShaderBackground
          className="absolute inset-0 h-full w-full"
          colors={HERO_COLORS}
          colorCount={5}
          seed={1453}
        />
      )}

      {BLOOMS.map((bloom, i) => (
        <div
          key={i}
          className={`absolute -translate-x-1/2 -translate-y-1/2 ${bloom.className}`}
          style={{
            background: bloom.background,
            opacity: bloom.opacity,
            filter: "blur(90px)",
          }}
        />
      ))}

      {/* Contrast scrim: guarantees the headline stays legible wherever the
          mesh (and its blooms) wander. Left 55%, deep to transparent. */}
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
