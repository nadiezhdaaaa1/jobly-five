import { useEffect, useState } from "react";
import { IconX as X } from "@tabler/icons-react";
import { InterviewReminderDialog } from "@/components/app/InterviewReminderDialog";
import { dateHelpers } from "@/lib/tracker-store";

export const INTERVIEW_STAGES = [
  "Recruiter screen",
  "Hiring manager screen",
  "Technical screen",
  "Technical interview",
  "System design",
  "Onsite / Final round",
  "Team / culture fit",
] as const;

export const OFFER_STAGES = [
  "Waiting for my reply",
  "Negotiating",
  "Accepted",
  "Declined",
] as const;

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
        className="relative z-10 w-[92%] max-w-[440px] rounded-[8px] border bg-[color:var(--color-surface-1)] p-6"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,.12)" }}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
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
  "h-10 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 pr-8 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]";
const textareaCls =
  "w-full resize-y rounded-[4px] border bg-[color:var(--color-surface-1)] p-3 text-[13px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]";

function ReminderInline({
  reminderIso,
  onChange,
}: {
  reminderIso: string | null;
  onChange: (iso: string | null) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const enabled = !!reminderIso;
  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => {
            if (e.target.checked) setPickerOpen(true);
            else onChange(null);
          }}
          className="h-4 w-4 rounded border"
          style={{ accentColor: "#0E735A" }}
        />
        <span className="text-[13px] text-[color:var(--color-foreground)]">Set a reminder?</span>
      </label>
      {enabled && reminderIso ? (
        <div className="mt-2 flex items-center justify-between rounded-[4px] bg-[color:var(--color-surface-2)] px-3 py-2 text-[13px]">
          <span className="text-[color:var(--color-foreground)]">{dateHelpers.shortDateTime(reminderIso)}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-[12px] font-semibold text-[color:var(--color-green)] hover:underline"
              onClick={() => setPickerOpen(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className="text-[12px] text-[color:var(--color-text-muted)] hover:underline"
              onClick={() => onChange(null)}
            >
              Remove
            </button>
          </div>
        </div>
      ) : null}
      <InterviewReminderDialog
        open={pickerOpen}
        initialIso={reminderIso ?? undefined}
        onCancel={() => setPickerOpen(false)}
        onSave={(iso) => {
          onChange(iso);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}

function FooterButtons({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="h-10 rounded-[4px] px-4 text-[14px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        className="h-10 rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
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
  onCancel,
  onSave,
}: {
  open: boolean;
  initialStage?: string;
  initialReminderIso?: string;
  onCancel: () => void;
  onSave: (payload: { stage: string; reminderIso: string | null }) => void;
}) {
  const [stage, setStage] = useState<string>(initialStage ?? INTERVIEW_STAGES[0]);
  const [reminderIso, setReminderIso] = useState<string | null>(initialReminderIso ?? null);

  useEffect(() => {
    if (!open) return;
    setStage(initialStage ?? INTERVIEW_STAGES[0]);
    setReminderIso(initialReminderIso ?? null);
  }, [open, initialStage, initialReminderIso]);

  if (!open) return null;
  return (
    <DialogShell
      title="Interview"
      onCancel={onCancel}
      footer={<FooterButtons onCancel={onCancel} onSave={() => onSave({ stage, reminderIso })} />}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[12px] text-[color:var(--color-text-muted)]">Interview stage</span>
        <select className={selectCls} value={stage} onChange={(e) => setStage(e.target.value)}>
          {INTERVIEW_STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <ReminderInline reminderIso={reminderIso} onChange={setReminderIso} />
    </DialogShell>
  );
}

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
  onCancel,
  onSave,
}: {
  open: boolean;
  initialStage?: string;
  initialReminderIso?: string;
  initialDetails?: string;
  onCancel: () => void;
  onSave: (payload: { stage: string; reminderIso: string | null; details: string }) => void;
}) {
  const [stage, setStage] = useState<string>(initialStage ?? OFFER_STAGES[0]);
  const [reminderIso, setReminderIso] = useState<string | null>(initialReminderIso ?? null);
  const [details, setDetails] = useState(initialDetails ?? "");
  useEffect(() => {
    if (!open) return;
    setStage(initialStage ?? OFFER_STAGES[0]);
    setReminderIso(initialReminderIso ?? null);
    setDetails(initialDetails ?? "");
  }, [open, initialStage, initialReminderIso, initialDetails]);
  if (!open) return null;
  return (
    <DialogShell
      title="Offer"
      onCancel={onCancel}
      footer={<FooterButtons onCancel={onCancel} onSave={() => onSave({ stage, reminderIso, details })} />}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[12px] text-[color:var(--color-text-muted)]">Offer stage</span>
        <select className={selectCls} value={stage} onChange={(e) => setStage(e.target.value)}>
          {OFFER_STAGES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <ReminderInline reminderIso={reminderIso} onChange={setReminderIso} />
      <div className="flex flex-col gap-1">
        <span className="text-[12px] text-[color:var(--color-text-muted)]">Offer details</span>
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