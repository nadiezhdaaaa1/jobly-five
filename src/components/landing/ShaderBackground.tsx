import { useEffect, useRef } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * "Mesh drift" WebGL background.
 *
 * Palette is the hero's own mesh-gradient set, except index 0 (the base wash),
 * which is the deep-teal panel colour so the shader dissolves into flat panel
 * rather than dark blotches.
 */
const UNIFORMS = {
  timeScale: 0.12,
  scale: 1.35,
  warp: 0.65,
  grain: 0.06,
  colors: [
    [0.07450980392156863, 0.25882352941176473, 0.28627450980392155], // #134249 panel base
    [0.08627450980392157, 0.3058823529411765, 0.38823529411764707], // #164e63
    [0.03137254901960784, 0.396078431372549, 0.48627450980392156], // #08657c
    [0.0392156862745098, 0.42745098039215684, 0.5019607843137255], // #0a6d80
    [0.0392156862745098, 0.41568627450980394, 0.38823529411764707], // #0a6a63
    [0.0392156862745098, 0.41568627450980394, 0.38823529411764707],
    [0.0392156862745098, 0.41568627450980394, 0.38823529411764707],
    [0.0392156862745098, 0.41568627450980394, 0.38823529411764707],
  ] as [number, number, number][],
  colorCount: 5,
};

const VERT = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform vec2 u_resolution;
// x: time, y: timeScale, z: scale, w: warp
uniform vec4 u_scene;
uniform float u_grain;
uniform vec3 u_colors[8];
uniform int u_colorCount;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

void main() {
  float t = u_scene.x * u_scene.y;
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (uv - 0.5) * vec2(u_resolution.x / max(u_resolution.y, 1.0), 1.0) * u_scene.z;

  // Domain warp — the "drift".
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3 - t)));
  vec2 r = vec2(fbm(p + u_scene.w * q + vec2(1.7, 9.2) + 0.15 * t),
                fbm(p + u_scene.w * q + vec2(8.3, 2.8) - 0.12 * t));
  float f = fbm(p + u_scene.w * r);
  float m = clamp(f * 1.6 + 0.5, 0.0, 1.0);

  float count = float(u_colorCount);
  float s = m * (count - 1.0);
  int i0 = int(floor(s));
  float frac = s - floor(s);

  vec3 col = u_colors[0];
  for (int i = 0; i < 7; i++) {
    if (i == i0) {
      col = mix(u_colors[i], u_colors[i + 1], frac);
    }
  }

  // Soft highlight following the warp, keeps the mesh from reading flat.
  col += vec3(0.03, 0.07, 0.08) * smoothstep(0.55, 1.0, length(r));

  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * u_grain;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function ShaderBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: true,
      // Single still frame (reduced motion) would otherwise be cleared after compositing.
      preserveDrawingBuffer: true,
      powerPreference: "low-power",
    });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, "u_resolution");
    const uScene = gl.getUniformLocation(program, "u_scene");
    const uGrain = gl.getUniformLocation(program, "u_grain");
    const uColors = gl.getUniformLocation(program, "u_colors");
    const uColorCount = gl.getUniformLocation(program, "u_colorCount");

    const flat = new Float32Array(24);
    UNIFORMS.colors.forEach((c, i) => flat.set(c, i * 3));
    gl.uniform3fv(uColors, flat);
    gl.uniform1i(uColorCount, UNIFORMS.colorCount);
    gl.uniform1f(uGrain, UNIFORMS.grain);

    const timeScale = reduced ? 0 : UNIFORMS.timeScale;
    const timeAnimated = timeScale !== 0;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };

    let raf = 0;
    let running = false;
    let visible = true;
    let onScreen = true;
    const start = performance.now();

    const draw = (now: number) => {
      gl.uniform4f(
        uScene,
        (now - start) / 1000,
        timeScale,
        UNIFORMS.scale,
        UNIFORMS.warp,
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const frame = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(frame);
    };

    const sync = () => {
      const should = timeAnimated && visible && onScreen;
      if (should && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      } else if (!should && running) {
        running = false;
        cancelAnimationFrame(raf);
      }
      // Still frame for reduced motion / paused states.
      if (!timeAnimated) draw(performance.now());
    };

    resize();
    sync();
    if (!timeAnimated) draw(performance.now());

    const ro = new ResizeObserver(() => {
      resize();
      if (!running) draw(performance.now());
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        onScreen = entries.some((e) => e.isIntersecting);
        sync();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      sync();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduced]);

  // Keyed on `reduced`: cleanup releases the GL context via WEBGL_lose_context, and a
  // canvas whose context was lost cannot hand out a fresh one — so remount the element.
  return <canvas key={reduced ? "still" : "animated"} ref={canvasRef} className={className} aria-hidden="true" />;
}
