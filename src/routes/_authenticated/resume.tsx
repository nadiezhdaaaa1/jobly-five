import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  FileText,
  Pencil,
  UploadCloud,
  X,
} from "lucide-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import {
  clearResume,
  setResume,
  updateResumeData,
  useResumeState,
  type ResumeData,
  type ResumeEducation,
  type ResumeExperience,
} from "@/lib/resume-store";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({
    meta: [
      { title: "Resume — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResumeScreen,
});

type EntryMode = null | "cards" | "upload" | "linkedin";
type UploadPhase = "idle" | "uploading" | "parsing" | "error";

function ResumeScreen() {
  const state = useResumeState();
  const [entryMode, setEntryMode] = useState<EntryMode>("cards");
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadName, setUploadName] = useState<string>("");
  const [showBanner, setShowBanner] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [consent, setConsent] = useState(false);

  const startUpload = (source: "upload" | "linkedin") => {
    const name = source === "linkedin" ? "linkedin_profile.pdf" : "resume_serhii.pdf";
    setUploadName(name);
    setUploadPct(0);
    setUploadPhase("uploading");
    let pct = 0;
    const tick = () => {
      pct += 18 + Math.random() * 20;
      if (pct >= 100) {
        setUploadPct(100);
        setUploadPhase("parsing");
        setTimeout(() => {
          setResume(name);
          setShowBanner(true);
          setEntryMode(null);
          setUploadPhase("idle");
          setConsent(false);
        }, 1400);
      } else {
        setUploadPct(pct);
        setTimeout(tick, 220);
      }
    };
    setTimeout(tick, 220);
  };

  const onReplace = () => {
    setEntryMode("cards");
    setShowBanner(false);
  };

  const onDeleteConfirmed = () => {
    clearResume();
    setConfirmDelete(false);
    setEntryMode("cards");
    setShowBanner(false);
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] pb-24 md:pb-10">
      <AppHeader active="resume" />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        <header className="mb-6">
          <h1
            className="text-[24px] leading-tight text-[color:var(--color-foreground)]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            Resume
          </h1>
          {state.hasResume ? (
            <p className="mt-1 text-[13px] text-[color:var(--color-text-muted)]">
              Used to score your matches since Jul 20
            </p>
          ) : null}
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0">
            {showBanner && state.hasResume ? (
              <div className="mb-4 flex items-start justify-between gap-3 rounded-[8px] bg-[color:var(--color-mint)] px-4 py-3 text-[13px] text-[color:var(--color-green)]">
                <span>
                  Here's what we read. Anything we got wrong? Your next digest will use this resume.
                </span>
                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => setShowBanner(false)}
                  className="shrink-0 rounded-[4px] p-1 hover:bg-black/5"
                >
                  <X size={14} strokeWidth={1.8} />
                </button>
              </div>
            ) : null}

            {!state.hasResume && uploadPhase === "idle" && entryMode === "cards" ? (
              <EmptyEntry onPick={setEntryMode} />
            ) : null}

            {!state.hasResume && uploadPhase === "idle" && entryMode === "upload" ? (
              <UploadPanel
                consent={consent}
                setConsent={setConsent}
                onBack={() => setEntryMode("cards")}
                onFile={() => startUpload("upload")}
              />
            ) : null}

            {!state.hasResume && uploadPhase === "idle" && entryMode === "linkedin" ? (
              <LinkedInPanel
                consent={consent}
                setConsent={setConsent}
                onBack={() => setEntryMode("cards")}
                onFile={() => startUpload("linkedin")}
              />
            ) : null}

            {uploadPhase === "uploading" ? (
              <UploadingPanel filename={uploadName} pct={uploadPct} />
            ) : null}
            {uploadPhase === "parsing" ? <ParsingSkeleton /> : null}
            {uploadPhase === "error" ? (
              <ErrorPanel onRetry={() => startUpload("upload")} />
            ) : null}

            {state.hasResume && uploadPhase === "idle" ? <ResumeEditor data={state.data} /> : null}
          </div>

          <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
            <TailoringTeaser />
            {state.hasResume && state.filename ? (
              <FileCard
                filename={state.filename}
                addedDate={state.addedDate ?? ""}
                onReplace={onReplace}
                onDelete={() => setConfirmDelete(true)}
              />
            ) : null}
          </aside>
        </div>
      </main>

      {confirmDelete ? (
        <DeleteDialog onCancel={() => setConfirmDelete(false)} onConfirm={onDeleteConfirmed} />
      ) : null}

      <MobileTabBar active="resume" />
    </div>
  );
}

