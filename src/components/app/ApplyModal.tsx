import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { IconDownload as Download, IconExternalLink as ExternalLink, IconBolt as Zap } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Job } from "@/lib/jobs-data";
import { markApplied } from "@/lib/tracker-store";
import { useResumeState } from "@/lib/resume-store";
import { useProfileExtras } from "@/lib/profile-store";

export type ApplyResult = { resumeName?: string; coverLetterName?: string };

export function ApplyModal({
  job,
  open,
  onClose,
  onApplied,
}: {
  job: Job;
  open: boolean;
  onClose: () => void;
  onApplied?: (r: ApplyResult) => void;
}) {
  const resume = useResumeState();
  const extras = useProfileExtras();
  const resumes = resume.files;
  const letters = extras.coverLetters;

  const defaultResumeId = resume.primaryId ?? resumes[0]?.id ?? "";
  const defaultLetterId = extras.defaultCoverLetterId ?? letters[0]?.id ?? "";

  const [resumeId, setResumeId] = useState(defaultResumeId);
  const [letterId, setLetterId] = useState(defaultLetterId);
  const [awaitingReturn, setAwaitingReturn] = useState(false);
  const [askReturn, setAskReturn] = useState(false);

  useEffect(() => {
    if (open) {
      setResumeId(defaultResumeId);
      setLetterId(defaultLetterId);
      setAwaitingReturn(false);
      setAskReturn(false);
    }
  }, [open, defaultResumeId, defaultLetterId]);

  const selectedResume = useMemo(() => resumes.find((r) => r.id === resumeId) ?? null, [resumes, resumeId]);
  const selectedLetter = useMemo(() => letters.find((l) => l.id === letterId) ?? null, [letters, letterId]);

  // "Did you apply?" prompt on focus return
  useEffect(() => {
    if (!awaitingReturn) return;
    const onFocus = () => {
      setAwaitingReturn(false);
      setAskReturn(true);
    };
    window.addEventListener("focus", onFocus, { once: true });
    return () => window.removeEventListener("focus", onFocus);
  }, [awaitingReturn]);

  function commitApplied() {
    const result: ApplyResult = {
      resumeName: selectedResume ? `${selectedResume.name}.${selectedResume.ext}` : undefined,
      coverLetterName: selectedLetter?.name,
    };
    markApplied(job.id, result);
    onApplied?.(result);
    onClose();
  }

  function handleApplyOnSite() {
    window.open(job.postingUrl ?? "#", "_blank", "noopener,noreferrer");
    setAwaitingReturn(true);
  }

  function downloadText(name: string, body: string) {
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  function downloadResume() {
    if (!selectedResume) return;
    downloadText(
      `${selectedResume.name}.${selectedResume.ext}`,
      `(Demo placeholder for résumé "${selectedResume.name}")`,
    );
  }

  function downloadLetter() {
    if (!selectedLetter) return;
    const text = selectedLetter.body.replace(/<[^>]+>/g, "\n").replace(/\n{2,}/g, "\n\n").trim();
    const filled = text
      .replace(/\{\{?company\}?\}/gi, job.company)
      .replace(/\{company\}/gi, job.company)
      .replace(/\{role\}/gi, job.title)
      .replace(/\{\{?hr_name\}?\}/gi, "there")
      .replace(/\{hiring manager\}/gi, "there");
    downloadText(`${selectedLetter.name}.txt`, filled);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[520px] rounded-[8px] p-5">
        <DialogTitle className="sr-only">Apply to {job.title}</DialogTitle>
        <div className="min-w-0">
          <div className="truncate text-[16px] font-semibold text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)" }}>
            {job.title}
          </div>
          <div className="mt-0.5 truncate text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {job.company} · {job.location}
          </div>
        </div>

        {/* Resume selector */}
        <div className="mt-5">
          <label className="block text-[13px] font-semibold text-[color:var(--color-foreground)]">
            Which resume are you sending?
          </label>
          {resumes.length === 0 ? (
            <p className="mt-2 text-[13px] text-[color:var(--color-text-muted)]">
              No resumes yet —{" "}
              <Link to="/profile" search={{ tab: "documents" }} onClick={onClose} className="font-semibold text-[color:var(--color-green)] hover:underline">
                Add one in Documents
              </Link>
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                className="h-10 flex-1 min-w-0 rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[14px]"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}.{r.ext}
                    {r.id === resume.primaryId ? " · Default" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={downloadResume}
                disabled={!selectedResume}
                aria-label="Download resume"
                className="inline-flex h-10 items-center gap-1 rounded-[4px] border px-3 text-[13px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-40"
              >
                <Download size={14} strokeWidth={1.8} /> Download
              </button>
            </div>
          )}
        </div>

        {/* Cover letter selector */}
        <div className="mt-4">
          <label className="block text-[13px] font-semibold text-[color:var(--color-foreground)]">
            Which cover letter template?
          </label>
          {letters.length === 0 ? (
            <p className="mt-2 text-[13px] text-[color:var(--color-text-muted)]">
              No templates yet —{" "}
              <Link to="/profile" search={{ tab: "letters" }} onClick={onClose} className="font-semibold text-[color:var(--color-green)] hover:underline">
                Create one in Cover Letters
              </Link>
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <select
                value={letterId}
                onChange={(e) => setLetterId(e.target.value)}
                className="h-10 flex-1 min-w-0 rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[14px]"
              >
                {letters.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                    {l.id === extras.defaultCoverLetterId ? " · Default" : ""}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={downloadLetter}
                disabled={!selectedLetter}
                aria-label="Download cover letter"
                className="inline-flex h-10 items-center gap-1 rounded-[4px] border px-3 text-[13px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-40"
              >
                <Download size={14} strokeWidth={1.8} /> Download
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={commitApplied}
            className="inline-flex h-11 flex-1 items-center justify-center rounded-[4px] border bg-[color:var(--color-surface-1)] px-4 text-[14px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
          >
            I already applied
          </button>
          <button
            type="button"
            onClick={handleApplyOnSite}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1 rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
          >
            <ExternalLink size={14} strokeWidth={1.8} />
            Apply on company site
            <Zap size={13} strokeWidth={2} fill="currentColor" />
          </button>
        </div>

        {askReturn ? (
          <div className="mt-4 rounded-[6px] border bg-[color:var(--color-surface-2)] p-3">
            <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">Did you apply?</div>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={commitApplied}
                className="inline-flex h-9 items-center rounded-[4px] bg-[color:var(--color-accent)] px-3 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
              >
                Yes, applied
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-9 items-center rounded-[4px] border px-3 text-[13px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-1)]"
              >
                Not yet
              </button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// Small in-place follow-up letter generator used from the Tracker.
export function FollowUpDialog({
  job,
  open,
  onClose,
}: {
  job: Job;
  open: boolean;
  onClose: () => void;
}) {
  const template = `Hi there,\n\nI wanted to follow up on my application for the ${job.title} role at ${job.company}. I remain very interested and would love to know if there are any updates or next steps.\n\nHappy to answer any questions or share more about my recent work — thank you for your time.\n\nBest,\n(your name)`;
  const [body, setBody] = useState(template);
  useEffect(() => {
    if (open) setBody(template);
  }, [open, template]);

  function copy() {
    navigator.clipboard?.writeText(body);
  }
  function download() {
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `follow-up-${job.company.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[560px] rounded-[8px] p-5">
        <DialogTitle className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Follow-up letter draft
        </DialogTitle>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
          A short nudge you can send if it's been a while with no reply.
        </p>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="mt-3 w-full resize-y rounded-[4px] border p-3 text-[13px] outline-none focus-visible:border-[color:var(--color-accent)]"
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-[4px] border px-3 text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={download}
            className="inline-flex h-10 items-center rounded-[4px] border px-3 text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
          >
            Download .txt
          </button>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-10 items-center rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
          >
            Copy
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}