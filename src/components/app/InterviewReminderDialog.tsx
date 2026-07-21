import { useEffect, useState } from "react";
import { IconX as X } from "@tabler/icons-react";

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

function defaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function InterviewReminderDialog({
  open,
  initialIso,
  jobTitle,
  onSave,
  onCancel,
}: {
  open: boolean;
  initialIso?: string | null;
  jobTitle?: string;
  onSave: (iso: string) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(defaultDate());
  const [time, setTime] = useState("14:00");

  useEffect(() => {
    if (!open) return;
    if (initialIso) {
      const d = new Date(initialIso);
      setDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      setTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
    } else {
      setDate(defaultDate());
      setTime("14:00");
    }
  }, [open, initialIso]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const handleSave = () => {
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    const iso = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).toISOString();
    onSave(iso);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0" style={{ background: "rgba(9,11,12,.32)" }} onClick={onCancel} aria-hidden />
      <div
        className="relative z-10 w-[92%] max-w-[420px] rounded-[8px] border bg-[color:var(--color-surface-1)] p-6"
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
          Congratulations on landing an interview!
        </h2>
        <p className="mt-2 text-[14px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          Let's set a reminder for the upcoming interview{jobTitle ? ` — ${jobTitle}` : ""}.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-[12px] text-[color:var(--color-text-muted)]">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[color:var(--color-text-muted)]">
            Time
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="h-10 rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[14px] text-[color:var(--color-foreground)] outline-none focus-visible:border-[color:var(--color-accent)]"
            />
          </label>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 rounded-[4px] px-4 text-[14px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-10 rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
          >
            Save reminder
          </button>
        </div>
      </div>
    </div>
  );
}