// ---------- Empty entry ----------

function EmptyEntry({ onPick }: { onPick: (m: EntryMode) => void }) {
  return (
    <div>
      <p
        className="mb-5 text-[14px] text-[color:var(--color-text-secondary)]"
        style={{ fontWeight: 300 }}
      >
        Your quiz answers are already in. Add a resume to sharpen your match scores.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <EntryCard
          icon={<UploadCloud size={18} strokeWidth={1.8} className="text-[color:var(--color-green)]" />}
          title="Upload your resume"
          body="PDF or DOCX. We'll read it and fill everything in."
          onClick={() => onPick("upload")}
        />
        <EntryCard
          icon={<Briefcase size={18} strokeWidth={1.8} className="text-[color:var(--color-green)]" />}
          title="Import from LinkedIn"
          body="Save your profile as a PDF on LinkedIn, drop it here."
          onClick={() => onPick("linkedin")}
        />
      </div>
    </div>
  );
}

function EntryCard({
  icon,
  title,
  body,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full flex-col items-start gap-3 rounded-[6px] border bg-[color:var(--color-surface-1)] p-5 text-left transition-colors hover:border-[color:var(--color-border-strong)]"
    >
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[4px] bg-[color:var(--color-mint)]">
        {icon}
      </span>
      <span className="text-[15px] font-semibold text-[color:var(--color-foreground)]">{title}</span>
      <span
        className="text-[13px] text-[color:var(--color-text-secondary)]"
        style={{ fontWeight: 300 }}
      >
        {body}
      </span>
    </button>
  );
}

// ---------- Dropzone ----------

function Dropzone({ disabled, onFile }: { disabled: boolean; onFile: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setDrag(false);
        onFile();
      }}
      className={`flex h-[160px] flex-col items-center justify-center rounded-[8px] border border-dashed px-4 text-center ${
        drag
          ? "border-[color:var(--color-accent)] bg-[color:var(--color-surface-2)]"
          : "border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)]"
      } ${disabled ? "opacity-60" : ""}`}
      aria-disabled={disabled}
    >
      <p className="text-[14px] text-[color:var(--color-foreground)]">
        Drop your resume here or{" "}
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="font-semibold text-[color:var(--color-green)] underline underline-offset-2 disabled:cursor-not-allowed disabled:no-underline disabled:text-[color:var(--color-text-muted)]"
        >
          browse
        </button>
      </p>
      <p className="mt-1 text-[12px] text-[color:var(--color-text-muted)]">PDF or DOCX, up to 10 MB</p>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={() => onFile()}
      />
    </div>
  );
}

function ConsentCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="mt-4 flex cursor-pointer items-start gap-3 text-[13px] text-[color:var(--color-text-secondary)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-[3px] h-[16px] w-[16px] shrink-0 accent-[color:var(--color-green)]"
      />
      <span style={{ fontWeight: 300 }}>
        I agree to Jobly storing my resume to improve my job matches. I can delete it anytime.
      </span>
    </label>
  );
}

function UploadPanel({
  consent,
  setConsent,
  onBack,
  onFile,
}: {
  consent: boolean;
  setConsent: (v: boolean) => void;
  onBack: () => void;
  onFile: () => void;
}) {
  return (
    <div className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
      >
        <ArrowLeft size={14} strokeWidth={1.6} /> Back
      </button>
      <Dropzone disabled={!consent} onFile={onFile} />
      <ConsentCheckbox checked={consent} onChange={setConsent} />
    </div>
  );
}

