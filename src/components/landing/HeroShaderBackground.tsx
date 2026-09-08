import { useEffect, useState } from "react";
import { ShaderBackground } from "./ShaderBackground";

// Jobly hero base: greens only. Pink and mint are fixed CSS overlays below, so
// they can be sized and confined to regions the shader cannot express without
// extra per-slot uniforms (the shader is one vec4 under WebGL1's guaranteed 16).
const HERO_COLORS: [number, number, number][] = [
  [0.05490196078431373, 0.45098039215686275, 0.35294117647058820], // #0E735A
  [0.13333333333333333, 0.57647058823529410, 0.42352941176470588], // #22936C
  [0.05490196078431373, 0.45098039215686275, 0.35294117647058820], // #0E735A
  [0.13333333333333333, 0.57647058823529410, 0.42352941176470588], // #22936C
];


// SSR + reduced-motion + WebGL-unavailable fallback. Light gradient in the same
// family so there is no dark flash before the canvas mounts.
const STATIC_FALLBACK =
  "radial-gradient(140% 120% at 30% 0%, #F3CAE1 0%, #0E735A 30%, #0E735A 62%, #22936C 78%, #2CDB84 96%)";

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
          colorCount={4}
          seed={1453}
          timeScale={0.12}
          scale={1.4}
          intensity={0.68}
        />

      )}

      {/* Pink bloom: bottom-left band on small screens, upper right half at lg+. */}
      <div
        className="absolute left-[-15%] w-[85%] top-[48%] h-[32%] lg:left-1/2 lg:right-0 lg:w-auto lg:top-[-15%] lg:h-[60%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(243, 202, 225, 0.18) 0%, rgba(243, 202, 225, 0) 100%)",
          filter: "blur(100px)",
        }}
      />

      {/* Mint bloom: lower-right band on small screens, lower right half at lg+. */}
      <div
        className="absolute right-[-15%] w-[90%] top-[62%] h-[46%] lg:left-[48%] lg:right-0 lg:w-auto lg:top-[45%] lg:h-[70%]"
        style={{
          background:
            "radial-gradient(closest-side, rgba(44, 219, 132, 0.18) 0%, rgba(44, 219, 132, 0) 100%)",
          filter: "blur(100px)",
        }}
      />
    </div>
  );
}
