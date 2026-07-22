import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  IconCloudUpload as UploadCloud,
  IconPencil as Pencil,
  IconTrash as Trash,
  IconCheck as Check,
  IconX as X,
  IconPlus as Plus,
  IconDownload as Download,
} from "@tabler/icons-react";
import comingSoonAsset from "@/assets/resume-coming-soon.png.asset.json";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  addResumeFile,
  deleteResumeFile,
  renameResumeFile,
  setPrimaryResumeFile,
  setResumeConsent,
  useResumeState,
  type ResumeFile,
  type ResumeFileExt,
} from "@/lib/resume-store";
import { isPro, usePlan } from "@/lib/plan-store";

export const Route = createFileRoute("/_authenticated/resume")({
  head: () => ({
    meta: [
      { title: "Resume — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResumeScreen,
});

const MAX_BYTES = 5 * 1024 * 1024;
const FREE_LIMIT = 3;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function formatUploaded(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function extFromFile(f: File): ResumeFileExt | null {
  const n = f.name.toLowerCase();
  if (n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".docx")) return "docx";
  return null;
}

function baseName(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx > 0 ? name.slice(0, idx) : name;
}

type UploadTask = {
  id: string;
  displayName: string;
  ext: ResumeFileExt;
  size: number;
  pct: number;
};

type FileError = { message: string } | null;

function ResumeScreen() {
  const state = useResumeState();
  const plan = usePlan();
  const pro = isPro(plan);
  const atLimit = !pro && state.files.length >= FREE_LIMIT;

  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [fileError, setFileError] = useState<FileError>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  useEffect(
    () => () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    },
    [],
  );

  const startUpload = (file: File) => {
    const ext = extFromFile(file);
    if (!ext || file.size > MAX_BYTES) {
      setFileError({
        message: "We couldn't add this file. PDF or DOCX up to 5 MB.",
      });
      return;
    }
    if (!pro && state.files.length + uploads.length >= FREE_LIMIT) return;
    setFileError(null);
    const task: UploadTask = {
      id: Math.random().toString(36).slice(2, 10),
      displayName: file.name,
      ext,
      size: file.size,
      pct: 0,
    };
    setUploads((u) => [...u, task]);
    const tick = () => {
      setUploads((u) => {
        const cur = u.find((t) => t.id === task.id);
        if (!cur) return u;
        const next = Math.min(100, cur.pct + 18 + Math.random() * 20);
        return u.map((t) => (t.id === task.id ? { ...t, pct: next } : t));
      });
    };
    const timers: number[] = [];
    for (let i = 1; i <= 5; i++) timers.push(window.setTimeout(tick, i * 220));
    window.setTimeout(() => {
      addResumeFile({ name: baseName(file.name), ext, size: file.size });
      setUploads((u) => u.filter((t) => t.id !== task.id));
      timers.forEach((t) => window.clearTimeout(t));
      setUploadOpen(false);
    }, 5 * 220 + 200);
  };

  const onFiles = (files: FileList | null) => {
    if (!files || !state.consented || atLimit) return;
    for (const f of Array.from(files)) startUpload(f);
  };

  const orderedFiles = [...state.files].sort((a, b) => {
    if (a.id === state.primaryId) return -1;
    if (b.id === state.primaryId) return 1;
    return a.uploadedAt < b.uploadedAt ? 1 : -1;
  });

  const hasAny = state.files.length > 0 || uploads.length > 0;
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] pb-24 md:pb-10">
      <AppHeader active="resume" />
      <main className="mx-auto w-full max-w-[720px] px-4 py-8 sm:px-6">
        <header className="mb-6 flex items-center justify-between gap-3">
          <h1
            className="text-[24px] leading-tight text-[color:var(--color-foreground)]"
            style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
          >
            Resume
          </h1>
          <button
            type="button"
            onClick={() => setUploadOpen(true)}
            className="button-small inline-flex h-9 items-center gap-1.5 rounded-[4px] bg-[color:var(--color-primary)] px-3 text-[color:var(--color-on-accent)] transition-colors hover:bg-[color:var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
          >
            <Plus size={16} strokeWidth={2} />
            Add
          </button>
        </header>

        <ComingSoonBanner />

        {state.files.length > 0 ? (
          <div className="mt-4">
            <FileList
              files={orderedFiles}
              primaryId={state.primaryId}
              onMakePrimary={(id) => setPrimaryResumeFile(id)}
              onRename={(id, name) => renameResumeFile(id, name)}
              onDelete={(id) => {
                const result = deleteResumeFile(id);
                if (result.wasPrimary && result.promoted) {
                  showToast(
                    `${result.promoted.name}.${result.promoted.ext} is now your primary resume`,
                  );
                }
              }}
            />
          </div>
        ) : (
          <p
            className="mt-4 text-[13px] text-[color:var(--color-text-secondary)]"
            style={{ fontWeight: 300 }}
          >
            Your primary resume sharpens your match scores.
          </p>
        )}
      </main>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-[480px] rounded-[8px] border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5">
          <DialogTitle
            className="text-[16px] font-semibold text-[color:var(--color-foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Add resume
          </DialogTitle>
          <UploadCard
            state={state}
            pro={pro}
            atLimit={atLimit}
            uploads={uploads}
            fileError={fileError}
            onFiles={onFiles}
            onConsent={setResumeConsent}
            onDismissError={() => setFileError(null)}
            hasAny={hasAny}
          />
        </DialogContent>
      </Dialog>

      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-[8px] bg-[color:var(--color-foreground)] px-4 py-2 text-[13px] font-medium text-white shadow-lg md:bottom-8"
        >
          {toast}
        </div>
      ) : null}

      <MobileTabBar active="resume" />
    </div>
  );
}

