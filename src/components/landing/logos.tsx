// Wordmark-style source logos rendered as SVG text so we avoid brand image assets.

import type { CSSProperties } from "react";

type LogoProps = { className?: string };

const base: CSSProperties = { fontFamily: "var(--font-display)" };

export function JoobleLogo({ className }: LogoProps) {
  return (
    <span className={className} style={{ ...base, color: "#0057FF", fontWeight: 600, fontSize: 22, letterSpacing: "-0.02em" }}>
      jooble
    </span>
  );
}

export function GreenhouseLogo({ className }: LogoProps) {
  return (
    <span className={className} style={{ ...base, color: "#3AB37E", fontWeight: 600, fontSize: 20, letterSpacing: "-0.01em" }}>
      greenhouse
    </span>
  );
}

export function LeverLogo({ className }: LogoProps) {
  return (
    <span className={className} style={{ ...base, color: "#67787C", fontWeight: 500, fontSize: 20, letterSpacing: "0.42em" }}>
      LEVER
    </span>
  );
}

export function AshbyLogo({ className }: LogoProps) {
  return (
    <span className={className} style={{ ...base, color: "#3F1C86", fontWeight: 700, fontSize: 22, fontStyle: "italic", letterSpacing: "-0.02em" }}>
      Ashby
    </span>
  );
}

export function UsaJobsLogo({ className }: LogoProps) {
  return (
    <span className={className} style={{ ...base, color: "#D00D01", fontWeight: 700, fontSize: 20, letterSpacing: "0.02em" }}>
      USAJOBS
    </span>
  );
}