function LinkedInPanel({
  consent,
  setConsent,
  onBack,
  onFile,
}: {
  consent: boolean;
  setConsent: (v: boolean) => void;
  onBack: () => void;
  onFile: () => void;
}) {
  const steps: React.ReactNode[] = [
    "Open your LinkedIn profile",
    <>
      Click <strong>More</strong> under your name, then choose <strong>Save to PDF</strong>.
    </>,
    "LinkedIn downloads a PDF of your profile.",
    "Drop that file below.",
  ];
  return (
    <div className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-[13px] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
      >
        <ArrowLeft size={14} strokeWidth={1.6} /> Back
      </button>
      <h2 className="text-[15px] font-semibold text-[color:var(--color-foreground)]">
        Get your LinkedIn profile as a PDF
      </h2>
      <ol className="mt-3 divide-y">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3 py-3">
            <span className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface-2)] text-[12px] font-semibold text-[color:var(--color-foreground)]">
              {i + 1}
            </span>
            <div
              className="flex-1 text-[14px] text-[color:var(--color-foreground)]"
              style={{ fontWeight: 300 }}
            >
              <div>{s}</div>
              {i === 0 ? (
                <a
                  href="https://www.linkedin.com/in/me"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex h-9 items-center rounded-[4px] border px-3 text-[13px] font-semibold text-[color:var(--color-foreground)] hover:border-[color:var(--color-border-strong)]"
                >
                  Open my profile
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4">
        <Dropzone disabled={!consent} onFile={onFile} />
        <p className="mt-2 text-[12px] text-[color:var(--color-text-muted)]">
          We read the file you give us — Jobly never accesses your LinkedIn account.
        </p>
        <ConsentCheckbox checked={consent} onChange={setConsent} />
      </div>
    </div>
  );
}

function UploadingPanel({ filename, pct }: { filename: string; pct: number }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5"
    >
      <div className="text-[14px] text-[color:var(--color-foreground)]">{filename}</div>
      <div className="mt-3 h-1 w-full bg-[color:var(--color-surface-2)]">
        <div
          className="h-1 bg-[color:var(--color-accent)] transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="mt-2 text-[12px] text-[color:var(--color-text-muted)]">Uploading…</div>
    </div>
  );
}

function ParsingSkeleton() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <div className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5">
        <div className="text-[13px] text-[color:var(--color-text-secondary)]">
          Reading your resume…
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-1/3 rounded bg-[color:var(--color-surface-2)]" />
          <div className="h-3 w-2/3 rounded bg-[color:var(--color-surface-2)]" />
          <div className="h-3 w-1/2 rounded bg-[color:var(--color-surface-2)]" />
        </div>
      </div>
      <div className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5">
        <div className="space-y-2">
          <div className="h-3 w-1/4 rounded bg-[color:var(--color-surface-2)]" />
          <div className="h-3 w-4/5 rounded bg-[color:var(--color-surface-2)]" />
          <div className="h-3 w-3/5 rounded bg-[color:var(--color-surface-2)]" />
        </div>
      </div>
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-[8px] border p-5"
      style={{ background: "var(--color-danger-subtle)" }}
    >
      <p className="text-[14px] text-[color:var(--color-foreground)]">
        We couldn't read this file. Try a different PDF or DOCX — or the LinkedIn export, it parses
        reliably.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 inline-flex h-9 items-center rounded-[4px] border px-3 text-[13px] font-semibold text-[color:var(--color-foreground)] hover:border-[color:var(--color-border-strong)]"
      >
        Try again
      </button>
    </div>
  );
}

// ---------- Right rail ----------

function TailoringTeaser() {
  return (
    <div
      aria-hidden
      className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-4"
      style={{ opacity: 0.55 }}
    >
      <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-text-secondary)]">
        Coming soon
      </span>
      <h3 className="mt-3 text-[15px] font-semibold text-[color:var(--color-foreground)]">
        Tailor to a job
      </h3>
      <p
        className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]"
        style={{ fontWeight: 300 }}
      >
        One click adapts your resume to a specific opening — rewritten summary, reordered skills,
        gap flags. Rolling out soon.
      </p>
    </div>
  );
}

function FileCard({
  filename,
  addedDate,
  onReplace,
  onDelete,
}: {
  filename: string;
  addedDate: string;
  onReplace: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-surface-2)]">
          <FileText
            size={16}
            strokeWidth={1.6}
            className="text-[color:var(--color-text-secondary)]"
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-semibold text-[color:var(--color-foreground)]">
            {filename}
          </div>
          <div className="text-[12px] text-[color:var(--color-text-muted)]">Added {addedDate}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-4 text-[13px]">
        <button
          type="button"
          onClick={onReplace}
          className="text-[color:var(--color-green)] hover:underline"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-[color:var(--color-danger)] hover:underline"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------- Delete dialog ----------

function DeleteDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const first = dialogRef.current?.querySelector<HTMLElement>("button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus();
    };
  }, [onCancel]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(9,11,12,0.32)" }}
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="del-title"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-[8px] bg-[color:var(--color-surface-1)] p-5"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
      >
        <h3
          id="del-title"
          className="text-[16px] font-semibold text-[color:var(--color-foreground)]"
        >
          Delete your resume?
        </h3>
        <p
          className="mt-2 text-[13px] text-[color:var(--color-text-secondary)]"
          style={{ fontWeight: 300 }}
        >
          Your matches will fall back to your quiz profile.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 items-center rounded-[4px] px-4 text-[14px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-10 items-center rounded-[4px] bg-[color:var(--color-danger)] px-4 text-[14px] font-semibold text-white hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Editor ----------

const QUIZ_STACK = new Set(
  ["React", "Vue", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL", "Node.js"].map((s) =>
    s.toLowerCase(),
  ),
);

function ResumeEditor({ data }: { data: ResumeData }) {
  return (
    <div className="flex flex-col gap-4">
      <ContactSection data={data} />
      <SummarySection data={data} />
      <ExperienceSection data={data} />
      <EducationSection data={data} />
      <SkillsSection data={data} />
      <LanguagesSection data={data} />
    </div>
  );
}

function SectionCard({
  title,
  editing,
  onEdit,
  onSave,
  onCancel,
  saved,
  children,
  editContent,
}: {
  title: string;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saved?: boolean;
  children: React.ReactNode;
  editContent?: React.ReactNode;
}) {
  return (
    <section className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[color:var(--color-foreground)]">{title}</h2>
        <div className="flex items-center gap-2">
          {saved ? (
            <span className="text-[12px] text-[color:var(--color-green)]">Saved</span>
          ) : null}
          {!editing ? (
            <button
              type="button"
              aria-label={`Edit ${title}`}
              aria-expanded={editing}
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
            >
              <Pencil size={15} strokeWidth={1.6} />
            </button>
          ) : null}
        </div>
      </div>
      {editing ? editContent : children}
      {editing ? (
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            className="inline-flex h-9 items-center rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-[13px] text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </section>
  );
}

function useSavedFlash() {
  const [saved, setSaved] = useState(false);
  const flash = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  return [saved, flash] as const;
}

const inputCls =
  "w-full rounded-[4px] border bg-white px-3 py-2 text-[14px] text-[color:var(--color-foreground)] outline-none focus:border-[color:var(--color-border-strong)]";

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] text-[color:var(--color-text-secondary)]">
        {label}
      </span>
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function ContactSection({ data }: { data: ResumeData }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.contact);
  const [saved, flash] = useSavedFlash();
  useEffect(() => {
    if (!editing) setDraft(data.contact);
  }, [editing, data.contact]);
  return (
    <SectionCard
      title="Contact"
      editing={editing}
      onEdit={() => setEditing(true)}
      onSave={() => {
        updateResumeData({ contact: draft });
        setEditing(false);
        flash();
      }}
      onCancel={() => setEditing(false)}
      saved={saved}
      editContent={
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <LabeledInput label="Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
          <LabeledInput label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} />
          <LabeledInput label="Phone" value={draft.phone} onChange={(v) => setDraft({ ...draft, phone: v })} />
          <LabeledInput label="Location" value={draft.location} onChange={(v) => setDraft({ ...draft, location: v })} />
          <LabeledInput label="GitHub" value={draft.github} onChange={(v) => setDraft({ ...draft, github: v })} />
          <LabeledInput label="Portfolio" value={draft.portfolio} onChange={(v) => setDraft({ ...draft, portfolio: v })} />
          <LabeledInput label="LinkedIn" value={draft.linkedin} onChange={(v) => setDraft({ ...draft, linkedin: v })} />
        </div>
      }
    >
      <dl
        className="grid grid-cols-1 gap-x-6 gap-y-2 text-[14px] md:grid-cols-2"
        style={{ fontWeight: 300 }}
      >
        <Row label="Name" value={data.contact.name} />
        <Row label="Email" value={data.contact.email} />
        <Row label="Phone" value={data.contact.phone} />
        <Row label="Location" value={data.contact.location} />
        <Row label="GitHub" value={data.contact.github} />
        <Row label="Portfolio" value={data.contact.portfolio} />
        <Row label="LinkedIn" value={data.contact.linkedin} />
      </dl>
    </SectionCard>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-[80px] shrink-0 text-[color:var(--color-text-muted)]">{label}</dt>
      <dd className="text-[color:var(--color-foreground)]">{value}</dd>
    </div>
  );
}

