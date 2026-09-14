/**
 * The one match-score ring. Extracted verbatim from the local copy in
 * src/routes/matches.tsx so the Digest and the A-ha screen cannot drift.
 * Callers keep their own sizes/colours through props; the 100% treatment is
 * shared and is the whole reason this lives in one place.
 *
 * `loading` and `locked` are optional and default to false, so a caller that
 * does not pass them (the A-ha screen) can never reach either state. The Digest
 * passes them from its existing entitlement read: match_score is a Pro feature,
 * and the Digest itself is gated on having any plan, so a Watch subscriber must
 * see the locked --% and never a real percentage.
 */
export function ScoreRing({
  score,
  size = 52,
  stroke = 4,
  trackColor = "#E3E7E8",
  accentColor = "#0E735A",
  ariaLabel,
  loading = false,
  locked = false,
}: {
  score: number;
  size?: number;
  stroke?: number;
  trackColor?: string;
  accentColor?: string;
  ariaLabel?: string;
  /** Entitlements still resolving: render the skeleton, never a score. */
  loading?: boolean;
  /** No match_score entitlement: render --%, never a score. */
  locked?: boolean;
}) {
  if (loading) {
    return (
      <div
        className="shrink-0 animate-pulse rounded-full"
        style={{ width: size, height: size, background: "var(--color-surface-2)" }}
        aria-label="Loading match score"
      />
    );
  }
  if (locked) {
    return (
      <div
        className="relative flex shrink-0 items-center justify-center rounded-full"
        style={{ width: size, height: size, background: "var(--color-surface-2)" }}
        aria-label="Match score locked — upgrade to Pro"
      >
        <span
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 400,
            fontSize: 14,
            lineHeight: 1,
            color: "#090B0C",
          }}
        >
          --%
        </span>
      </div>
    );
  }
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
