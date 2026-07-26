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
  onlyMissing = false,
  className = "",
}: {
  job: Job;
  wrap?: boolean;
  onlyMissing?: boolean;
  className?: string;
}) {
  const groups = useMemo(() => {
    const g = deriveMatchGroups(job);
    return onlyMissing ? g.filter((x) => x.tone === "missing") : g;
  }, [job, onlyMissing]);
  const segments = useMemo(() => flatten(groups), [groups]);
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(segments.length);
  const [maxLines, setMaxLines] = useState(1);

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
      const lines = typeof window !== "undefined" && window.innerWidth < 768 ? 2 : 1;
      setMaxLines(lines);
      const kids = Array.from(measure.children) as HTMLElement[];
      const reserve = 44; // room for "+ N" chip
      // Group children by row (offsetTop bucket).
      const rowTops: number[] = [];
      const rowOf: number[] = [];
      kids.forEach((c) => {
        const t = c.offsetTop;
        let idx = rowTops.findIndex((v) => Math.abs(v - t) < 2);
        if (idx === -1) {
          rowTops.push(t);
          idx = rowTops.length - 1;
        }
        rowOf.push(idx);
      });

      // If everything fits within maxLines rows, show all.
      if (rowTops.length <= lines) {
        setVisible(kids.length);
        return;
      }

      // Keep only items in rows 0..lines-1.
      let cutoff = kids.length;
      for (let i = 0; i < kids.length; i++) {
        if (rowOf[i] > lines - 1) {
          cutoff = i;
          break;
        }
      }
      // Trim from the end of the last kept row to make room for "+ N" chip.
      const lastRow = lines - 1;
      while (cutoff > 0 && rowOf[cutoff - 1] === lastRow) {
        const c = kids[cutoff - 1];
        const right = c.offsetLeft + c.offsetWidth;
        if (right + 8 + reserve <= cw) break;
        cutoff -= 1;
      }
      setVisible(cutoff);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(container);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [segments, wrap]);

  if (!segments.length) return null;

  // In wrap mode (Match details panel), render each group as its own row for
  // a cleaner read: "Label" on the left, chips on the right.
  if (wrap) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {groups.map((g) => {
          const match = g.tone === "match";
          return (
            <div
              key={g.label}
              className="grid grid-cols-[88px_1fr] items-start gap-x-3 gap-y-1 sm:grid-cols-[104px_1fr]"
            >
              <span
                className="pt-[3px] text-[13px] text-[color:var(--color-text-secondary)]"
                style={{ fontWeight: 300 }}
              >
                {g.label}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((it) => (
                  <span
                    key={it}
                    className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[12px]"
                    style={{
                      background: match ? "var(--color-mint)" : "var(--color-danger-subtle)",
                      color: match ? "var(--color-green)" : "var(--color-danger)",
                    }}
                  >
                    {it}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const shown = wrap ? segments : segments.slice(0, visible);
  const hidden = segments.length - shown.length;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {!wrap ? (
        <div
          ref={measureRef}
          aria-hidden
          className="pointer-events-none invisible absolute inset-x-0 top-0 flex flex-wrap items-center gap-x-2 gap-y-2"
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
          wrap || maxLines > 1 ? "flex-wrap gap-y-2" : "overflow-hidden whitespace-nowrap",
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