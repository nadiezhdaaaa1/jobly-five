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


// SSR + reduced-motion + WebGL-unavailable fallback, and the bed the canvas
// cross-fades in over. Composed from the shader's own palette rather than by
// eye: #0E735A occupies slots 0, 1 and 3 (slot 0 doubling as the base wash)
// and #22936C slot 2, so the field is mostly deep green; evaluating shade()'s
// pool centres at t=0 puts the pink of slot 4 up and left and the #2CFF8E of
// slot 5 down and right. Each bloom fades to its own hue at zero alpha, not to
// `transparent`, which some browsers interpolate through black.
const STATIC_FALLBACK =
  "radial-gradient(65% 55% at 8% 12%, #FBBCDE 0%, rgba(251, 188, 222, 0) 60%)," +
  "radial-gradient(70% 60% at 92% 88%, #2CFF8E 0%, rgba(44, 255, 142, 0) 62%)," +
  "radial-gradient(120% 110% at 50% 45%, #22936C 0%, #0E735A 65%)";

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
