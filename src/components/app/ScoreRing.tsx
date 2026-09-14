/**
 * The one match-score ring. Extracted verbatim from the local copy in
 * src/routes/matches.tsx so the Digest and the A-ha screen cannot drift.
 * Callers keep their own sizes/colours through props; the 100% treatment is
 * shared and is the whole reason this lives in one place.
 */
export function ScoreRing({
  score,
  size = 52,
  stroke = 4,
  trackColor = "#E3E7E8",
  accentColor = "#0E735A",
  ariaLabel,
}: {
  score: number;
  size?: number;
  stroke?: number;
  trackColor?: string;
  accentColor?: string;
  ariaLabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  // A perfect match reads as a solid disc rather than a closed ring. Filling
  // the progress circle lands exactly: radius r plus the 4px stroke centred on
  // that path comes to size / 2, so the disc fills the box with no seam.
  const perfect = score >= 100;
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel ?? `${score} percent match`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={accentColor}
          strokeWidth={stroke}
          fill={perfect ? accentColor : "none"}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="butt"
        />
      </svg>
      <span
        className="absolute text-[14px]"
        style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 400,
          lineHeight: 1,
          color: perfect ? "#FFFFFF" : "#090B0C",
        }}
      >
        {score}%
      </span>
    </div>
  );
}
