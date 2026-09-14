import { useEffect, useState } from "react";
import { IconX as X, IconCalendar } from "@tabler/icons-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { findReminderConflicts } from "@/lib/tracker-store";
import { getDbJobById } from "@/lib/jobs-store";

// Legacy fallback for callers that haven't switched to per-column stage lists.
export const DEFAULT_INTERVIEW_STAGES = ["Recruiter screen", "Hiring manager screen"] as const;
export const DEFAULT_OFFER_STAGES = ["Received", "Negotiating", "Accepted"] as const;

function DialogShell({
  title,
  onCancel,
  children,
  footer,
}: {
  title: string;
  onCancel: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(9,11,12,.32)" }} onClick={onCancel} aria-hidden />
      <div
        className="relative z-10 w-[92%] max-w-[440px] rounded-[20px] border bg-[color:var(--color-surface-1)] p-6"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-[8px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
        >
          <X size={16} strokeWidth={1.6} />
        </button>
        <h2 className="pr-6 text-[18px] font-semibold text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
        <div className="mt-4 flex flex-col gap-4">{children}</div>
        <div className="mt-5 flex items-center justify-end gap-2">{footer}</div>
      </div>
    </div>
  );
}

const selectCls =
  "h-10 w-full rounded-[12px] border bg-[color:var(--color-surface-1)] px-3 pr-8 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]";
const textareaCls =
  "w-full resize-y rounded-[12px] border bg-[color:var(--color-surface-1)] p-3 text-[13px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]";

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function formatUS(d: Date) {
  return `${MONTHS_SHORT[d.getMonth()]} ${pad(d.getDate())} ${d.getFullYear()}`;
}
function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function isoFrom(date: string, time: string) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).toISOString();
}
function partsFromIso(iso: string) {
  const d = new Date(iso);
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function TimePickerAmPm({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hhStr, mmStr] = value.split(":");
  const h24 = Number(hhStr ?? "0") || 0;
  const mm = Number(mmStr ?? "0") || 0;
  const period: "AM" | "PM" = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  const emit = (nh12: number, nmm: number, np: "AM" | "PM") => {
    let nh24 = nh12 % 12;
    if (np === "PM") nh24 += 12;
    onChange(`${pad(nh24)}:${pad(nmm)}`);
  };
  const cls =
    "h-10 rounded-[12px] border bg-[color:var(--color-surface-1)] pl-3 pr-7 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]";
  return (
    <div className="flex items-center gap-1">
      <select aria-label="Hour" value={h12} onChange={(e) => emit(Number(e.target.value), mm, period)} className={`${cls} w-[72px]`}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
          <option key={h} value={h}>{pad(h)}</option>
        ))}
      </select>
      <select aria-label="Minute" value={mm} onChange={(e) => emit(h12, Number(e.target.value), period)} className={`${cls} w-[72px]`}>
        {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
          <option key={m} value={m}>{pad(m)}</option>
        ))}
      </select>
      <select aria-label="AM or PM" value={period} onChange={(e) => emit(h12, mm, e.target.value as "AM" | "PM")} className={`${cls} w-[76px]`}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

