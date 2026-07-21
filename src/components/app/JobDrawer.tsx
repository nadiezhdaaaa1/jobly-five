import { useEffect, useRef, useState } from "react";
import { IconBookmark as Bookmark, IconCheck as Check, IconExternalLink as ExternalLink, IconFileText as FileText, IconFlag as Flag, IconPencil as Pencil, IconThumbDown as ThumbsDown, IconX as X, IconBolt as Zap } from "@tabler/icons-react";
import type { CardState, Job } from "@/lib/jobs-data";

function ago(days: number) {
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

function useOutsideClose(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onClose]);
  return ref;
}

function BigRing({ score }: { score: number }) {
  const size = 64;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${score} percent match`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-border)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-green)" strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[16px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
        {score}%
      </span>
    </div>
  );
}

export function JobDrawer({
  job,
  state,
  setState,
  onClose,
}: {
  job: Job;
  state: CardState;
  setState: (s: CardState) => void;
  onClose: () => void;
}) {
  const [dislikeOpen, setDislikeOpen] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const dislikeRef = useOutsideClose(dislikeOpen, () => setDislikeOpen(false));
  const applyRef = useOutsideClose(applyOpen, () => setApplyOpen(false));
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = `job-drawer-title-${job.id}`;

  const saved = state === "saved";
  const applied = state === "applied";

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const reducedMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const description = job.description ?? [
    { heading: "About the role", body: "The employer provided a short listing." },
  ];
  const criteria = job.criteria ?? [];
  const details = job.details ?? {};
  const sources = job.sources ?? [
    { name: job.source === "direct" ? "Company careers page" : "Aggregated listing", role: "primary" as const },
  ];

  return (
    <div className="fixed inset-0 z-50" role="presentation">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: "rgba(9,11,12,.32)" }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="absolute right-0 top-0 flex h-full w-full flex-col bg-[color:var(--color-surface-1)] outline-none md:w-[480px] md:border-l"
        style={{
          boxShadow: "0 8px 24px rgba(0,0,0,.12)",
          animation: reducedMotion ? undefined : "job-drawer-in 160ms ease-out",
        }}
      >
        <style>{`@keyframes job-drawer-in { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b bg-[color:var(--color-surface-1)] px-5 pb-4 pt-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-foreground)] text-[16px] font-semibold text-white">
              {job.company.charAt(0)}
            </div>
            <h2 id={titleId} className="min-w-0 flex-1 text-[18px] font-semibold leading-snug text-[color:var(--color-foreground)]">
              {job.title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
            >
              <X size={16} strokeWidth={1.6} />
            </button>
          </div>
          <div className="mt-2 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {job.company} · {job.location} · {job.salary || <span className="text-[color:var(--color-text-muted)]">Salary not listed</span>} · {job.employmentType ?? "Full-time"}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {job.source === "direct" ? (
              <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[12px] text-[color:var(--color-green)]">Direct employer</span>
            ) : (
              <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[12px] text-[color:var(--color-text-secondary)]">Aggregated</span>
            )}
            <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[12px] text-[color:var(--color-text-muted)]">
              {ago(job.postedDays)}
            </span>
          </div>
        </div>

        {/* Sticky action row */}
        <div className="sticky top-[136px] z-10 flex items-center gap-2 border-b bg-[color:var(--color-surface-1)] px-5 py-3">
          <div className="relative" ref={dislikeRef}>
            <button
              type="button"
              aria-label="Dislike or report"
              aria-haspopup="menu"
              aria-expanded={dislikeOpen}
              onClick={() => setDislikeOpen((v) => !v)}
              className="flex h-[32px] w-[32px] items-center justify-center rounded-[4px] border text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
            >
              <ThumbsDown size={15} strokeWidth={1.6} />
            </button>
            {dislikeOpen ? (
              <div
                role="menu"
                className="absolute left-0 top-[36px] z-30 min-w-[240px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]"
                style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                  onClick={() => {
                    setState("dismissed");
                    setDislikeOpen(false);
                    onClose();
                  }}
                >
                  <ThumbsDown size={15} strokeWidth={1.6} className="text-[color:var(--color-text-muted)]" />
                  Dislike — not a good match
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-subtle)]"
                  onClick={() => {
                    setState("reported");
                    setDislikeOpen(false);
                    onClose();
                  }}
                >
                  <Flag size={15} strokeWidth={1.6} />
                  Report — looks fake or ghost
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Save to tracker"
            aria-pressed={saved}
            onClick={() => setState(saved ? "default" : "saved")}
            className={`flex h-[32px] w-[32px] items-center justify-center rounded-[4px] border ${saved ? "border-[color:var(--color-green)] bg-[color:var(--color-mint)] text-[color:var(--color-green)]" : "text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"}`}
          >
            <Bookmark size={15} strokeWidth={1.6} fill={saved ? "currentColor" : "none"} />
          </button>

          <div className="ml-auto">
            {applied ? (
              <span className="inline-flex items-center gap-1 rounded-[4px] bg-[color:var(--color-mint)] px-3 py-1.5 text-[13px] font-semibold text-[color:var(--color-green)]">
                <Check size={14} strokeWidth={2} />
                Applied
              </span>
            ) : (
              <div className="relative" ref={applyRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={applyOpen}
                  onClick={() => setApplyOpen((v) => !v)}
                  className="inline-flex h-[32px] items-center gap-1 rounded-[4px] bg-[color:var(--color-accent)] px-3 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
                >
                  Apply
                  <Zap size={13} strokeWidth={2} fill="currentColor" />
                </button>
                {applyOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[36px] z-30 min-w-[240px] overflow-hidden rounded-[6px] border bg-[color:var(--color-surface-1)]"
                    style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
                  >
                    <div className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-[color:var(--color-text-muted)]" aria-disabled>
                      <span className="flex items-center gap-2"><Pencil size={14} strokeWidth={1.6} /> Tailor your resume</span>
                      <span className="rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[10px]">Coming soon</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 px-3 py-2 text-[13px] text-[color:var(--color-text-muted)]" aria-disabled>
                      <span className="flex items-center gap-2"><FileText size={14} strokeWidth={1.6} /> Generate a cover letter</span>
                      <span className="rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[10px]">Coming soon</span>
                    </div>
                    <div className="border-t" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        window.open(job.postingUrl ?? "#", "_blank");
                        setApplyOpen(false);
                        setState("applied");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[color:var(--color-surface-2)]"
                    >
                      <ExternalLink size={14} strokeWidth={1.6} />
                      Open posting to apply
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {/* Match section */}
          <div className="flex gap-4 rounded-[8px] bg-[color:var(--color-surface-2)] p-4">
            <BigRing score={job.score} />
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold text-[color:var(--color-foreground)]">Why this matches you</h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {criteria.slice(0, 5).map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-[color:var(--color-foreground)]" style={{ fontWeight: 300 }}>
                    {c.status === "full" ? (
                      <Check size={14} strokeWidth={2.2} className="mt-[3px] shrink-0 text-[color:var(--color-green)]" aria-hidden />
                    ) : (
                      <span className="mt-[3px] shrink-0 text-[color:var(--color-text-muted)]" aria-hidden>~</span>
                    )}
                    <span>{c.text}</span>
                  </li>
                ))}
                {criteria.length === 0 ? (
                  <li className="text-[13px] text-[color:var(--color-text-muted)]">{job.why}</li>
                ) : null}
              </ul>
            </div>
          </div>

          {/* Description */}
          <div className="mt-6 flex flex-col gap-5">
            {description.map((section, i) => (
              <section key={i}>
                <h4 className="text-[13px] font-semibold text-[color:var(--color-text-secondary)]">{section.heading}</h4>
                {section.body ? (
                  <p className="mt-2 text-[14px] text-[color:var(--color-foreground)]" style={{ fontWeight: 300, lineHeight: 1.6 }}>
                    {section.body}
                  </p>
                ) : null}
                {section.bullets ? (
                  <ul className="mt-2 list-disc pl-5 text-[14px] text-[color:var(--color-foreground)]" style={{ fontWeight: 300, lineHeight: 1.6 }}>
                    {section.bullets.map((b, bi) => <li key={bi}>{b}</li>)}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          {/* Details */}
          <div className="mt-6">
            <h4 className="text-[13px] font-semibold text-[color:var(--color-text-secondary)]">Details</h4>
            <dl className="mt-2 divide-y border-y">
              {[
                ["Employment type", details.employmentType ?? job.employmentType ?? "Full-time"],
                ["Experience level", details.experienceLevel ?? "Senior"],
                ["Workplace", details.workplace ?? job.location],
                ["Posted", details.postedDate ?? `${ago(job.postedDays).replace("Posted ", "")}`],
                ["Job ID", details.jobId ?? job.id.toUpperCase()],
              ].map(([k, v]) => (
                <div key={k as string} className="flex items-center justify-between gap-4 py-2 text-[13px]">
                  <dt className="text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>{k}</dt>
                  <dd className="text-right text-[color:var(--color-foreground)]" style={{ fontWeight: 300 }}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Sources */}
          <div className="mt-6 rounded-[6px] border bg-[color:var(--color-surface-1)] p-3">
            <h4 className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Sources</h4>
            <div className="mt-2 flex flex-col gap-2">
              {sources.filter((s) => s.role === "primary").map((s, i) => (
                <a key={`p-${i}`} href={s.url ?? "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[13px] text-[color:var(--color-foreground)] hover:underline">
                  <span aria-hidden className="inline-block h-2 w-2 rounded-full bg-[color:var(--color-green)]" />
                  <span className="flex-1">{s.name}</span>
                  <ExternalLink size={13} strokeWidth={1.6} className="text-[color:var(--color-text-muted)]" />
                </a>
              ))}
              {sources.some((s) => s.role === "secondary") ? (
                <div className="text-[12px] text-[color:var(--color-text-muted)]">
                  Also found on: {sources.filter((s) => s.role === "secondary").map((s) => s.name).join(", ")}
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex flex-col gap-3">
            <p className="text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
              Match scores are estimates based on your profile. Jobly doesn't guarantee interviews or employment.
            </p>
            <button
              type="button"
              onClick={() => {
                setState("reported");
                onClose();
              }}
              className="self-start text-[13px] font-semibold text-[color:var(--color-danger)] hover:underline"
            >
              Report — looks fake or ghost
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}