// ---------- Coming-soon banner ----------

function ComingSoonBanner() {
  return (
    <aside
      className="relative flex items-center gap-4 overflow-hidden rounded-[8px] border bg-[color:var(--color-mint)]"
      style={{
        borderColor: "var(--color-green)",
        paddingInline: "20px",
        paddingBlock: "16px",
      }}
    >
      <div className="min-w-0 flex-1 pr-24 sm:pr-28">
        <span
          className="inline-flex items-center rounded-[4px] px-2 py-0.5 text-[14px] font-medium text-white"
          style={{ background: "var(--color-green)" }}
        >
          Coming soon
        </span>
        <h2 className="mt-2 text-[16px] font-semibold text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
          Tailor your resume to a job
        </h2>
        <p className="mt-1 text-[12px] text-[color:var(--color-foreground)]">
          One click will adapt your primary resume to a specific opening from your digest.
        </p>
      </div>
      <img
        src={comingSoonAsset.url}
        alt=""
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 h-full w-auto object-contain object-right-bottom"
      />
    </aside>
  );
}

// ---------- Upload card ----------

function UploadCard({
  state,
  pro,
  atLimit,
  uploads,
  fileError,
  onFiles,
  onConsent,
  onDismissError,
  hasAny,
}: {
  state: ReturnType<typeof useResumeState>;
  pro: boolean;
  atLimit: boolean;
  uploads: UploadTask[];
  fileError: FileError;
  onFiles: (files: FileList | null) => void;
  onConsent: (v: boolean) => void;
  onDismissError: () => void;
  hasAny: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const disabled = !state.consented || atLimit;
  const showCounter = !pro && state.files.length > 0;
  const showEmptyCopy = !hasAny;

  return (
    <section className="pt-1">
      {!state.consented ? (
        <label className="mb-3 flex cursor-pointer items-start gap-3 text-[13px] text-[color:var(--color-text-secondary)]">
          <input
            type="checkbox"
            checked={state.consented}
            onChange={(e) => onConsent(e.target.checked)}
            className="mt-[3px] h-[16px] w-[16px] shrink-0 accent-[color:var(--color-green)]"
          />
          <span style={{ fontWeight: 300 }}>
            I agree to Jobly storing my resume files to improve my job matches. I can delete
            them anytime.
          </span>
        </label>
      ) : null}

      <div
        onClick={() => !disabled && inputRef.current?.click()}
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
          onFiles(e.dataTransfer.files);
        }}
        aria-disabled={disabled}
        className={`flex flex-col items-center justify-center rounded-[6px] border border-dashed px-4 py-8 text-center transition-colors ${
          disabled
            ? "cursor-not-allowed border-[color:var(--color-border)] bg-[color:var(--color-surface-2)]/60"
            : "cursor-pointer border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] hover:bg-[color:var(--color-surface-2)]/60"
        } ${drag ? "border-[color:var(--color-accent)] bg-[color:var(--color-surface-2)]" : ""}`}
      >
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-[4px] ${
            disabled ? "text-[color:var(--color-text-muted)]" : "text-[color:var(--color-green)]"
          }`}
        >
          <UploadCloud size={22} strokeWidth={1.6} />
        </span>
        {atLimit ? (
          <>
            <p className="mt-3 text-[14px] text-[color:var(--color-text-secondary)]">
              You've reached the Free limit of 3 files.
            </p>
            <Link
              to="/settings"
              className="mt-2 text-[13px] font-semibold text-[color:var(--color-accent)] hover:underline"
            >
              Upgrade to Pro for unlimited resumes
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-[14px] text-[color:var(--color-foreground)]">
              Drag a file here or{" "}
              <span className="font-semibold text-[color:var(--color-green)] underline underline-offset-2">
                browse
              </span>
            </p>
            <p className="mt-1 text-[12px] text-[color:var(--color-text-muted)]">
              PDF or DOCX, up to 5 MB
            </p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          multiple
          onChange={(e) => {
            onFiles(e.target.files);
            if (inputRef.current) inputRef.current.value = "";
          }}
        />
      </div>

      {showEmptyCopy ? (
        <p
          className="mt-3 text-[13px] text-[color:var(--color-text-secondary)]"
          style={{ fontWeight: 300 }}
        >
          Your primary resume sharpens your match scores.
        </p>
      ) : null}

      {showCounter ? (
        <p className="mt-3 text-[12px] text-[color:var(--color-text-muted)]">
          {state.files.length} of {FREE_LIMIT} files
        </p>
      ) : null}

      {fileError ? (
        <div
          role="alert"
          className="mt-3 flex items-start justify-between gap-3 rounded-[6px] px-3 py-2 text-[13px]"
          style={{ background: "var(--color-danger-subtle)", color: "var(--color-danger)" }}
        >
          <span>{fileError.message}</span>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="shrink-0 font-semibold underline underline-offset-2"
          >
            Retry
          </button>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={onDismissError}
            className="shrink-0 rounded-[4px] p-0.5 hover:bg-black/5"
          >
            <X size={14} strokeWidth={1.8} />
          </button>
        </div>
      ) : null}

      {uploads.length > 0 ? (
        <div className="mt-3 flex flex-col gap-2">
          {uploads.map((u) => (
            <div key={u.id} className="rounded-[6px] border px-3 py-2">
              <div className="flex items-center justify-between text-[13px] text-[color:var(--color-foreground)]">
                <span className="truncate pr-2">{u.displayName}</span>
                <span className="shrink-0 text-[12px] text-[color:var(--color-text-muted)]">
                  {Math.round(u.pct)}%
                </span>
              </div>
              <div className="mt-2 h-1 w-full bg-[color:var(--color-surface-2)]">
                <div
                  className="h-1 bg-[color:var(--color-accent)] transition-all"
                  style={{ width: `${u.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

// ---------- File list ----------

function FileList({
  files,
  primaryId,
  onMakePrimary,
  onRename,
  onDelete,
}: {
  files: ResumeFile[];
  primaryId: string | null;
  onMakePrimary: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-[8px] border bg-[color:var(--color-surface-1)]">
      <ul className="divide-y">
        {files.map((f) => (
          <FileRow
            key={f.id}
            file={f}
            isPrimary={f.id === primaryId}
            onMakePrimary={() => onMakePrimary(f.id)}
            onRename={(name) => onRename(f.id, name)}
            onDelete={() => onDelete(f.id)}
          />
        ))}
      </ul>
    </section>
  );
}

function FileRow({
  file,
  isPrimary,
  onMakePrimary,
  onRename,
  onDelete,
}: {
  file: ResumeFile;
  isPrimary: boolean;
  onMakePrimary: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(file.name);
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!renaming) setDraft(file.name);
  }, [renaming, file.name]);

  useEffect(() => {
    if (renaming) inputRef.current?.select();
  }, [renaming]);

  const commit = () => {
    const t = draft.trim();
    if (t && t !== file.name) onRename(t);
    setRenaming(false);
  };

  return (
    <li className="flex items-center gap-3 px-4 py-3 sm:px-5">
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-accent)] text-[10px] font-bold uppercase tracking-wide text-[color:var(--color-foreground)]"
      >
        {file.ext === "pdf" ? "PDF" : "DOC"}
      </span>

      <div className="min-w-0 flex-1">
        {renaming ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              value={draft}
              maxLength={80}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") setRenaming(false);
              }}
              onBlur={commit}
              className="min-w-0 flex-1 rounded-[4px] border bg-white px-2 py-1 text-[14px] text-[color:var(--color-foreground)] outline-none focus:border-[color:var(--color-border-strong)]"
            />
            <span className="shrink-0 text-[13px] text-[color:var(--color-text-muted)]">
              .{file.ext}
            </span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-[14px] font-semibold text-[color:var(--color-foreground)]">
              {file.name}
              <span className="text-[color:var(--color-text-muted)]">.{file.ext}</span>
            </span>
            {isPrimary ? (
              <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-green)]">
                Primary
              </span>
            ) : null}
          </div>
        )}
        <div className="mt-0.5 text-[12px] text-[color:var(--color-text-muted)]">
          Uploaded {formatUploaded(file.uploadedAt)} · {formatSize(file.size)}
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        {confirming ? (
          <div className="flex items-center gap-2 text-[13px]">
            <span className="hidden text-[color:var(--color-text-secondary)] sm:inline">
              Delete this file?
            </span>
            <button
              type="button"
              onClick={onDelete}
              className="font-semibold text-[color:var(--color-danger)] hover:underline"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {!isPrimary && !renaming ? (
              <button
                type="button"
                onClick={onMakePrimary}
                className="hidden text-[13px] font-semibold text-[color:var(--color-green)] hover:underline sm:inline"
              >
                Make primary
              </button>
            ) : null}
            {!isPrimary && !renaming ? (
              <button
                type="button"
                aria-label="Make primary"
                onClick={onMakePrimary}
                className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-green)] hover:bg-[color:var(--color-surface-2)] sm:hidden"
              >
                <Check size={16} strokeWidth={1.8} />
              </button>
            ) : null}
            <button
              type="button"
              aria-label={renaming ? "Save name" : "Rename"}
              onClick={() => (renaming ? commit() : setRenaming(true))}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
            >
              <Pencil size={15} strokeWidth={1.6} />
            </button>
            <button
              type="button"
              aria-label="Delete"
              onClick={() => setConfirming(true)}
              className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
            >
              <Trash size={15} strokeWidth={1.6} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}