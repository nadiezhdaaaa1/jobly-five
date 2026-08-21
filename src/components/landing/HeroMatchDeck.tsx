import { useEffect, useRef, useState } from "react";
import { IconSparkles as Sparkle } from "@tabler/icons-react";

import kernovaAsset from "../../assets/logos-fake/Kernova.jpg.asset.json";
import pixelharborAsset from "../../assets/logos-fake/Pixelharbor.jpg.asset.json";
import { ScoreRing } from "./ScoreRing";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

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

const DWELL_MS = 5000;
const FLY_MS = 460;

const SLOTS = [
  { transform: "translateY(0px) scale(1)", zIndex: 30, shadow: "0 18px 40px rgba(9, 11, 12, 0.28)" },
  { transform: "translateY(26px) scale(0.94)", zIndex: 20, shadow: "0 10px 24px rgba(9, 11, 12, 0.18)" },
  { transform: "translateY(50px) scale(0.88)", zIndex: 10, shadow: "0 6px 16px rgba(9, 11, 12, 0.12)" },
];

const RING_DELAYS = [140, 200, 260];

function MatchCard({
  match,
  index,
  isFront,
  cycle,
  reduced,
}: {
  match: Match;
  index: number;
  isFront: boolean;
  cycle: number;
  reduced: boolean;
}) {
  return (
    <div className="w-full rounded-md bg-[color:var(--color-surface-1)] p-4">
      <div className="mb-3 flex items-center justify-between text-xs text-[color:var(--color-text-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <Sparkle size={12} className="text-[color:var(--color-green)]" />
          Top match
        </span>
        <span className="tabular-nums">{index + 1} / 5</span>
      </div>
      <div className="flex items-start gap-3">
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
          // Re-keying on arrival at the front slot replays the draw + count-up.
          <ScoreRing
            key={`${isFront ? cycle : "idle"}-${s.label}`}
            value={s.value}
            label={s.label}
            size={64}
            animate={isFront && !reduced}
            delayMs={RING_DELAYS[i]}
          />
        ))}
      </div>
    </div>
  );
}

export function HeroMatchDeck() {
  const reduced = usePrefersReducedMotion();
  const [front, setFront] = useState(0);
  const [outgoing, setOutgoing] = useState<number | null>(null);
  const [cycle, setCycle] = useState(0);
  const [paused, setPaused] = useState(false);
  const frontRef = useRef(0);

  useEffect(() => {
    if (reduced || paused) return;
    const id = setInterval(() => {
      setOutgoing(frontRef.current);
      frontRef.current = (frontRef.current + 1) % MATCHES.length;
      setFront(frontRef.current);
      setCycle((c) => c + 1);
    }, DWELL_MS);
    return () => clearInterval(id);
  }, [reduced, paused]);

  useEffect(() => {
    if (outgoing === null) return;
    const id = setTimeout(() => setOutgoing(null), FLY_MS);
    return () => clearTimeout(id);
  }, [outgoing]);

  return (
    <div
      className="absolute right-2 top-10 w-[280px] md:right-20 md:w-[320px] lg:right-16 lg:top-14 xl:right-0 2xl:right-[-130px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Spacer: the slot cards are absolute, so this gives the deck its height. */}
      <div className="invisible" aria-hidden="true">
        <MatchCard match={MATCHES[0]} index={0} isFront={false} cycle={0} reduced />
      </div>

      {MATCHES.map((m, i) => {
        const slot = (i - front + MATCHES.length) % MATCHES.length;
        const flying = i === outgoing;
        return (
          <div
            key={m.company}
            className="absolute inset-x-0 top-0 origin-top rounded-md"
            aria-hidden={slot !== 0}
            style={{
              transform: SLOTS[slot].transform,
              zIndex: SLOTS[slot].zIndex,
              boxShadow: SLOTS[slot].shadow,
              // Hidden while its stand-in flies away, so the glide from front
              // to back of the stack is never seen.
              visibility: flying ? "hidden" : "visible",
              opacity: flying ? 0 : 1,
              transition: reduced
                ? undefined
                : "transform 620ms cubic-bezier(0.32, 0.72, 0, 1), box-shadow 620ms ease, opacity 320ms ease-out 140ms",
            }}
          >
            <MatchCard match={m} index={i} isFront={slot === 0} cycle={cycle} reduced={reduced} />
          </div>
        );
      })}

      {/* The card being dealt away. A throwaway stand-in, so the real card can
          move to the back of the stack unseen. */}
      {outgoing !== null && !reduced && (
        <div
          key={`fly-${cycle}`}
          className="deck-card-fly pointer-events-none absolute inset-x-0 top-0 origin-top rounded-md"
          style={{ zIndex: 40, boxShadow: SLOTS[0].shadow }}
          aria-hidden="true"
        >
          <MatchCard match={MATCHES[outgoing]} index={outgoing} isFront={false} cycle={cycle} reduced />
        </div>
      )}
    </div>
  );
}
