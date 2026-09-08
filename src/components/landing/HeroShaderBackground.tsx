import { useEffect, useState } from "react";
import { ShaderBackground } from "./ShaderBackground";

// Jobly hero palette, sampled from the Figma ellipse group (the light, pastel
// layer that actually shows). Index 0 is the shader's base wash — #7DA49C sits
// mid-range, so it anchors the field.
const HERO_COLORS: [number, number, number][] = [
  [0.49019607843137253, 0.64313725490196080, 0.61176470588235290], // #7DA49C
  [0.97254901960784310, 0.79607843137254900, 0.89411764705882350], // #F8CBE4
  [0.80000000000000000, 0.80784313725490200, 0.81176470588235290], // #CCCECF
  [0.13333333333333333, 0.57647058823529410, 0.42352941176470588], // #22936C
  [0.17254901960784313, 0.85882352941176470, 0.51764705882352940], // #2CDB84
  [0.33725490196078430, 0.88627450980392160, 0.60392156862745100], // #56E29A
];

// SSR + reduced-motion + WebGL-unavailable fallback. Light gradient in the same
// family so there is no dark flash before the canvas mounts.
const STATIC_FALLBACK =
  "radial-gradient(140% 120% at 30% 0%, #F8CBE4 0%, #CBCDCF 18%, #7DA49C 38%, #22936C 60%, #2CDB84 85%)";

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
          colorCount={6}
          seed={1453}
        />
      )}
    </div>
  );
}
