import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Clock, ExternalLink, StickyNote, X } from "lucide-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";

export const Route = createFileRoute("/_authenticated/tracker")({
  head: () => ({
    meta: [
      { title: "Tracker — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TrackerScreen,
});

// ---------- Types & data ----------

type Status = "saved" | "applied" | "interview" | "offer" | "rejected";

type Reminder = {
  label: string; // "Follow up tomorrow"
  overdue?: boolean;
};

type TimelineEntry = { status: Status; date: string };

type Application = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  score: number;
  status: Status;
  savedOn?: string;
  appliedOn?: string;
  reminder?: Reminder;
  notesCount?: number;
  notes?: string;
  timeline: TimelineEntry[];
};

const STATUS_ORDER: Status[] = ["saved", "applied", "interview", "offer", "rejected"];
const STATUS_LABEL: Record<Status, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

const INITIAL: Application[] = [
  // Saved (4)
  { id: "s1", title: "Lead UI Developer", company: "Nimbus Corp", location: "Remote (US)", salary: "$160–200K", score: 95, status: "saved", savedOn: "Jul 18", reminder: { label: "Follow up tomorrow" }, timeline: [{ status: "saved", date: "Jul 18" }] },
  { id: "s2", title: "Staff Frontend Engineer", company: "Vercel", location: "Remote (US)", salary: "$190–230K", score: 79, status: "saved", savedOn: "Jul 19", timeline: [{ status: "saved", date: "Jul 19" }] },
  { id: "s3", title: "Senior React Engineer", company: "Vertex Solutions", location: "Remote (US)", salary: "$165–205K", score: 74, status: "saved", savedOn: "Jul 16", timeline: [{ status: "saved", date: "Jul 16" }] },
  { id: "s4", title: "Senior Software Engineer, Web", company: "Figma", location: "Hybrid, San Francisco", salary: "$175–215K", score: 68, status: "saved", savedOn: "Jul 19", timeline: [{ status: "saved", date: "Jul 19" }] },
  // Applied (6)
  { id: "a1", title: "Frontend Architect", company: "Helix Innovations", location: "Remote (US)", salary: "$180–220K", score: 71, status: "applied", appliedOn: "Jul 14", savedOn: "Jul 10", reminder: { label: "Follow-up overdue", overdue: true }, notesCount: 2, notes: "Recruiter: Ana. Discussed salary range $190K base.", timeline: [{ status: "saved", date: "Jul 10" }, { status: "applied", date: "Jul 14" }] },
  { id: "a2", title: "Senior Frontend Engineer", company: "Linear", location: "Remote (US)", salary: "$170–210K", score: 76, status: "applied", appliedOn: "Jul 15", savedOn: "Jul 12", timeline: [{ status: "saved", date: "Jul 12" }, { status: "applied", date: "Jul 15" }] },
  { id: "a3", title: "Senior Product Engineer", company: "Notion", location: "Hybrid, New York", salary: "$180–220K", score: 72, status: "applied", appliedOn: "Jul 17", savedOn: "Jul 13", timeline: [{ status: "saved", date: "Jul 13" }, { status: "applied", date: "Jul 17" }] },
  { id: "a4", title: "Senior Frontend Developer", company: "Ramp", location: "Hybrid, New York", salary: "$175–210K", score: 70, status: "applied", appliedOn: "Jul 12", savedOn: "Jul 09", timeline: [{ status: "saved", date: "Jul 09" }, { status: "applied", date: "Jul 12" }] },
  { id: "a5", title: "Principal Frontend Developer", company: "Orion Tech", location: "Hybrid, Los Angeles", salary: "$150–190K", score: 86, status: "applied", appliedOn: "Jul 19", savedOn: "Jul 15", timeline: [{ status: "saved", date: "Jul 15" }, { status: "applied", date: "Jul 19" }] },
  { id: "a6", title: "UI Engineer Lead", company: "Quantum Leap", location: "Remote (US)", salary: "$175–215K", score: 70, status: "applied", appliedOn: "Jul 20", savedOn: "Jul 17", timeline: [{ status: "saved", date: "Jul 17" }, { status: "applied", date: "Jul 20" }] },
  // Interview (2)
  { id: "i1", title: "Senior Frontend Engineer", company: "Stripe", location: "Remote (US)", salary: "$200–240K", score: 88, status: "interview", appliedOn: "Jul 08", savedOn: "Jul 05", reminder: { label: "Screen on Jul 24" }, notesCount: 3, notes: "Recruiter screen with Mia. Onsite planned week of Jul 28.", timeline: [{ status: "saved", date: "Jul 05" }, { status: "applied", date: "Jul 08" }, { status: "interview", date: "Jul 18" }] },
  { id: "i2", title: "Staff Product Engineer", company: "Anthropic", location: "Hybrid, San Francisco", salary: "$220–260K", score: 82, status: "interview", appliedOn: "Jul 10", savedOn: "Jul 06", reminder: { label: "Take-home due Jul 23" }, notesCount: 1, notes: "Take-home: design a small React tool. 5 days to complete.", timeline: [{ status: "saved", date: "Jul 06" }, { status: "applied", date: "Jul 10" }, { status: "interview", date: "Jul 19" }] },
  // Offer (1)
  { id: "o1", title: "Lead Frontend Engineer", company: "Retool", location: "Remote (US)", salary: "$205–235K", score: 84, status: "offer", appliedOn: "Jun 30", savedOn: "Jun 27", notesCount: 4, notes: "Offer: $215K base + equity. Deadline Jul 25.", timeline: [{ status: "saved", date: "Jun 27" }, { status: "applied", date: "Jun 30" }, { status: "interview", date: "Jul 09" }, { status: "offer", date: "Jul 19" }] },
  // Rejected (2)
  { id: "r1", title: "Senior Frontend Engineer", company: "Airbnb", location: "Hybrid, San Francisco", salary: "$180–220K", score: 65, status: "rejected", appliedOn: "Jul 02", savedOn: "Jun 29", timeline: [{ status: "saved", date: "Jun 29" }, { status: "applied", date: "Jul 02" }, { status: "rejected", date: "Jul 15" }] },
  { id: "r2", title: "Senior Web Engineer", company: "Shopify", location: "Remote (Canada)", salary: "$160–195K", score: 60, status: "rejected", appliedOn: "Jul 05", savedOn: "Jul 01", timeline: [{ status: "saved", date: "Jul 01" }, { status: "applied", date: "Jul 05" }, { status: "rejected", date: "Jul 17" }] },
];

// ---------- Small UI atoms ----------

function CompanySquare({ name, size = 28 }: { name: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-foreground)] text-[color:var(--color-surface-1)]"
      style={{ width: size, height: size, fontFamily: "var(--font-display)", fontSize: size >= 40 ? 18 : 13 }}
      aria-hidden
    >
      {initial}
    </div>
  );
}

function ScoreRing({ score, size = 52 }: { score: number; size?: number }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative flex shrink-0 items-center justify-center" style={{ width: size, height: size }} role="img" aria-label={`${score} percent match`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-border)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-green)" strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-[14px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
        {score}%
      </span>
    </div>
  );
}

function GrayTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-[3px] text-[12px] text-[color:var(--color-text-secondary)]">
      {children}
    </span>
  );
}