function SummarySection({ data }: { data: ResumeData }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.summary);
  const [saved, flash] = useSavedFlash();
  useEffect(() => {
    if (!editing) setDraft(data.summary);
  }, [editing, data.summary]);
  return (
    <SectionCard
      title="Summary"
      editing={editing}
      onEdit={() => setEditing(true)}
      onSave={() => {
        updateResumeData({ summary: draft });
        setEditing(false);
        flash();
      }}
      onCancel={() => setEditing(false)}
      saved={saved}
      editContent={
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          className={inputCls + " min-h-[100px] leading-6"}
        />
      }
    >
      <p
        className="text-[14px] leading-6 text-[color:var(--color-foreground)]"
        style={{ fontWeight: 300 }}
      >
        {data.summary}
      </p>
    </SectionCard>
  );
}

function ExperienceSection({ data }: { data: ResumeData }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ResumeExperience[]>(data.experience);
  const [saved, flash] = useSavedFlash();
  useEffect(() => {
    if (!editing) setDraft(data.experience);
  }, [editing, data.experience]);

  const view = (
    <div className="divide-y">
      {data.experience.map((e) => (
        <div key={e.id} className="py-4 first:pt-0 last:pb-0">
          <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">
            {e.role}
          </div>
          <div
            className="text-[13px] text-[color:var(--color-text-secondary)]"
            style={{ fontWeight: 300 }}
          >
            {e.company}
          </div>
          <div className="text-[12px] text-[color:var(--color-text-muted)]">{e.dates}</div>
          {e.bullets.length ? (
            <ul
              className="mt-2 list-disc space-y-1 pl-5 text-[14px] text-[color:var(--color-foreground)]"
              style={{ fontWeight: 300 }}
            >
              {e.bullets.slice(0, 5).map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ))}
    </div>
  );

  const edit = (
    <div className="flex flex-col gap-4">
      {draft.map((e, idx) => (
        <div key={e.id} className="rounded-[6px] border p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <LabeledInput
              label="Role"
              value={e.role}
              onChange={(v) =>
                setDraft(draft.map((x, i) => (i === idx ? { ...x, role: v } : x)))
              }
            />
            <LabeledInput
              label="Company"
              value={e.company}
              onChange={(v) =>
                setDraft(draft.map((x, i) => (i === idx ? { ...x, company: v } : x)))
              }
            />
            <LabeledInput
              label="Dates"
              value={e.dates}
              onChange={(v) =>
                setDraft(draft.map((x, i) => (i === idx ? { ...x, dates: v } : x)))
              }
            />
          </div>
          <label className="mt-3 block">
            <span className="mb-1 block text-[12px] text-[color:var(--color-text-secondary)]">
              Bullets (one per line, up to 5)
            </span>
            <textarea
              rows={4}
              value={e.bullets.join("\n")}
              onChange={(ev) =>
                setDraft(
                  draft.map((x, i) =>
                    i === idx
                      ? { ...x, bullets: ev.target.value.split("\n").slice(0, 5) }
                      : x,
                  ),
                )
              }
              className={inputCls + " min-h-[100px] leading-6"}
            />
          </label>
          <div className="mt-2 text-right">
            <button
              type="button"
              onClick={() => setDraft(draft.filter((_, i) => i !== idx))}
              className="text-[12px] text-[color:var(--color-danger)] hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          setDraft([
            ...draft,
            { id: `e${Date.now()}`, role: "", company: "", dates: "", bullets: [] },
          ])
        }
        className="self-start text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
      >
        + Add experience
      </button>
    </div>
  );

  return (
    <SectionCard
      title="Experience"
      editing={editing}
      onEdit={() => setEditing(true)}
      onSave={() => {
        updateResumeData({ experience: draft });
        setEditing(false);
        flash();
      }}
      onCancel={() => setEditing(false)}
      saved={saved}
      editContent={edit}
    >
      {view}
    </SectionCard>
  );
}

function EducationSection({ data }: { data: ResumeData }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<ResumeEducation[]>(data.education);
  const [saved, flash] = useSavedFlash();
  useEffect(() => {
    if (!editing) setDraft(data.education);
  }, [editing, data.education]);

  return (
    <SectionCard
      title="Education"
      editing={editing}
      onEdit={() => setEditing(true)}
      onSave={() => {
        updateResumeData({ education: draft });
        setEditing(false);
        flash();
      }}
      onCancel={() => setEditing(false)}
      saved={saved}
      editContent={
        <div className="flex flex-col gap-4">
          {draft.map((e, idx) => (
            <div
              key={e.id}
              className="grid grid-cols-1 gap-3 rounded-[6px] border p-3 md:grid-cols-3"
            >
              <LabeledInput
                label="Degree"
                value={e.degree}
                onChange={(v) =>
                  setDraft(draft.map((x, i) => (i === idx ? { ...x, degree: v } : x)))
                }
              />
              <LabeledInput
                label="School"
                value={e.school}
                onChange={(v) =>
                  setDraft(draft.map((x, i) => (i === idx ? { ...x, school: v } : x)))
                }
              />
              <LabeledInput
                label="Years"
                value={e.years}
                onChange={(v) =>
                  setDraft(draft.map((x, i) => (i === idx ? { ...x, years: v } : x)))
                }
              />
              <div className="text-right md:col-span-3">
                <button
                  type="button"
                  onClick={() => setDraft(draft.filter((_, i) => i !== idx))}
                  className="text-[12px] text-[color:var(--color-danger)] hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              setDraft([
                ...draft,
                { id: `ed${Date.now()}`, degree: "", school: "", years: "" },
              ])
            }
            className="self-start text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
          >
            + Add education
          </button>
        </div>
      }
    >
      <div className="divide-y">
        {data.education.map((e) => (
          <div key={e.id} className="py-3 first:pt-0 last:pb-0">
            <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">
              {e.degree}
            </div>
            <div
              className="text-[13px] text-[color:var(--color-text-secondary)]"
              style={{ fontWeight: 300 }}
            >
              {e.school}
            </div>
            <div className="text-[12px] text-[color:var(--color-text-muted)]">{e.years}</div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function SkillsSection({ data }: { data: ResumeData }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.skills.join(", "));
  const [saved, flash] = useSavedFlash();
  useEffect(() => {
    if (!editing) setDraft(data.skills.join(", "));
  }, [editing, data.skills]);

  const anyMatch = data.skills.some((s) => QUIZ_STACK.has(s.toLowerCase()));
  return (
    <SectionCard
      title="Skills"
      editing={editing}
      onEdit={() => setEditing(true)}
      onSave={() => {
        updateResumeData({
          skills: draft
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        });
        setEditing(false);
        flash();
      }}
      onCancel={() => setEditing(false)}
      saved={saved}
      editContent={
        <label className="block">
          <span className="mb-1 block text-[12px] text-[color:var(--color-text-secondary)]">
            Comma-separated skills
          </span>
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={inputCls + " leading-6"}
          />
        </label>
      }
    >
      <div className="flex flex-wrap gap-2">
        {data.skills.map((s) => {
          const match = QUIZ_STACK.has(s.toLowerCase());
          return (
            <span
              key={s}
              className={`inline-flex items-center rounded-[4px] px-2 py-1 text-[13px] ${
                match
                  ? "bg-[color:var(--color-mint)] text-[color:var(--color-green)]"
                  : "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-secondary)]"
              }`}
              style={{ fontWeight: 300 }}
            >
              {s}
            </span>
          );
        })}
      </div>
      {anyMatch ? (
        <p className="mt-3 text-[12px] text-[color:var(--color-text-muted)]">
          Green skills also power your match scores.
        </p>
      ) : null}
    </SectionCard>
  );
}

function LanguagesSection({ data }: { data: ResumeData }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(
    data.languages.map((l) => `${l.lang} — ${l.level}`).join("\n"),
  );
  const [saved, flash] = useSavedFlash();
  useEffect(() => {
    if (!editing) setDraft(data.languages.map((l) => `${l.lang} — ${l.level}`).join("\n"));
  }, [editing, data.languages]);
  return (
    <SectionCard
      title="Languages"
      editing={editing}
      onEdit={() => setEditing(true)}
      onSave={() => {
        const langs = draft
          .split("\n")
          .map((line) => {
            const parts = line.split(/[—-]/).map((s) => s.trim());
            const lang = parts[0];
            const level = parts[1] ?? "";
            return lang ? { lang, level } : null;
          })
          .filter(Boolean) as { lang: string; level: string }[];
        updateResumeData({ languages: langs });
        setEditing(false);
        flash();
      }}
      onCancel={() => setEditing(false)}
      saved={saved}
      editContent={
        <label className="block">
          <span className="mb-1 block text-[12px] text-[color:var(--color-text-secondary)]">
            One per line, e.g. "English — Fluent"
          </span>
          <textarea
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className={inputCls + " leading-6"}
          />
        </label>
      }
    >
      <ul
        className="space-y-1 text-[14px] text-[color:var(--color-foreground)]"
        style={{ fontWeight: 300 }}
      >
        {data.languages.map((l) => (
          <li key={l.lang}>
            {l.lang} — {l.level}
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
