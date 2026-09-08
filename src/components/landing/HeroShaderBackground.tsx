import { useEffect, useState } from "react";
import { ShaderBackground } from "./ShaderBackground";

// Jobly hero palette, sampled from the Figma ellipse group (the light, pastel
// layer that actually shows). Slot order is deliberate: each index decides where
// that colour pools on screen (see shade() in ShaderBackground). Slot 0 doubles
// as the base wash. Pink is repeated in slots 3 and 4 — the two upper positions
// — so it spreads across the whole top, mirroring Figma's two pink ellipses.
const HERO_COLORS: [number, number, number][] = [
  [0.05490196078431373, 0.45098039215686275, 0.35294117647058820], // #0E735A
  [0.05490196078431373, 0.45098039215686275, 0.35294117647058820], // #0E735A
  [0.13333333333333333, 0.57647058823529410, 0.42352941176470588], // #22936C
  [0.05490196078431373, 0.45098039215686275, 0.35294117647058820], // #0E735A
  [0.97254901960784310, 0.79607843137254900, 0.89411764705882350], // #F8CBE4
  [0.17254901960784313, 0.85882352941176470, 0.51764705882352940], // #2CDB84
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
          timeScale={0.12}
        />

      )}
    </div>
  );
}