function ReminderInline({
  reminderIso,
  onChange,
  jobId,
}: {
  reminderIso: string | null;
  onChange: (iso: string | null) => void;
  jobId?: string;
}) {
  const enabled = !!reminderIso;
  const initial = reminderIso ? partsFromIso(reminderIso) : { date: defaultDate(), time: "14:00" };
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [dateOpen, setDateOpen] = useState(false);

  useEffect(() => {
    if (reminderIso) {
      const p = partsFromIso(reminderIso);
      setDate(p.date);
      setTime(p.time);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminderIso]);

  const commit = (nd: string, nt: string) => {
    setDate(nd);
    setTime(nt);
    onChange(isoFrom(nd, nt));
  };

  const conflicts = enabled ? findReminderConflicts(isoFrom(date, time), jobId) : [];

  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            if (e.target.checked) onChange(isoFrom(date, time));
            else onChange(null);
          }}
          className="h-4 w-4 rounded border"
          style={{ accentColor: "#0E735A" }}
        />
        <span className="text-[13px] text-[color:var(--color-foreground)]">Set a reminder?</span>
      </label>
      {enabled ? (
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-3">
          <div className="flex min-w-0 flex-col gap-1 text-[12px] text-[color:var(--color-text-muted)]">
            <span>Date</span>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 items-center justify-between gap-2 rounded-[12px] border bg-[color:var(--color-surface-1)] px-3 text-left text-[14px] text-[color:var(--color-foreground)] outline-none hover:bg-[color:var(--color-surface-2)] focus-visible:border-[color:var(--color-accent)]"
                >
                  <span>{(() => { const [y,m,d] = date.split("-").map(Number); return formatUS(new Date(y, (m??1)-1, d??1)); })()}</span>
                  <IconCalendar size={16} strokeWidth={1.6} className="text-[color:var(--color-text-muted)]" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="z-[70] w-auto rounded-[16px] border bg-[color:var(--color-surface-1)] p-0"
                style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
              >
                <Calendar
                  mode="single"
                  selected={(() => { const [y,m,d] = date.split("-").map(Number); return new Date(y, (m??1)-1, d??1); })()}
                  onSelect={(d) => {
                    if (d) {
                      commit(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`, time);
                      setDateOpen(false);
                    }
                  }}
                  initialFocus
                  className="pointer-events-auto p-3"
                  classNames={{
                    today: "rounded-md [&_button]:!bg-[color:var(--color-green,#0E735A)] [&_button]:!text-white",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col gap-1 text-[12px] text-[color:var(--color-text-muted)]">
            <span>Time</span>
            <TimePickerAmPm value={time} onChange={(t) => commit(date, t)} />
          </div>
        </div>
      ) : null}
      {enabled && conflicts.length > 0 ? (
        <div
          className="mt-3 rounded-[12px] px-3 py-2 text-[12px]"
          style={{ background: "#FFE2E2", color: "#D00D01" }}
        >
          <div style={{ fontWeight: 600 }}>Heads up — reminder conflict</div>
          <div style={{ fontWeight: 300 }}>
            You already have a reminder at this time for{" "}
            {conflicts
              .map((id) => {
                const j = getDbJobById(id);
                return j ? `${j.title} · ${j.company}` : id;
              })
              .join("; ")}
            . You can still save it.
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FooterButtons({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-[12px] px-4 text-[14px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        className="h-10 rounded-[12px] bg-[color:var(--color-accent)] px-4 text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
      >
        Save
      </button>
    </>
  );
}

export function InterviewTransitionDialog({
  open,
  initialStage,
  initialReminderIso,
  jobId,
  onCancel,
  onSave,
  title,
  stages,
  stageLabel,
}: {
  open: boolean;
  initialStage?: string;
  initialReminderIso?: string;
  jobId?: string;
  onCancel: () => void;
  onSave: (payload: { stage: string; reminderIso: string | null }) => void;
  title?: string;
  stages?: readonly string[];
  stageLabel?: string;
}) {
  const stageOptions = stages ? stages : DEFAULT_INTERVIEW_STAGES;
  const [stage, setStage] = useState<string>(initialStage ?? stageOptions[0] ?? "");
  const [reminderIso, setReminderIso] = useState<string | null>(initialReminderIso ?? null);

  useEffect(() => {
    if (!open) return;
    setStage(stageOptions.length ? (initialStage ?? stageOptions[0]) : "");
    setReminderIso(initialReminderIso ?? null);
  }, [open, initialStage, initialReminderIso, stageOptions]);

  if (!open) return null;
  return (
    <DialogShell
      title={title ?? "Interview"}
      onCancel={onCancel}
      footer={<FooterButtons onCancel={onCancel} onSave={() => onSave({ stage, reminderIso })} />}
    >
      <div className="flex flex-col gap-1">
        {stageOptions.length ? (
          <>
            <p className="body-small text-[color:var(--color-text-secondary)]">
              Pick the stage you're currently at in this interview.
            </p>
            <select className={selectCls} value={stage} onChange={(e) => setStage(e.target.value)}>
            {stageOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            </select>
          </>
        ) : (
          <p className="body-small text-[color:var(--color-text-secondary)]">
            No stages are set for {title ?? "this column"}. The card will move without a stage — you can add
            stages later in Edit columns.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className="body-small text-[color:var(--color-text-secondary)]">
          Add a reminder so this interview doesn't slip off your radar.
        </p>
        <ReminderInline reminderIso={reminderIso} onChange={setReminderIso} jobId={jobId} />
      </div>
    </DialogShell>
  );
}

// TestTaskTransitionDialog removed — Take-home is now just an Interview-kind column.

export function RejectedTransitionDialog({
  open,
  initialDetails,
  onCancel,
  onSave,
}: {
  open: boolean;
  initialDetails?: string;
  onCancel: () => void;
  onSave: (payload: { details: string }) => void;
}) {
  const [details, setDetails] = useState(initialDetails ?? "");
  useEffect(() => {
    if (!open) return;
    setDetails(initialDetails ?? "");
  }, [open, initialDetails]);
  if (!open) return null;
  return (
    <DialogShell
      title="Rejected"
      onCancel={onCancel}
      footer={<FooterButtons onCancel={onCancel} onSave={() => onSave({ details })} />}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[12px] text-[color:var(--color-text-muted)]">Rejection details</span>
        <textarea
          rows={5}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="What happened? (optional)"
          className={textareaCls}
        />
      </div>
    </DialogShell>
  );
}

export function OfferTransitionDialog({
  open,
  initialStage,
  initialReminderIso,
  initialDetails,
  jobId,
  stages,
  title,
  onCancel,
  onSave,
}: {
  open: boolean;
  initialStage?: string;
  initialReminderIso?: string;
  initialDetails?: string;
  jobId?: string;
  stages?: readonly string[];
  title?: string;
  onCancel: () => void;
  onSave: (payload: { stage: string; reminderIso: string | null; details: string }) => void;
}) {
  const stageOptions = stages ? stages : DEFAULT_OFFER_STAGES;
  const [stage, setStage] = useState<string>(initialStage ?? stageOptions[0] ?? "");
  const [reminderIso, setReminderIso] = useState<string | null>(initialReminderIso ?? null);
  const [details, setDetails] = useState(initialDetails ?? "");
  useEffect(() => {
    if (!open) return;
    setStage(stageOptions.length ? (initialStage ?? stageOptions[0]) : "");
    setReminderIso(initialReminderIso ?? null);
    setDetails(initialDetails ?? "");
  }, [open, initialStage, initialReminderIso, initialDetails, stageOptions]);
  if (!open) return null;
  return (
    <DialogShell
      title={title ?? "Offer"}
      onCancel={onCancel}
      footer={<FooterButtons onCancel={onCancel} onSave={() => onSave({ stage, reminderIso, details })} />}
    >
      <div className="flex flex-col gap-1">
        {stageOptions.length ? (
          <>
            <p className="body-small text-[color:var(--color-text-secondary)]">
              Pick where this offer stands right now.
            </p>
            <select className={selectCls} value={stage} onChange={(e) => setStage(e.target.value)}>
            {stageOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
            </select>
          </>
        ) : (
          <p className="body-small text-[color:var(--color-text-secondary)]">
            No stages are set for {title ?? "this column"}. The card will move without a stage — you can add
            stages later in Edit columns.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className="body-small text-[color:var(--color-text-secondary)]">
          Set a reminder for your next step — deadline, call, or decision date.
        </p>
        <ReminderInline reminderIso={reminderIso} onChange={setReminderIso} jobId={jobId} />
      </div>
      <div className="flex flex-col gap-2">
        <p className="body-small text-[color:var(--color-text-secondary)]">
          Offer details
        </p>
        <textarea
          rows={4}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Comp, deadline, notes (optional)"
          className={textareaCls}
        />
      </div>
    </DialogShell>
  );
}