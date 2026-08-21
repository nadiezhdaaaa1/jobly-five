import { useEffect, useRef, useState } from "react";
import { IconSparkles as Sparkle } from "@tabler/icons-react";

import kernovaAsset from "../../assets/logos-fake/Kernova.jpg.asset.json";
import pixelharborAsset from "../../assets/logos-fake/Pixelharbor.jpg.asset.json";
import { ScoreRing } from "./ScoreRing";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

const DWELL_MS = 3000;
const LEAVE_MS = 340;

type Match = {
  company: string;
  /** Alto is our own mark, drawn as a glyph; the rest use company logos. */
  logo?: string;
  title: string;
  meta: string;
  scores: { label: string; value: number }[];
};

const MATCHES: Match[] = [
  {
    company: "Alto",
    title: "Senior Data Analyst",
    meta: "Remote · 1 hour ago",
    scores: [
      { label: "Experience", value: 95 },
      { label: "Skill", value: 93 },
      { label: "Industry", value: 96 },
    ],
  },
  {
    company: "Kernova",
    logo: kernovaAsset.url,
    title: "Staff Platform Engineer",
    meta: "Remote · 3 hours ago",
    scores: [
      { label: "Experience", value: 92 },
      { label: "Skill", value: 97 },
      { label: "Industry", value: 89 },
    ],
  },
  {
    company: "Pixelharbor",
    logo: pixelharborAsset.url,
    title: "Senior Product Designer",
    meta: "Austin, TX · 5 hours ago",
    scores: [
      { label: "Experience", value: 96 },
      { label: "Skill", value: 91 },
      { label: "Industry", value: 94 },
    ],
  },
];

const RING_DELAYS = [140, 200, 260];

function MatchCard({ match, index, animate }: { match: Match; index: number; animate: boolean }) {
  return (
    <div className="w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-4">
      <div className="hero-card-row mb-3 flex items-center justify-between text-xs text-[color:var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Sparkle size={12} className="text-[color:var(--color-green)]" />
          Top match
        </span>
        <span className="tabular-nums">{index + 1} / 5</span>
      </div>
      <div className="hero-card-row flex items-start gap-3" style={{ animationDelay: "60ms" }}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[color:var(--color-foreground)] text-[color:var(--color-background)]">
          {match.logo ? (
            <img src={match.logo} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          ) : (
            <span style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>▲</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{match.title}</p>
          <p className="truncate text-xs text-[color:var(--color-text-muted)]">
            {match.company} · {match.meta}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[color:var(--color-border)] pt-4">
        {match.scores.map((s, i) => (
          <ScoreRing
            key={`${index}-${s.label}`}
            value={s.value}
            label={s.label}
            size={64}
            animate={animate}
            delayMs={RING_DELAYS[i]}
          />
        ))}
      </div>
    </div>
  );
}

export function HeroMatchDeck() {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const activeRef = useRef(0);

  useEffect(() => {
    if (reduced || paused) return;
    const id = setInterval(() => {
      setLeaving(activeRef.current);
      activeRef.current = (activeRef.current + 1) % MATCHES.length;
      setActive(activeRef.current);
    }, DWELL_MS);
    return () => clearInterval(id);
  }, [reduced, paused]);

  useEffect(() => {
    if (leaving === null) return;
    const id = setTimeout(() => setLeaving(null), LEAVE_MS);
    return () => clearTimeout(id);
  }, [leaving]);

  return (
    <div
      className="absolute left-5 top-5 z-10 w-[280px] md:w-[320px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {leaving !== null && (
        <div key={`leave-${leaving}`} className="hero-card-leave absolute inset-x-0 top-0 z-20" aria-hidden="true">
          <MatchCard match={MATCHES[leaving]} index={leaving} animate={false} />
        </div>
      )}
      <div key={`enter-${active}`} className="hero-card-enter relative z-10">
        <MatchCard match={MATCHES[active]} index={active} animate={!reduced} />
      </div>

      {/* The rest of today's five, fanned out below */}
      <div className="absolute left-1/2 top-[calc(100%-128px)] z-[-1] h-[140px] w-[250px] -translate-x-1/2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] md:w-[290px]" />
      <div className="absolute left-1/2 top-[calc(100%-76px)] z-[-2] h-[100px] w-[230px] -translate-x-1/2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] md:w-[270px]" />
    </div>
  );
}