function ReminderChip({ reminder }: { reminder: Reminder }) {
  const cls = reminder.overdue
    ? "bg-[color:var(--color-warning-subtle)] text-[color:var(--color-foreground)]"
    : "bg-[color:var(--color-mint)] text-[color:var(--color-green)]";
  return (
    <span className={`inline-flex items-center gap-1 rounded-[4px] px-2 py-[3px] text-[12px] ${cls}`}>
      <Clock size={12} strokeWidth={1.8} />
      {reminder.label}
    </span>
  );
}

// ---------- Application card ----------

function AppCard({
  app,
  onOpen,
  draggable,
  onDragStart,
  onDragEnd,
}: {
  app: Application;
  onOpen: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}) {
  const dateLabel = app.status === "saved"
    ? `Saved ${app.savedOn ?? ""}`.trim()
    : `Applied ${app.appliedOn ?? app.savedOn ?? ""}`.trim();
  const dim = app.status === "rejected";
  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`group cursor-pointer rounded-[6px] border bg-[color:var(--color-surface-1)] p-3 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] ${dim ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <CompanySquare name={app.company} />
        <span className="text-[14px] font-semibold text-[color:var(--color-green)]" style={{ fontFamily: "var(--font-display)" }}>
          {app.score}%
        </span>
      </div>
      <div className="mt-2 line-clamp-2 text-[14px] font-semibold leading-snug text-[color:var(--color-foreground)]">
        {app.title}
      </div>
      <div className="mt-1 text-[12px] text-[color:var(--color-text-secondary)]">
        {app.company} · {app.location}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <GrayTag>{dateLabel}</GrayTag>
        {app.reminder ? <ReminderChip reminder={app.reminder} /> : null}
        {app.notesCount ? (
          <span className="inline-flex items-center gap-1 text-[12px] text-[color:var(--color-text-muted)]">
            <StickyNote size={12} strokeWidth={1.8} />
            {app.notesCount}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ---------- Drawer ----------

function Drawer({
  app,
  onClose,
  onStatusChange,
  onNotesSave,
  onRemove,
  onReport,
  onSetReminder,
  onClearReminder,
}: {
  app: Application;
  onClose: () => void;
  onStatusChange: (s: Status) => void;
  onNotesSave: (notes: string) => void;
  onRemove: () => void;
  onReport: () => void;
  onSetReminder: (label: string) => void;
  onClearReminder: () => void;
}) {
  const [notes, setNotes] = useState(app.notes ?? "");
  const [savedFlash, setSavedFlash] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setNotes(app.notes ?? ""), [app.id, app.notes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleBlur = () => {
    if (notes !== (app.notes ?? "")) {
      onNotesSave(notes);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`${app.title} details`}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        ref={drawerRef}
        className="absolute right-0 top-0 flex h-full w-full flex-col overflow-y-auto border-l bg-[color:var(--color-surface-1)] sm:w-[420px]"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
      >
        <div className="flex items-start justify-between gap-3 border-b p-5">
          <div className="flex items-start gap-3">
            <CompanySquare name={app.company} size={40} />
            <div className="min-w-0">
              <div className="text-[16px] font-semibold leading-snug text-[color:var(--color-foreground)]">{app.title}</div>
              <div className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]">
                {app.company} · {app.location} · {app.salary}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ScoreRing score={app.score} size={52} />
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="rounded-[4px] p-1 text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
            >
              <X size={18} strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <div className="space-y-5 p-5">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-[4px] border px-3 py-2 text-[13px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
          >
            <ExternalLink size={14} strokeWidth={1.8} />
            Open posting
          </button>

          <div>
            <div className="mb-2 text-[12px] uppercase tracking-wide text-[color:var(--color-text-muted)]">Status</div>
            <div className="flex flex-wrap gap-1 rounded-[4px] border p-1">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => onStatusChange(s)}
                  className={`flex-1 rounded-[4px] px-2 py-1.5 text-[12px] transition-colors ${
                    s === app.status
                      ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
                      : "text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[12px] uppercase tracking-wide text-[color:var(--color-text-muted)]">Timeline</div>
            <div className="rounded-[4px] border">
              {app.timeline.map((t, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 text-[13px] ${i > 0 ? "border-t" : ""}`}>
                  <span className="text-[color:var(--color-foreground)]">{STATUS_LABEL[t.status]}</span>
                  <span className="text-[color:var(--color-text-muted)]">{t.date}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[12px] uppercase tracking-wide text-[color:var(--color-text-muted)]">Follow-up reminder</div>
            {app.reminder ? (
              <div className={`flex items-center justify-between rounded-[4px] px-3 py-2 text-[13px] ${app.reminder.overdue ? "bg-[color:var(--color-warning-subtle)]" : "bg-[color:var(--color-mint)] text-[color:var(--color-green)]"}`}>
                <span className="inline-flex items-center gap-2">
                  <Clock size={14} strokeWidth={1.8} />
                  {app.reminder.label}
                </span>
                <div className="flex items-center gap-3">
                  <button className="text-[12px] underline" onClick={() => setReminderOpen((v) => !v)}>Edit</button>
                  <button className="text-[12px] underline" onClick={onClearReminder}>Remove</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setReminderOpen((v) => !v)}
                className="text-[13px] text-[color:var(--color-green)] underline"
              >
                Set a reminder
              </button>
            )}
            {reminderOpen ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {["In 3 days", "In 1 week"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      onSetReminder(`Follow up ${label.toLowerCase()}`);
                      setReminderOpen(false);
                    }}
                    className="rounded-[4px] border px-2 py-1 text-[12px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[12px] uppercase tracking-wide text-[color:var(--color-text-muted)]">Notes</div>
              {savedFlash ? (
                <span className="text-[11px] text-[color:var(--color-green)]">Saved</span>
              ) : null}
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleBlur}
              placeholder="Notes — contacts, salary discussed, next steps…"
              rows={5}
              className="w-full resize-y rounded-[4px] border bg-[color:var(--color-surface-1)] p-3 text-[13px] text-[color:var(--color-foreground)] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]"
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4 text-[12px]">
            <button type="button" onClick={onReport} className="text-[color:var(--color-danger)] hover:underline">
              Report — looks fake or ghost
            </button>
            <button type="button" onClick={onRemove} className="text-[color:var(--color-text-muted)] hover:underline">
              Remove from tracker
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Column ----------

function Column({
  status,
  apps,
  onOpen,
  onDropStatus,
  onDragStart,
  onDragEnd,
  dragOver,
  setDragOver,
}: {
  status: Status;
  apps: Application[];
  onOpen: (id: string) => void;
  onDropStatus: (status: Status) => void;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  dragOver: Status | null;
  setDragOver: (s: Status | null) => void;
}) {
  const isDropTarget = dragOver === status;
  return (
    <div
      className="flex min-w-[240px] flex-col"
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(status);
      }}
      onDragLeave={() => {
        if (dragOver === status) setDragOver(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropStatus(status);
        setDragOver(null);
      }}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="text-[14px] font-semibold text-[color:var(--color-foreground)]">{STATUS_LABEL[status]}</span>
        <span className="inline-flex min-w-[22px] items-center justify-center rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-[1px] text-[11px] text-[color:var(--color-text-secondary)]">
          {apps.length}
        </span>
      </div>
      <div className="flex flex-col gap-[10px]">
        {apps.map((a) => (
          <AppCard
            key={a.id}
            app={a}
            onOpen={() => onOpen(a.id)}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", a.id);
              e.dataTransfer.effectAllowed = "move";
              onDragStart(a.id);
            }}
            onDragEnd={onDragEnd}
          />
        ))}
        {apps.length === 0 ? (
          <div
            className={`hidden h-[60px] items-center justify-center rounded-[6px] border border-dashed text-[12px] text-[color:var(--color-text-muted)] lg:flex ${isDropTarget ? "border-[color:var(--color-border-strong)]" : "border-[color:var(--color-border-strong)]"}`}
          >
            Drag a card here
          </div>
        ) : null}
        {isDropTarget ? (
          <div className="h-[60px] rounded-[6px] border-2 border-dashed border-[color:var(--color-border-strong)]" />
        ) : null}
      </div>
    </div>
  );
}

// ---------- Toast ----------

type Toast =
  | { kind: "offer"; id: number }
  | { kind: "report"; id: number; appId: string; snapshot: Application }
  | { kind: "info"; id: number; message: string };

function ToastLayer({
  toast,
  onDismiss,
  onUndoReport,
}: {
  toast: Toast | null;
  onDismiss: () => void;
  onUndoReport: (t: Extract<Toast, { kind: "report" }>) => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(onDismiss, 6500);
    return () => window.clearTimeout(id);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-[6px] border bg-[color:var(--color-surface-1)] px-4 py-3 text-[13px] text-[color:var(--color-foreground)]"
      style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
    >
      {toast.kind === "offer" ? (
        <div className="flex items-center gap-4">
          <span>An offer — congrats! 🎉 Found your job?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-[4px] bg-[color:var(--color-accent)] px-3 py-1.5 text-[12px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
              onClick={onDismiss}
            >
              Pause my digest
            </button>
            <button
              type="button"
              className="rounded-[4px] border px-3 py-1.5 text-[12px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
              onClick={onDismiss}
            >
              Not yet
            </button>
          </div>
        </div>
      ) : toast.kind === "report" ? (
        <div className="flex items-center gap-4">
          <span>Thanks — we'll check this posting.</span>
          <button type="button" className="text-[12px] font-semibold text-[color:var(--color-green)] underline" onClick={() => onUndoReport(toast)}>
            Undo
          </button>
        </div>
      ) : (
        <span>{toast.message}</span>
      )}
    </div>
  );
}

// ---------- Screen ----------

function TrackerScreen() {
  const [apps, setApps] = useState<Application[]>(INITIAL);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastIdRef = useRef(1);

  const openApp = useMemo(() => apps.find((a) => a.id === openId) ?? null, [apps, openId]);

  const grouped = useMemo(() => {
    const map: Record<Status, Application[]> = { saved: [], applied: [], interview: [], offer: [], rejected: [] };
    for (const a of apps) map[a.status].push(a);
    return map;
  }, [apps]);

  const followUpCount = apps.filter((a) => a.reminder).length;

  const changeStatus = useCallback(
    (id: string, next: Status) => {
      setApps((prev) => {
        return prev.map((a) => {
          if (a.id !== id) return a;
          if (a.status === next) return a;
          const timeline = [...a.timeline, { status: next, date: "today" }];
          return { ...a, status: next, timeline };
        });
      });
      const moved = apps.find((a) => a.id === id);
      if (moved && next === "offer" && moved.status !== "offer") {
        setToast({ kind: "offer", id: toastIdRef.current++ });
      }
    },
    [apps],
  );

  const removeApp = useCallback((id: string) => {
    setApps((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const reportApp = useCallback(
    (id: string) => {
      const snapshot = apps.find((a) => a.id === id);
      if (!snapshot) return;
      setApps((prev) => prev.filter((a) => a.id !== id));
      setToast({ kind: "report", id: toastIdRef.current++, appId: id, snapshot });
    },
    [apps],
  );

  const setReminder = useCallback((id: string, label: string) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, reminder: { label } } : a)));
  }, []);

  const clearReminder = useCallback((id: string) => {
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, reminder: undefined } : a)));
  }, []);

  const saveNotes = useCallback((id: string, notes: string) => {
    setApps((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, notes, notesCount: notes.trim() ? Math.max(a.notesCount ?? 1, 1) : 0 }
          : a,
      ),
    );
  }, []);

  const handleDrop = useCallback(
    (status: Status) => {
      if (!draggingId) return;
      changeStatus(draggingId, status);
      setDraggingId(null);
    },
    [draggingId, changeStatus],
  );

  const undoReport = useCallback((t: Extract<Toast, { kind: "report" }>) => {
    setApps((prev) => (prev.some((a) => a.id === t.snapshot.id) ? prev : [...prev, t.snapshot]));
    setToast(null);
  }, []);

  const total = apps.length;
  const empty = total === 0;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <AppHeader active="tracker" />
      <main className="mx-auto max-w-[1200px] px-6 pb-24 pt-6">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <h1 className="text-[24px] font-normal text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
            Tracker
          </h1>
          {!empty ? (
            <div className="text-[13px] text-[color:var(--color-text-muted)]">
              {total} application{total === 1 ? "" : "s"}
              {followUpCount > 0 ? ` · ${followUpCount} need${followUpCount === 1 ? "s" : ""} a follow-up` : ""}
            </div>
          ) : null}
        </div>

        {empty ? (
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-[8px] border bg-[color:var(--color-surface-1)] p-10 text-center">
            <div className="text-[18px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Nothing tracked yet
            </div>
            <p className="text-[13px] text-[color:var(--color-text-secondary)]">
              Save a job from your digest and it appears here.
            </p>
            <Link
              to="/dashboard"
              className="mt-1 inline-flex items-center rounded-[4px] bg-[color:var(--color-accent)] px-4 py-2 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
            >
              Open digest
            </Link>
          </div>
        ) : (
          <>
            {/* Desktop kanban */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-5 gap-4 overflow-x-auto">
                {STATUS_ORDER.map((s) => (
                  <Column
                    key={s}
                    status={s}
                    apps={grouped[s]}
                    onOpen={setOpenId}
                    onDropStatus={handleDrop}
                    onDragStart={setDraggingId}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOver(null);
                    }}
                    dragOver={dragOver}
                    setDragOver={setDragOver}
                  />
                ))}
              </div>
            </div>

            {/* Mobile grouped list */}
            <div className="space-y-8 lg:hidden">
              {STATUS_ORDER.map((s) =>
                grouped[s].length > 0 ? (
                  <section key={s}>
                    <div className="mb-3 flex items-center gap-2">
                      <h2 className="text-[14px] font-semibold text-[color:var(--color-foreground)]">{STATUS_LABEL[s]}</h2>
                      <span className="inline-flex min-w-[22px] items-center justify-center rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-[1px] text-[11px] text-[color:var(--color-text-secondary)]">
                        {grouped[s].length}
                      </span>
                    </div>
                    <div className="flex flex-col gap-[10px]">
                      {grouped[s].map((a) => (
                        <AppCard key={a.id} app={a} onOpen={() => setOpenId(a.id)} />
                      ))}
                    </div>
                  </section>
                ) : null,
              )}
            </div>
          </>
        )}
      </main>

      <MobileTabBar active="tracker" />

      {openApp ? (
        <Drawer
          app={openApp}
          onClose={() => setOpenId(null)}
          onStatusChange={(s) => changeStatus(openApp.id, s)}
          onNotesSave={(n) => saveNotes(openApp.id, n)}
          onRemove={() => {
            removeApp(openApp.id);
            setOpenId(null);
          }}
          onReport={() => {
            const id = openApp.id;
            setOpenId(null);
            reportApp(id);
          }}
          onSetReminder={(label) => setReminder(openApp.id, label)}
          onClearReminder={() => clearReminder(openApp.id)}
        />
      ) : null}

      <ToastLayer toast={toast} onDismiss={() => setToast(null)} onUndoReport={undoReport} />
    </div>
  );
}