import { useCallback, useEffect, useState } from "react";
import { ShaderBackground } from "./ShaderBackground";

// Jobly hero palette, taken from the literal ellipse fills in the Figma file.
// Slot order is deliberate: each index decides where that colour pools on screen
// (see shade() in ShaderBackground). Deep green #0E735A fills slots 0, 1 and 3,
// with slot 0 doubling as the base wash. Pink sits alone in slot 4 (top-left)
// and the light green alone in slot 5 (bottom-right, behind the photograph).
const HERO_COLORS: [number, number, number][] = [
  [0.05490196078431373, 0.45098039215686275, 0.35294117647058820], // #0E735A
  [0.05490196078431373, 0.45098039215686275, 0.35294117647058820], // #0E735A
  [0.13333333333333333, 0.57647058823529410, 0.42352941176470588], // #22936C
  [0.05490196078431373, 0.45098039215686275, 0.35294117647058820], // #0E735A
  [0.98431372549019602, 0.73725490196078436, 0.87058823529411766], // #FBBCDE
  [0.17254901960784313, 1.00000000000000000, 0.55686274509803924], // #2CFF8E
];


// SSR + reduced-motion + WebGL-unavailable fallback. Light gradient in the same
// family so there is no dark flash before the canvas mounts.
const STATIC_FALLBACK =
  "radial-gradient(140% 120% at 30% 0%, #FBBCDE 0%, #CBCDCF 18%, #7DA49C 38%, #22936C 60%, #2CFF8E 85%)";

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
          timeScale={0.16}
          grain={0.06}
        />

      )}
    </div>
  );
}
