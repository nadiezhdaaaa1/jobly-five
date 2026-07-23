import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Job } from "@/lib/jobs-data";
import { cn } from "@/lib/utils";

export type MatchTone = "match" | "missing";
export type MatchGroup = { label: string; tone: MatchTone; items: string[] };

export function deriveMatchGroups(job: Job): MatchGroup[] {
  const skills: string[] = [];
  let seniority: string | null = null;
  let salary: { text: string; tone: MatchTone } | null = null;
  let location: { text: string; tone: MatchTone } | null = null;

  for (const c of job.criteria ?? []) {
    const colon = c.text.indexOf(":");
    const head = (colon >= 0 ? c.text.slice(0, colon) : c.text).trim().toLowerCase();
    const rest = colon >= 0 ? c.text.slice(colon + 1) : "";
    const value = rest.split("—")[0].trim();
    if (head === "stack" && c.status === "full") {
      for (const s of value.split(",")) {
        const t = s.trim();
        if (t) skills.push(t);
      }
    } else if (head === "level") {
      const raw = value.split(/[\s/]+/)[0] ?? "";
      if (raw) seniority = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
    } else if (head === "salary") {
      const d = c.text.toLowerCase();
      if (d.includes("inside")) salary = { text: "In range", tone: "match" };
      else if (d.includes("above") || d.includes("top")) salary = { text: "Above range", tone: "missing" };
      else if (d.includes("below")) salary = { text: "Below range", tone: "missing" };
      else salary = { text: "Near range", tone: c.status === "full" ? "match" : "missing" };
    } else if (head === "location") {
      const v = value.toLowerCase();
      const text = v.includes("remote") ? "Remote" : v.includes("hybrid") ? "Hybrid" : "On-site";
      location = { text, tone: c.status === "full" ? "match" : "missing" };
    }
  }

  const groups: MatchGroup[] = [];
  if (skills.length) groups.push({ label: "Skills", tone: "match", items: skills });
  if (job.missingSkills?.length) groups.push({ label: "Missing", tone: "missing", items: job.missingSkills });
  if (seniority) groups.push({ label: "Seniority", tone: "match", items: [seniority] });
  if (salary) groups.push({ label: "Salary", tone: salary.tone, items: [salary.text] });
  if (location) groups.push({ label: "Location", tone: location.tone, items: [location.text] });
  return groups;
}

type Segment = {
  key: string;
  label: string | null;
  item: string;
  tone: MatchTone;
};

function flatten(groups: MatchGroup[]): Segment[] {
  const segs: Segment[] = [];
  groups.forEach((g, gi) => {
    g.items.forEach((it, ii) => {
      segs.push({
        key: `${gi}-${ii}`,
        label: ii === 0 ? g.label : null,
        item: it,
        tone: g.tone,
      });
    });
  });
  return segs;
}

function SegmentView({ seg, showBullet }: { seg: Segment; showBullet?: boolean }) {
  const match = seg.tone === "match";
  return (
    <span className="inline-flex shrink-0 items-center gap-2">
      {showBullet ? (
        <span
          aria-hidden
          className="text-[13px] text-[color:var(--color-text-secondary)]"
          style={{ fontWeight: 300 }}
        >
          •
        </span>
      ) : null}
      {seg.label ? (
        <span
          className="text-[13px] text-[color:var(--color-text-secondary)]"
          style={{ fontWeight: 300 }}
        >
          {seg.label}
        </span>
      ) : null}
      <span
        className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[12px]"
        style={{
          background: match ? "var(--color-mint)" : "var(--color-danger-subtle)",
          color: match ? "var(--color-green)" : "var(--color-danger)",
        }}
      >
        {seg.item}
      </span>
    </span>
  );
}

export function MatchLine({
  job,
  wrap = false,
  className = "",
}: {
  job: Job;
  wrap?: boolean;
  className?: string;
}) {
  const groups = useMemo(() => deriveMatchGroups(job), [job]);
  const segments = useMemo(() => flatten(groups), [groups]);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(segments.length);

  useLayoutEffect(() => {
    if (wrap) {
      setVisible(segments.length);
      return;
    }
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const compute = () => {
      const cw = container.clientWidth;
      if (!cw) return;
      const kids = Array.from(measure.children) as HTMLElement[];
      const reserve = 44; // room for "+ N" chip
      let last = segments.length;
      for (let i = 0; i < kids.length; i++) {
        const c = kids[i];
        const right = c.offsetLeft + c.offsetWidth;
        const isLast = i === kids.length - 1;
        const budget = isLast ? cw : cw - reserve;
        if (right > budget) {
          last = i;
          break;
        }
      }
      setVisible(last);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    return () => ro.disconnect();
  }, [segments, wrap]);

  if (!segments.length) return null;

  const shown = wrap ? segments : segments.slice(0, visible);
  const hidden = segments.length - shown.length;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {!wrap ? (
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute left-0 top-0 flex items-center gap-x-2 whitespace-nowrap"
        >
          {segments.map((s) => (
            <SegmentView
              key={`m-${s.key}`}
              seg={s}
              showBullet={!!s.label && s !== segments[0]}
            />
          ))}
        </div>
      ) : null}
      <div
        className={cn(
          "flex items-center gap-x-2",
          wrap ? "flex-wrap gap-y-2" : "overflow-hidden whitespace-nowrap",
        )}
      >
        {shown.map((s, i) => (
          <SegmentView key={s.key} seg={s} showBullet={!!s.label && i !== 0} />
        ))}
        {hidden > 0 ? (
          <span className="inline-flex shrink-0 items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[12px] text-[color:var(--color-text-secondary)]">
            + {hidden}
          </span>
        ) : null}
      </div>
    </div>
  );
}