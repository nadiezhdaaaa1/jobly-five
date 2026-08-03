import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  IconArrowDown as ArrowDown,
  IconArrowUp as ArrowUp,
  IconCheck as Check,
  IconLock as Lock,
  IconPencil as Pencil,
  IconPlus as Plus,
  IconTrash as Trash,
  IconX as X,
  IconChevronDown as ChevronDown,
  IconChevronRight as ChevronRight,
  IconRefresh as Refresh,
  IconCloudUpload as UploadCloud,
  IconFileText as FileText,
  IconDownload as Download,
  IconEye as Eye,
  IconStar as Star,
  IconCopy as Copy,
  IconBold as Bold,
  IconItalic as Italic,
  IconUnderline as Underline,
  IconList as ListUL,
  IconListNumbers as ListOL,
  IconLink as LinkIcon,
  IconClearFormatting as ClearFmt,
} from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
import { IconTooltip } from "@/components/app/IconTooltip";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  addEducation,
  addExperience,
  removeEducation,
  removeExperience,
  reorderExperience,
  updateEducation,
  updateExperience,
  useResumeState,
  type ResumeEducation,
  type ResumeExperience,
} from "@/lib/resume-store";
import {
  RESUME_CONSENT_WORDING,
  UPLOAD_ERROR_COPY,
  dismissLegacyResumeNotice,
  hasResumeConsent,
  legacyResumeNoticePending,
  makeResumePrimary,
  openResumeDownload,
  removeResume,
  uploadResume,
  useResumeDocuments,
  type ResumeDocument,
  type UploadErrorCode,
} from "@/lib/resume-documents-store";
import { usePlan, isPro } from "@/lib/plan-store";
import { loadQuiz, quizSummary, updateQuiz, type QuizAnswers } from "@/lib/quiz-store";
import { FIELD_ROLES, skillsForRoles, SOFT_SKILLS } from "@/lib/quiz-data";
import {
  FieldStep,
  RoleStep,
  SingleSkillStep,
  ExperienceStep,
  LocationStep,
} from "@/routes/quiz";
import {
  ACHIEVEMENT_LABELS,
  ALL_SOCIAL_NETWORKS,
  COVER_LETTER_LIMIT,
  LINK_LIMIT,
  addAchievement,
  addCoverLetter,
  addLink,
  addSocial,
  deleteCoverLetter,
  duplicateCoverLetter,
  fieldConfig,
  orderedBlocks,
  removeAchievement,
  removeLink,
  removeSocial,
  setApplyMode,
  setPortfolioFile,
  toggleApplyBlock,
  updateAchievement,
  updateCoverLetter,
  updateLink,
  updateSocial,
  useProfileExtras,
  type AchievementBlockKey,
  type CoverLetter,
} from "@/lib/profile-store";
import {
  deleteSavedFilter,
  renameSavedFilter,
  useSavedFilters,
  SAVED_FILTER_LIMIT,
} from "@/lib/saved-filters-store";

const TAB_KEYS = [
  "preferences",
  "documents",
  "letters",
  "portfolio",
  "experience",
  "searches",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  preferences: "Preferences",
  documents: "Resume",
  letters: "Cover letters",
  portfolio: "Portfolio and links",
  experience: "Experience",
  searches: "Saved searches",
};

const searchSchema = z.object({
  tab: z.enum(TAB_KEYS).optional(),
});

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Jobly" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: searchSchema,
  component: ProfileScreen,
});

// ---------- Toast helper ----------

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const show = (m: string) => {
    setMsg(m);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), 1800);
  };
  const node = msg ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-[4px] bg-[#090B0C] px-4 py-2 text-[13px] font-medium text-white md:bottom-8"
    >
      {msg}
    </div>
  ) : null;
  return { show, node };
}

// ==========================================================================
// Screen
// ==========================================================================

function ProfileScreen() {
  const { user } = useAuth();
  const search = useSearch({ from: "/_authenticated/profile" });
  const navigate = useNavigate({ from: "/_authenticated/profile" });
  const tab: TabKey = search.tab ?? "preferences";
  const setTab = (t: TabKey) => navigate({ to: "/profile", search: { tab: t }, replace: true });

  const [quiz, setQuiz] = useState<QuizAnswers>(() => loadQuiz());
  useEffect(() => setQuiz(loadQuiz()), []);
  const refreshQuiz = () => setQuiz({ ...loadQuiz() });

  const resume = useResumeState();
  const extras = useProfileExtras();
  const cfg = fieldConfig(quiz.field);
  const toast = useToast();

  // Identity
  const email = user?.email ?? "serhii@example.com";
  const [name, setName] = useState("");
  const [nameOpen, setNameOpen] = useState(false);
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      const fallback =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        (user.email ? user.email.split("@")[0] : "");
      setName(data?.display_name ?? fallback ?? "");
    })();
    return () => {
      active = false;
    };
  }, [user]);

  async function saveName(next: string) {
    if (!user) return;
    const trimmed = next.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: trimmed })
      .eq("id", user.id);
    if (!error) {
      setName(trimmed);
      setNameOpen(false);
      toast.show("Name updated");
    }
  }

  // Strength card (based on 5 checkable items)
  const strength = useMemo(() => {
    const hasPortfolio = (extras.links?.length ?? 0) > 0 || !!extras.portfolioFile;
    const items = [
      { key: "quiz", label: "Quiz completed", done: (quiz.roles?.length ?? 0) > 0 },
      { key: "resume", label: "Resume added", done: resume.hasResume },
      { key: "jobs", label: "Previous jobs", done: resume.data.experience.length > 0 },
      { key: "edu", label: "Education", done: resume.data.education.length > 0 },
      { key: "verify", label: "Verify your email", done: false },
    ];
    const done = items.filter((i) => i.done).length;
    return { items, pct: Math.round((done / 5) * 100), hasPortfolio };
  }, [quiz.roles, resume, extras.links, extras.portfolioFile]);

  return (
    <div className="min-h-screen overflow-x-clip bg-[color:var(--color-background)] pb-24 md:pb-8">
      <AppHeader active="profile" />
      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        {/* Header */}
        <section className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1
                className="min-w-0 truncate text-[24px] leading-tight text-[color:var(--color-foreground)]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
              >
                {name || "—"}
              </h1>
              <IconTooltip label="Edit name">
                <button
                  type="button"
                  onClick={() => setNameOpen(true)}
                  aria-label="Edit name"
                  className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
                >
                  <Pencil size={15} strokeWidth={1.6} />
                </button>
              </IconTooltip>
            </div>
            <div className="truncate text-[13px] text-[color:var(--color-text-muted)]">{email}</div>
          </div>
        </section>

        {/* Sub-tab bar */}
        <nav
          className="mt-6 flex gap-6 overflow-x-auto border-b"
          aria-label="Profile sections"
        >
          {TAB_KEYS.map((k) => {
            const active = tab === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 border-b-[2px] px-1 pb-3 text-[14px] transition-colors ${
                  active
                    ? "border-[color:var(--color-foreground)] text-[color:var(--color-foreground)] font-semibold"
                    : "border-transparent text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text-secondary)]"
                }`}
              >
                {TAB_LABELS[k]}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          {/* Main column with fade on tab switch */}
          <div key={tab} className="flex flex-col gap-4 animate-in fade-in duration-150">
            {tab === "preferences" && (
              <PreferencesTab
                quiz={quiz}
                cfg={cfg}
                onSaved={() => {
                  refreshQuiz();
                  toast.show("Preferences updated");
                }}
              />
            )}
            {tab === "documents" && (
              <DocumentsTab
                onToast={toast.show}
                resume={resume}
              />
            )}
            {tab === "letters" && (
              <CoverLettersTab letters={extras.coverLetters} onToast={toast.show} />
            )}
            {tab === "portfolio" && (
              <PortfolioTab
                extras={extras}
                cfg={cfg}
                onToast={toast.show}
              />
            )}
            {tab === "experience" && (
              <ExperienceTab
                resume={resume}
                onToast={toast.show}
              />
            )}
            {tab === "searches" && (
              <SavedSearchesTab onToast={toast.show} />
            )}
          </div>

          {/* Right sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 flex flex-col gap-4">
              <div className="rounded-[6px] border bg-[color:var(--color-surface-1)] p-4">
                <h3 className="text-[14px] font-semibold text-[color:var(--color-foreground)]">
                  Profile strength
                </h3>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1 flex-1 bg-[color:var(--color-surface-2)]">
                    <div
                      className="h-1 bg-[color:var(--color-green)]"
                      style={{ width: `${strength.pct}%` }}
                    />
                  </div>
                  <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">
                    {strength.pct}%
                  </div>
                </div>
                <ul className="mt-3 flex flex-col gap-2">
                  {strength.items.map((i) => (
                    <li key={i.key} className="flex items-center gap-2 text-[13px]">
                      {i.done ? (
                        <>
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-accent)]">
                            <Check size={11} strokeWidth={2.5} className="text-[color:var(--color-foreground)]" />
                          </span>
                          <span className="font-semibold text-[color:var(--color-foreground)]">{i.label}</span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border-strong)]" />
                          <span className="text-[color:var(--color-foreground)]">{i.label}</span>
                        </>
                      )}
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-[13px]">
                    {strength.hasPortfolio ? (
                      <>
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-accent)]">
                          <Check size={11} strokeWidth={2.5} className="text-[color:var(--color-foreground)]" />
                        </span>
                        <span className="font-semibold text-[color:var(--color-foreground)]">Portfolio — optional</span>
                      </>
                    ) : (
                      <>
                        <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)]" />
                        <span className="text-[color:var(--color-text-muted)]">Portfolio — optional</span>
                      </>
                    )}
                  </li>
                </ul>
                <p className="mt-3 text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
                  A fuller profile means sharper match scores.
                </p>
              </div>
              <div className="rounded-[6px] border bg-[color:var(--color-surface-1)] p-4">
                <h3 className="text-[14px] font-semibold text-[color:var(--color-foreground)]">
                  How matching works
                </h3>
                <p className="mt-2 text-[12px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
                  Your preferences, resume, and history are compared against every job we collect.
                  You can see the breakdown on any job card.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Name edit modal */}
      <NameModal open={nameOpen} initial={name} onClose={() => setNameOpen(false)} onSave={saveName} />

      {toast.node}
      <MobileTabBar active="profile" />
    </div>
  );
}

// ---------- Avatar ----------

function Avatar({
  url,
  name,
  uid,
  oldPath,
  onUpload,
  onRemove,
}: {
  url: string | null;
  name: string;
  uid?: string;
  oldPath: string | null;
  onUpload: (path: string, signedUrl: string) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !uid) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) return;
    setBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${uid}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) return;
      if (oldPath && oldPath !== path) {
        await supabase.storage.from("avatars").remove([oldPath]);
      }
      await supabase.from("profiles").update({ avatar_url: path }).eq("id", uid);
      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      if (signed?.signedUrl) onUpload(path, signed.signedUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label="Change avatar"
        className="group relative flex h-[60px] w-[60px] items-center justify-center overflow-hidden rounded-[6px] text-[22px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]"
        style={{ background: "linear-gradient(135deg, #00F1A9, #0E735A)" }}
      >
        {url ? (
          <img src={url} alt="Avatar" className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden>{name.charAt(0).toUpperCase()}</span>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      {url ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove avatar"
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border bg-[color:var(--color-surface-1)] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
        >
          <X size={11} strokeWidth={1.8} />
        </button>
      ) : null}
    </div>
  );
}

// ---------- Name modal ----------

function NameModal({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: string;
  onClose: () => void;
  onSave: (next: string) => void;
}) {
  const [val, setVal] = useState(initial);
  useEffect(() => { if (open) setVal(initial); }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[420px] rounded-[8px] p-5">
        <DialogTitle className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Edit name
        </DialogTitle>
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="mt-3 h-10 w-full rounded-[4px] border px-3 text-[14px]"
        />
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <PrimaryBtn onClick={() => onSave(val)}>Save</PrimaryBtn>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================================================
// Shared UI atoms
// ==========================================================================

function PrimaryBtn({
  children, onClick, type = "button", disabled,
}: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[14px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function SecondaryBtn({
  children, onClick, type = "button", disabled, danger,
}: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-[4px] border px-3 text-[13px] font-semibold hover:bg-[color:var(--color-surface-2)] disabled:opacity-50 ${
        danger
          ? "border-[color:var(--color-danger)] text-[color:var(--color-danger)]"
          : "border-[color:var(--color-border-strong)] text-[color:var(--color-foreground)]"
      }`}
    >
      {children}
    </button>
  );
}

function CardBig({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[8px] border bg-[color:var(--color-surface-1)] p-5 ${className}`}>
      {children}
    </section>
  );
}

function CardSmall({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-[6px] border bg-[color:var(--color-surface-1)] p-4 ${className}`}>
      {children}
    </div>
  );
}

function Tag({ children, tone = "gray" }: { children: React.ReactNode; tone?: "gray" | "mint" | "green" }) {
  const styles =
    tone === "mint"
      ? "bg-[color:var(--color-mint)] text-[color:var(--color-green)]"
      : tone === "green"
      ? "bg-[color:var(--color-green)] text-white"
      : "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-muted)]";
  return (
    <span className={`inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${styles}`}>
      {children}
    </span>
  );
}

function ConfirmModal({
  open, title, body, confirmLabel = "Delete", onClose, onConfirm,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[420px] rounded-[8px] p-5">
        <DialogTitle className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </DialogTitle>
        <div className="mt-2 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          {body}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center rounded-[4px] bg-[color:var(--color-danger)] px-4 text-[14px] font-semibold text-white hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================================================
// TAB 1 — Preferences
// ==========================================================================

type PrefKey =
  | "field"
  | "role"
  | "stack"
  | "hard"
  | "tools"
  | "soft"
  | "level"
  | "loc";

function PreferencesTab({
  quiz,
  cfg,
  onSaved,
}: {
  quiz: QuizAnswers;
  cfg: ReturnType<typeof fieldConfig>;
  onSaved: () => void;
}) {
  const s = quizSummary(quiz);
  const [editing, setEditing] = useState<PrefKey | null>(null);
  const [draft, setDraft] = useState<QuizAnswers>(quiz);
  useEffect(() => setDraft(quiz), [quiz, editing]);

  const rows: Array<{ key: PrefKey; label: string; value: string; done: boolean; hidden?: boolean }> = [
    { key: "field", label: "Field", value: quiz.field ?? "", done: !!quiz.field },
    { key: "role", label: "Role", value: (quiz.roles ?? []).join(", "), done: (quiz.roles?.length ?? 0) > 0 },
    { key: "stack", label: "Stack", value: (quiz.hardSkills ?? []).join(", "), done: (quiz.hardSkills?.length ?? 0) > 0, hidden: cfg.extraPref !== "stack" },
    { key: "hard", label: "Hard skills and methods", value: (quiz.hardSkills ?? []).join(", "), done: (quiz.hardSkills?.length ?? 0) > 0, hidden: cfg.extraPref === "stack" },
    { key: "tools", label: "Tools", value: (quiz.tools ?? []).join(", "), done: (quiz.tools?.length ?? 0) > 0 },
    { key: "soft", label: "Soft skills", value: (quiz.softSkills ?? []).join(", "), done: (quiz.softSkills?.length ?? 0) > 0 },
    { key: "level", label: "Experience", value: s.experience === "—" ? "" : s.experience, done: !!quiz.level },
    { key: "loc", label: "Salary and locations", value: [s.salary, s.locations, quiz.workMode === "remote" ? "Remote" : ""].filter((v) => v && v !== "—").join(" · "), done: !!(quiz.locations?.length || quiz.workMode === "remote") },
  ];

  const commit = () => {
    let out: QuizAnswers = { ...draft };
    if (out.field) {
      const allowed = new Set(FIELD_ROLES[out.field as keyof typeof FIELD_ROLES] ?? []);
      out.roles = (out.roles ?? []).filter((r) => allowed.has(r));
      out.role = out.roles[0];
    }
    const pool = skillsForRoles(out.roles ?? [], out.field);
    out.hardSkills = (out.hardSkills ?? []).filter((s2) => pool.hard.includes(s2));
    out.tools = (out.tools ?? []).filter((s2) => pool.tools.includes(s2));
    out.softSkills = (out.softSkills ?? []).filter((s2) => SOFT_SKILLS.includes(s2));
    updateQuiz(out);
    setEditing(null);
    onSaved();
  };

  const rolesList = draft.roles ?? (draft.role ? [draft.role] : []);
  const pool = skillsForRoles(rolesList, draft.field);

  return (
    <>
      <div className="overflow-hidden rounded-[8px] border bg-[color:var(--color-surface-1)]">
        {rows
          .filter((r) => !r.hidden)
          .map((row, idx, arr) => (
            <div
              key={row.key}
              role="button"
              tabIndex={0}
              onClick={() => setEditing(row.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEditing(row.key);
                }
              }}
              aria-label={`Edit ${row.label}`}
              className={`group/row flex cursor-pointer flex-col gap-2 p-4 transition-colors hover:bg-[#F9FBFB] focus:outline-none focus-visible:bg-[#F9FBFB] sm:flex-row sm:items-start sm:gap-4 ${
                idx < arr.length - 1 ? "border-b border-[color:var(--color-border)]" : ""
              }`}
            >
              <div className="flex shrink-0 items-center gap-1.5 sm:w-[168px] sm:pt-[2px]">
                <span className="body-small text-[#4B585B]">{row.label}</span>
                {row.key === "stack" ? <Tag>optional</Tag> : null}
              </div>
              <div
                className={`body-small min-w-0 flex-1 break-words ${
                  row.value
                    ? "text-[color:var(--color-foreground)]"
                    : "text-[color:var(--color-text-muted)]"
                }`}
              >
                {row.value || "Not set"}
              </div>
              <span
                aria-hidden="true"
                className="pointer-events-none inline-flex size-8 shrink-0 items-center justify-center self-start rounded-[4px] text-[color:var(--color-foreground)] lg:opacity-0 lg:transition-opacity lg:group-hover/row:opacity-100"
              >
                <Pencil size={16} strokeWidth={1.8} />
              </span>
            </div>
          ))}
      </div>

      {/* Edit modal — reuses quiz Step components */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="flex max-h-[90vh] max-w-[640px] flex-col rounded-[8px] p-0">
          <DialogTitle className="sr-only">
            Edit {rows.find((r) => r.key === editing)?.label ?? ""}
          </DialogTitle>
          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-0">
            {editing === "field" && (
              <FieldStep value={draft.field} onChange={(f) => setDraft((d) => ({ ...d, field: f }))} onContinue={commit} submitLabel="Save" onCancel={() => setEditing(null)} />
            )}
            {editing === "role" && (
              <RoleStep field={draft.field} value={draft.roles ?? []} onChange={(v) => setDraft((d) => ({ ...d, roles: v, role: v[0] }))} onContinue={commit} submitLabel="Save" onCancel={() => setEditing(null)} />
            )}
            {(editing === "hard" || editing === "stack") && (
              <SingleSkillStep
                title="Hard skills"
                description="Pick technologies you're strong with."
                label="Hard skills"
                hint="Select all that apply."
                options={pool.hard}
                value={draft.hardSkills ?? []}
                onChange={(v) => setDraft((d) => ({ ...d, hardSkills: v }))}
                onContinue={commit}
                searchPlaceholder="Search hard skills"
                required
                submitLabel="Save"
                onCancel={() => setEditing(null)}
              />
            )}
            {editing === "tools" && (
              <SingleSkillStep
                title="Tools you use"
                description="Pick the tools that match your workflow."
                label="Tools"
                hint="Select all that apply."
                options={pool.tools}
                value={draft.tools ?? []}
                onChange={(v) => setDraft((d) => ({ ...d, tools: v }))}
                onContinue={commit}
                searchPlaceholder="Search tools"
                required
                submitLabel="Save"
                onCancel={() => setEditing(null)}
              />
            )}
            {editing === "soft" && (
              <SingleSkillStep
                title="Soft skills"
                description="Pick the qualities that describe how you work."
                label="Soft skills"
                hint="Select all that apply."
                options={SOFT_SKILLS}
                value={draft.softSkills ?? []}
                onChange={(v) => setDraft((d) => ({ ...d, softSkills: v }))}
                onContinue={commit}
                searchPlaceholder="Search soft skills"
                required
                submitLabel="Save"
                onCancel={() => setEditing(null)}
              />
            )}
            {editing === "level" && (
              <ExperienceStep answers={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} onContinue={commit} submitLabel="Save" onCancel={() => setEditing(null)} />
            )}
            {editing === "loc" && (
              <LocationStep answers={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} onContinue={commit} submitLabel="Save" onCancel={() => setEditing(null)} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==========================================================================
// TAB 2 — Documents
// ==========================================================================

function DocumentsTab({
  onToast,
  docs,
  loading,
  refresh,
}: {
  onToast: (m: string) => void;
  docs: ResumeDocument[];
  loading: boolean;
  refresh: () => Promise<void>;
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<ResumeDocument | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState(false);
  useEffect(() => setNotice(legacyResumeNoticePending()), []);
  const plan = usePlan();
  const pro = isPro(plan);
  const MAX_FILES = pro ? 5 : 1;
  const MAX_MB = 5;
  const primaryId = docs.find((d) => d.isPrimary)?.id ?? null;
  const files = [...docs].sort((a, b) =>
    a.isPrimary ? -1 : b.isPrimary ? 1 : a.createdAt < b.createdAt ? 1 : -1
  );
  const atLimit = files.length >= MAX_FILES;

  return (
    <>
      {/* Resume */}
      <CardBig>
        <header className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Resume</h2>
          <span className="text-[12px] text-[color:var(--color-text-muted)]">
            {files.length} / {MAX_FILES}
          </span>
        </header>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          {pro
            ? `Upload up to ${MAX_FILES} resumes (PDF or DOCX, up to ${MAX_MB} MB each). Your primary resume is used for match scoring and applications; on upload we parse it into your Experience.`
            : `Free plan includes 1 resume (PDF or DOCX, up to ${MAX_MB} MB). Upgrade to Pro to keep up to 5.`}
        </p>

        {notice && (
          <div className="mt-3 flex items-start gap-2 rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-3">
            <p className="min-w-0 flex-1 text-[12px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              Resumes are now stored securely on your account. Files added before this update were only kept in
              your browser, so please upload them again.
            </p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => {
                dismissLegacyResumeNotice();
                setNotice(false);
              }}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
            >
              <X size={14} strokeWidth={1.8} />
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-2">
          {loading ? (
            <div className="h-[64px] animate-pulse rounded-[6px] bg-[color:var(--color-surface-2)]" />
          ) : files.length === 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-[6px] border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)]" aria-hidden>
                <FileText size={20} strokeWidth={1.6} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">No resumes yet</div>
                <div className="text-[12px] text-[color:var(--color-text-muted)]">
                  Upload a PDF or DOCX (up to {MAX_MB} MB) to use it for matching and applications.
                </div>
              </div>
              <PrimaryBtn onClick={() => setUploadOpen(true)}>
                <UploadCloud size={16} strokeWidth={1.8} />
                Upload resume
              </PrimaryBtn>
            </div>
          ) : (
            <>
              {files.map((f) => {
                const isPrimary = f.id === primaryId;
                const locked = !pro && !isPrimary;
                return (
                  <FileRow
                    key={f.id}
                    name={f.originalFilename}
                    meta={`Uploaded ${new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${Math.max(1, Math.round(f.sizeBytes / 1024))} KB`}
                    isPrimary={isPrimary}
                    locked={locked}
                    busy={busyId === f.id}
                    onDownload={
                      locked
                        ? undefined
                        : async () => {
                            setBusyId(f.id);
                            const ok = await openResumeDownload(f.id);
                            setBusyId(null);
                            if (!ok) onToast("Couldn't open that file. Try again.");
                          }
                    }
                    onMakePrimary={
                      isPrimary || locked
                        ? undefined
                        : async () => {
                            setBusyId(f.id);
                            const ok = await makeResumePrimary(f.id);
                            await refresh();
                            setBusyId(null);
                            onToast(ok ? "Primary resume updated" : "Couldn't update primary resume");
                          }
                    }
                    onDelete={() => setConfirmDel(f)}
                  />
                );
              })}
              {!atLimit && pro && (
                <div className="pt-1">
                  <SecondaryBtn onClick={() => setUploadOpen(true)}>
                    <UploadCloud size={16} strokeWidth={1.8} />
                    Upload resume
                  </SecondaryBtn>
                </div>
              )}
              {!pro && (
                <div className="mt-1 rounded-[12px] bg-[#F1F3F3] p-[4px]">
                <div
                  data-resume-upsell
                  className="relative isolate flex flex-col items-start gap-4 overflow-hidden rounded-[8px] border border-white bg-white/80 md:flex-row md:items-center md:gap-7"
                  style={{
                    boxShadow: "0 1px 4px rgba(12, 12, 13, 0.05)",
                    padding: "20px",
                  }}
                >
                  <style>{`@media (min-width: 768px) { [data-resume-upsell] { padding: 21px 33px 21px 25px !important; } }`}</style>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute right-[-32px] top-4 z-[1] hidden h-[140px] w-[140px] md:block"
                    style={{
                      right: "-64px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      width: 200,
                      height: 200,
                      background:
                        "radial-gradient(circle, #00F1A9 0%, rgba(0,241,169,0) 70%)",
                      filter: "blur(40px)",
                      opacity: 0.45,
                    }}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute right-[-32px] top-[-32px] z-[1] block h-[140px] w-[140px] md:hidden"
                    style={{
                      background:
                        "radial-gradient(circle, #00F1A9 0%, rgba(0,241,169,0) 70%)",
                      filter: "blur(40px)",
                      opacity: 0.45,
                    }}
                  />
                  <div className="relative z-[3] flex min-w-0 flex-1 flex-col gap-1">
                    <div className="text-[16px] leading-[24px] text-[#090B0C]" style={{ fontWeight: 400 }}>
                      Store up to 5 resumes with Pro
                    </div>
                    <div className="text-[14px] leading-[20px] text-[#67787C]" style={{ fontWeight: 300 }}>
                      Free plan is limited to 1 resume. Upgrade to Pro to tailor separate resumes for different roles.
                    </div>
                  </div>
                  <Link
                    to="/settings"
                    className="relative z-[2] inline-flex w-full shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] border border-[#00F1A9] bg-[#00F1A9] text-[#090B0C] hover:bg-[color:var(--color-accent-hover)] md:w-auto"
                    style={{ padding: "13px 17px", fontSize: 14, lineHeight: "20px", fontWeight: 400 }}
                  >
                    Upgrade to Pro
                  </Link>
                </div>
                </div>
              )}
              {pro && atLimit && (
                <p className="text-[12px] text-[color:var(--color-text-muted)]">
                  You've reached the {MAX_FILES}-file limit. Delete one to upload a new resume.
                </p>
              )}
            </>
          )}
        </div>
      </CardBig>

      {/* Coming-soon */}
      <div className="grid gap-4 md:grid-cols-2">
        <ComingSoonMini
          title="Tailor resume to a job"
          body="One click adapts your primary resume to a specific opening from your digest."
        />
        <ComingSoonMini
          title="ATS check"
          body="See how much of your resume an ATS can parse — plus fixes to raise your pass rate."
        />
      </div>

      <ResumeUploadModal
        open={uploadOpen}
        maxMB={MAX_MB}
        planLimitReached={files.length >= MAX_FILES}
        planLimitMessage={pro ? `Limit of ${MAX_FILES} resumes reached` : "Upgrade to Pro to store more resumes"}
        onClose={() => setUploadOpen(false)}
        onDone={async () => {
          await refresh();
          setUploadOpen(false);
          onToast("Resume uploaded");
        }}
      />

      <ConfirmModal
        open={confirmDel !== null}
        title="Delete resume?"
        body={
          <>
            <b>{confirmDel?.originalFilename}</b> will be permanently deleted. This cannot be undone.
          </>
        }
        onClose={() => setConfirmDel(null)}
        onConfirm={async () => {
          const target = confirmDel;
          setConfirmDel(null);
          if (!target) return;
          const ok = await removeResume(target.id);
          await refresh();
          onToast(ok ? "Resume deleted" : "Couldn't delete that resume. Try again.");
        }}
      />
    </>
  );
}

/** Real upload: consent gate, progress, server validation errors. */
function ResumeUploadModal({
  open,
  maxMB,
  planLimitReached,
  planLimitMessage,
  onClose,
  onDone,
}: {
  open: boolean;
  maxMB: number;
  planLimitReached: boolean;
  planLimitMessage: string;
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState(false);
  const [pct, setPct] = useState<number | null>(null);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentKnown, setConsentKnown] = useState(false);
  const [consented, setConsented] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setPct(null);
    setValidating(false);
    setChecked(false);
    let active = true;
    void hasResumeConsent().then((v) => {
      if (!active) return;
      setConsented(v);
      setConsentKnown(true);
    });
    return () => {
      active = false;
    };
  }, [open]);

  const busy = pct !== null || validating;
  const needsConsent = consentKnown && !consented;

  const start = async (file: File) => {
    if (busy) return;
    setError(null);
    if (planLimitReached) {
      setError(planLimitMessage);
      return;
    }
    if (needsConsent && !checked) {
      setError("Please agree to resume storage before uploading.");
      return;
    }
    setPct(0);
    const res = await uploadResume(file, {
      ...(needsConsent ? { consentWording: RESUME_CONSENT_WORDING } : {}),
      onProgress: (p) => {
        setPct(p);
        if (p >= 80) setValidating(true);
      },
    });
    setValidating(false);
    setPct(null);
    if (!res.ok) {
      setError(UPLOAD_ERROR_COPY[res.code as UploadErrorCode] ?? UPLOAD_ERROR_COPY.server);
      return;
    }
    await onDone();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-[480px] rounded-[8px] p-5">
        <DialogTitle className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Upload resume
        </DialogTitle>
        <div
          className={`mt-4 flex flex-col items-center justify-center rounded-[6px] border border-dashed px-4 py-10 text-center transition-colors ${
            drag ? "border-[color:var(--color-accent)] bg-[color:var(--color-surface-2)]" : "border-[color:var(--color-border-strong)]"
          } ${busy ? "pointer-events-none opacity-60" : ""}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void start(f);
          }}
          role="button"
          tabIndex={0}
        >
          <UploadCloud size={26} strokeWidth={1.6} className="text-[color:var(--color-green)]" />
          <p className="mt-3 text-[14px]">Drop file here or <span className="font-semibold text-[color:var(--color-green)] underline">browse</span></p>
          <p className="mt-1 text-[12px] text-[color:var(--color-text-muted)]">PDF or DOCX, up to {maxMB} MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void start(f);
            }}
          />
        </div>

        {needsConsent && (
          <label className="mt-3 flex cursor-pointer items-start gap-2 text-[12px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            <input
              type="checkbox"
              checked={checked}
              disabled={busy}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-[2px] size-4 shrink-0 rounded-[4px]"
            />
            <span>{RESUME_CONSENT_WORDING}</span>
          </label>
        )}

        {pct !== null && (
          <>
            <div className="mt-3 h-1 w-full bg-[color:var(--color-surface-2)]">
              <div className="h-1 bg-[color:var(--color-accent)] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-[12px] text-[color:var(--color-text-muted)]">
              {validating ? "Checking file…" : `Uploading… ${pct}%`}
            </p>
          </>
        )}

        {error && (
          <p className="mt-3 text-[12px] text-[color:var(--color-danger)]">{error}</p>
        )}

        <div className="mt-4 flex justify-end">
          <SecondaryBtn onClick={onClose} disabled={busy}>Cancel</SecondaryBtn>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FileRow({
  name, meta, onPreview, onReplace, onDelete, isPrimary, onMakePrimary, locked,
}: {
  name: string;
  meta: string;
  onPreview?: () => void;
  onReplace?: () => void;
  onDelete: () => void;
  isPrimary?: boolean;
  onMakePrimary?: () => void;
  locked?: boolean;
}) {
  return (
    <div className={`group/row flex items-center gap-3 rounded-[6px] border bg-[color:var(--color-surface-1)] p-3 ${locked ? "opacity-60" : ""}`}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]"
        style={{ background: "var(--color-mint)", color: "var(--color-green)" }}
        aria-hidden
      >
        {locked ? <Lock size={20} strokeWidth={1.6} /> : <FileText size={20} strokeWidth={1.6} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="truncate text-[14px] font-semibold text-[color:var(--color-foreground)]">{name}</div>
          {isPrimary && <Tag tone="mint">Primary</Tag>}
          {locked && (
            <IconTooltip label="Available on Pro">
              <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[11px] font-semibold text-[color:var(--color-text-muted)]">
                Locked
              </span>
            </IconTooltip>
          )}
        </div>
        <div className="truncate text-[12px] text-[color:var(--color-text-muted)]">{meta}</div>
      </div>
      <div className="flex items-center gap-1 lg:opacity-0 lg:transition-opacity lg:group-hover/row:opacity-100 lg:focus-within:opacity-100">
        {onPreview && (
          <RowIconBtn onClick={onPreview} label="Preview"><Eye size={16} strokeWidth={1.8} /></RowIconBtn>
        )}
        {onMakePrimary && (
          <RowIconBtn onClick={onMakePrimary} label="Make primary"><Star size={16} strokeWidth={1.8} /></RowIconBtn>
        )}
        {onReplace && (
          <RowIconBtn onClick={onReplace} label="Replace"><Refresh size={16} strokeWidth={1.8} /></RowIconBtn>
        )}
        <RowIconBtn onClick={onDelete} label="Delete" danger><Trash size={16} strokeWidth={1.8} /></RowIconBtn>
      </div>
    </div>
  );
}

function RowIconBtn({
  children, onClick, label, danger,
}: { children: React.ReactNode; onClick: () => void; label: string; danger?: boolean }) {
  return (
    <IconTooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`inline-flex size-8 items-center justify-center rounded-[4px] hover:bg-[color:var(--color-surface-2)] ${
          danger ? "text-[color:var(--color-danger)]" : "text-[color:var(--color-foreground)]"
        }`}
      >
        {children}
      </button>
    </IconTooltip>
  );
}

function GhostBtn({
  children, onClick, type = "button", disabled,
}: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-[4px] px-3 text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function DropzoneRow({ hint, label, onClick }: { hint: string; label: string; onClick: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[6px] border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)]" aria-hidden>
        <FileText size={20} strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">No file yet</div>
        <div className="text-[12px] text-[color:var(--color-text-muted)]">{hint}</div>
      </div>
      <PrimaryBtn onClick={onClick}><UploadCloud size={16} strokeWidth={1.8} />{label}</PrimaryBtn>
    </div>
  );
}

function ComingSoonMini({ title, body }: { title: string; body: string }) {
  return (
    <div className="pointer-events-none rounded-[8px] border bg-[color:var(--color-surface-1)] p-4 opacity-55">
      <Tag>Coming soon</Tag>
      <h3 className="mt-2 text-[14px] font-semibold text-[color:var(--color-foreground)]">{title}</h3>
      <p className="mt-1 text-[12px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        {body}
      </p>
    </div>
  );
}

function UploadModal({
  open, title, maxMB, onClose, onFile,
}: {
  open: boolean; title: string; maxMB: number; onClose: () => void; onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [drag, setDrag] = useState(false);
  const [pct, setPct] = useState<number | null>(null);

  const start = (file: File) => {
    if (file.size > maxMB * 1024 * 1024) return;
    setPct(0);
    let p = 0;
    const iv = window.setInterval(() => {
      p = Math.min(100, p + 20);
      setPct(p);
      if (p >= 100) {
        window.clearInterval(iv);
        window.setTimeout(() => {
          setPct(null);
          onFile(file);
        }, 200);
      }
    }, 140);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[480px] rounded-[8px] p-5">
        <DialogTitle className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </DialogTitle>
        <div
          className={`mt-4 flex flex-col items-center justify-center rounded-[6px] border border-dashed px-4 py-10 text-center transition-colors ${
            drag ? "border-[color:var(--color-accent)] bg-[color:var(--color-surface-2)]" : "border-[color:var(--color-border-strong)]"
          }`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) start(f);
          }}
          role="button"
          tabIndex={0}
        >
          <UploadCloud size={26} strokeWidth={1.6} className="text-[color:var(--color-green)]" />
          <p className="mt-3 text-[14px]">Drop file here or <span className="font-semibold text-[color:var(--color-green)] underline">browse</span></p>
          <p className="mt-1 text-[12px] text-[color:var(--color-text-muted)]">PDF or DOCX, up to {maxMB} MB</p>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) start(f);
            }}
          />
        </div>
        {pct !== null ? (
          <div className="mt-3 h-1 w-full bg-[color:var(--color-surface-2)]">
            <div className="h-1 bg-[color:var(--color-accent)] transition-all" style={{ width: `${pct}%` }} />
          </div>
        ) : null}
        <div className="mt-4 flex justify-end">
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================================================
// TAB 3 — Cover letters
// ==========================================================================

function CoverLettersTab({
  letters,
  onToast,
}: {
  letters: CoverLetter[];
  onToast: (m: string) => void;
}) {
  const [editing, setEditing] = useState<CoverLetter | "new" | null>(null);
  const [confirmDel, setConfirmDel] = useState<CoverLetter | null>(null);
  const plan = usePlan();
  const pro = isPro(plan);
  const MAX_LETTERS = pro ? COVER_LETTER_LIMIT : 1;
  const activeId = letters[0]?.id ?? null;
  const atLimit = letters.length >= MAX_LETTERS;

  return (
    <>
      <CardBig>
        <header className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Cover letters</h2>
          <span className="text-[12px] text-[color:var(--color-text-muted)]">
            {letters.length} / {MAX_LETTERS}
          </span>
        </header>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          {pro
            ? `Up to ${COVER_LETTER_LIMIT} reusable templates. Pick one when you apply. Your achievements can be appended automatically — set that up under Achievements → When you apply.`
            : `Free plan includes 1 cover letter template. Upgrade to Pro to keep up to ${COVER_LETTER_LIMIT}.`}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {letters.length === 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-[6px] border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)]" aria-hidden>
                <FileText size={20} strokeWidth={1.6} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">No templates yet</div>
                <div className="text-[12px] text-[color:var(--color-text-muted)]">Create a reusable cover letter to apply faster.</div>
              </div>
              <PrimaryBtn onClick={() => setEditing("new")}>
                <Plus size={16} strokeWidth={1.8} />
                New template
              </PrimaryBtn>
            </div>
          ) : (
            <>
              {letters.map((l) => {
                const isActive = l.id === activeId;
                const locked = !pro && !isActive;
                return (
                  <LetterRow
                    key={l.id}
                    name={l.name}
                    meta={stripHtml(l.body).slice(0, 96)}
                    isActive={!pro && isActive}
                    locked={locked}
                    onEdit={locked ? undefined : () => setEditing(l)}
                    onDuplicate={
                      locked
                        ? undefined
                        : () => {
                            if (letters.length >= MAX_LETTERS) {
                              onToast(`Limit of ${MAX_LETTERS} reached`);
                              return;
                            }
                            const ok = duplicateCoverLetter(l.id);
                            if (!ok) onToast(`Limit of ${COVER_LETTER_LIMIT} reached`);
                          }
                    }
                    onDelete={() => setConfirmDel(l)}
                  />
                );
              })}
              {!atLimit && pro && (
                <div className="pt-1">
                  <SecondaryBtn onClick={() => setEditing("new")}>
                    <Plus size={16} strokeWidth={1.8} />
                    New template
                  </SecondaryBtn>
                </div>
              )}
              {!pro && (
                <div className="mt-1 rounded-[12px] bg-[#F1F3F3] p-[4px]">
                  <div
                    data-letters-upsell
                    className="relative isolate flex flex-col items-start gap-4 overflow-hidden rounded-[8px] border border-white bg-white/80 md:flex-row md:items-center md:gap-7"
                    style={{
                      boxShadow: "0 1px 4px rgba(12, 12, 13, 0.05)",
                      padding: "20px",
                    }}
                  >
                    <style>{`@media (min-width: 768px) { [data-letters-upsell] { padding: 21px 33px 21px 25px !important; } }`}</style>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute right-[-32px] top-4 z-[1] hidden h-[140px] w-[140px] md:block"
                      style={{
                        right: "-64px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 200,
                        height: 200,
                        background:
                          "radial-gradient(circle, #00F1A9 0%, rgba(0,241,169,0) 70%)",
                        filter: "blur(40px)",
                        opacity: 0.45,
                      }}
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute right-[-32px] top-[-32px] z-[1] block h-[140px] w-[140px] md:hidden"
                      style={{
                        background:
                          "radial-gradient(circle, #00F1A9 0%, rgba(0,241,169,0) 70%)",
                        filter: "blur(40px)",
                        opacity: 0.45,
                      }}
                    />
                    <div className="relative z-[3] flex min-w-0 flex-1 flex-col gap-1">
                      <div className="text-[16px] leading-[24px] text-[#090B0C]" style={{ fontWeight: 400 }}>
                        Store up to {COVER_LETTER_LIMIT} cover letters with Pro
                      </div>
                      <div className="text-[14px] leading-[20px] text-[#67787C]" style={{ fontWeight: 300 }}>
                        Free plan is limited to 1 template. Upgrade to Pro to tailor cover letters for different roles.
                      </div>
                    </div>
                    <Link
                      to="/settings"
                      className="relative z-[2] inline-flex w-full shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] border border-[#00F1A9] bg-[#00F1A9] text-[#090B0C] hover:bg-[color:var(--color-accent-hover)] md:w-auto"
                      style={{ padding: "13px 17px", fontSize: 14, lineHeight: "20px", fontWeight: 400 }}
                    >
                      Upgrade to Pro
                    </Link>
                  </div>
                </div>
              )}
              {pro && atLimit && (
                <p className="text-[12px] text-[color:var(--color-text-muted)]">
                  You've reached the {MAX_LETTERS}-template limit. Delete one to add a new template.
                </p>
              )}
            </>
          )}
        </div>
      </CardBig>

      <ComingSoonMini
        title="AI cover letter per job"
        body="Jobly drafts a unique cover letter tailored to each opening."
      />

      <CoverEditor
        open={editing !== null}
        letter={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSave={(name, body) => {
          if (editing === "new") {
            const cl = addCoverLetter({ name, body });
            if (!cl) onToast(`Limit of ${COVER_LETTER_LIMIT} reached`);
            else onToast("Template saved");
          } else if (editing) {
            updateCoverLetter(editing.id, { name, body });
            onToast("Template saved");
          }
          setEditing(null);
        }}
      />

      <ConfirmModal
        open={confirmDel !== null}
        title="Delete template?"
        body="This removes the template. You can add a new one anytime."
        onClose={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel) {
            deleteCoverLetter(confirmDel.id);
            onToast("Template deleted");
          }
          setConfirmDel(null);
        }}
      />
    </>
  );
}

function stripHtml(s: string): string {
  if (typeof document === "undefined") return s.replace(/<[^>]+>/g, " ");
  const d = document.createElement("div");
  d.innerHTML = s;
  return d.textContent ?? "";
}

function LetterRow({
  name, meta, onEdit, onDuplicate, onDelete, isActive, locked,
}: {
  name: string;
  meta: string;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete: () => void;
  isActive?: boolean;
  locked?: boolean;
}) {
  return (
    <div className={`group/row flex items-center gap-3 rounded-[6px] border bg-[color:var(--color-surface-1)] p-3 ${locked ? "opacity-60" : ""}`}>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]"
        style={{ background: "var(--color-mint)", color: "var(--color-green)" }}
        aria-hidden
      >
        {locked ? <Lock size={20} strokeWidth={1.6} /> : <FileText size={20} strokeWidth={1.6} />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="truncate text-[14px] font-semibold text-[color:var(--color-foreground)]">{name}</div>
          {isActive && <Tag tone="mint">Active</Tag>}
          {locked && (
            <IconTooltip label="Available on Pro">
              <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[11px] font-semibold text-[color:var(--color-text-muted)]">
                Locked
              </span>
            </IconTooltip>
          )}
        </div>
        <div className="truncate text-[12px] text-[color:var(--color-text-muted)]">{meta}</div>
      </div>
      <div className="flex items-center gap-1 lg:opacity-0 lg:transition-opacity lg:group-hover/row:opacity-100 lg:focus-within:opacity-100">
        {onEdit && <RowIconBtn onClick={onEdit} label="Edit"><Pencil size={16} strokeWidth={1.8} /></RowIconBtn>}
        {onDuplicate && <RowIconBtn onClick={onDuplicate} label="Duplicate"><Copy size={16} strokeWidth={1.8} /></RowIconBtn>}
        <RowIconBtn onClick={onDelete} label="Delete" danger><Trash size={16} strokeWidth={1.8} /></RowIconBtn>
      </div>
    </div>
  );
}

function CoverEditor({
  open, letter, onClose, onSave,
}: {
  open: boolean;
  letter: CoverLetter | null;
  onClose: () => void;
  onSave: (name: string, body: string) => void;
}) {
  const [name, setName] = useState("");
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(letter?.name ?? "");
    if (ref.current) ref.current.innerHTML = letter?.body ?? "<p>Write your template…</p>";
  }, [open, letter]);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[640px] rounded-[8px] p-5">
        <DialogTitle className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {letter ? "Edit template" : "New template"}
        </DialogTitle>
        <label className="mt-3 block text-[12px] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
          Template name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 h-10 w-full rounded-[4px] border px-3 text-[14px]"
          placeholder="e.g. General — product roles"
        />
        <p className="mt-3 text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
          Use {"{company}"}, {"{role}"}, {"{hiring manager}"}, {"{years}"} — they're filled in when you apply.
        </p>
        <div className="mt-2 flex flex-wrap gap-1 border-b py-1">
          {[
            [Bold, "bold", "Bold"], [Italic, "italic", "Italic"], [Underline, "underline", "Underline"],
            [ListUL, "insertUnorderedList", "Bulleted list"], [ListOL, "insertOrderedList", "Numbered list"],
          ].map(([I, cmd, label]) => {
            const Icon = I as typeof Bold;
            return (
              <IconTooltip key={cmd as string} label={label as string}>
                <button type="button" aria-label={label as string} onClick={() => exec(cmd as string)} className="flex h-[34px] w-[34px] items-center justify-center rounded-[4px] border text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]">
                  <Icon size={15} strokeWidth={1.8} />
                </button>
              </IconTooltip>
            );
          })}
          <IconTooltip label="Link">
            <button type="button" aria-label="Link" onClick={() => { const url = window.prompt("Link URL"); if (url) exec("createLink", url); }} className="flex h-[34px] w-[34px] items-center justify-center rounded-[4px] border text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]">
              <LinkIcon size={15} strokeWidth={1.8} />
            </button>
          </IconTooltip>
          <IconTooltip label="Clear formatting">
            <button type="button" aria-label="Clear formatting" onClick={() => exec("removeFormat")} className="flex h-[34px] w-[34px] items-center justify-center rounded-[4px] border text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]">
              <ClearFmt size={15} strokeWidth={1.8} />
            </button>
          </IconTooltip>
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          className="mt-2 min-h-[220px] rounded-[4px] border p-3 text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]"
        />
        <div className="mt-4 flex justify-end gap-2">
          <SecondaryBtn onClick={onClose}>Cancel</SecondaryBtn>
          <PrimaryBtn onClick={() => onSave(name.trim() || "Untitled template", ref.current?.innerHTML ?? "")}>Save template</PrimaryBtn>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================================================
// TAB 4 — Portfolio & links
// ==========================================================================

function PortfolioTab({
  extras,
  cfg,
  onToast,
}: {
  extras: ReturnType<typeof useProfileExtras>;
  cfg: ReturnType<typeof fieldConfig>;
  onToast: (m: string) => void;
}) {
  const [portfolioUpload, setPortfolioUpload] = useState(false);

  return (
    <>
      {/* Portfolio links */}
      <CardBig>
        <header className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Portfolio links</h2>
          <Tag>up to {LINK_LIMIT}</Tag>
        </header>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          Live links to your work. Pick a type, or "Other" to name it. Suggested for your field:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {cfg.portfolioTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                const ok = addLink({ type: t, url: "" });
                if (!ok) onToast("Link limit reached");
              }}
              className="inline-flex items-center gap-1 rounded-[4px] border border-dashed border-[color:var(--color-green)] px-2 py-1 text-[12px] font-semibold text-[color:var(--color-green)] hover:bg-[color:var(--color-mint)]"
            >
              <Plus size={12} strokeWidth={2.2} />
              {t}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {extras.links.map((l) => (
            <div key={l.id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[160px_1fr_auto]">
              <select
                value={l.type}
                onChange={(e) => updateLink(l.id, { type: e.target.value })}
                className="h-10 rounded-[4px] border pl-2 pr-8 text-[13px]"
                aria-label="Link type"
              >
                {[...cfg.portfolioTypes, "Other"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              {l.type === "Other" ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    placeholder="Label"
                    value={l.label ?? ""}
                    onChange={(e) => updateLink(l.id, { label: e.target.value })}
                    className="h-10 flex-1 rounded-[4px] border px-3 text-[13px]"
                  />
                  <input
                    placeholder="https://"
                    value={l.url}
                    onChange={(e) => updateLink(l.id, { url: e.target.value })}
                    className="h-10 flex-1 rounded-[4px] border px-3 text-[13px]"
                  />
                </div>
              ) : (
                <input
                  placeholder="https://"
                  value={l.url}
                  onChange={(e) => updateLink(l.id, { url: e.target.value })}
                  className="h-10 rounded-[4px] border px-3 text-[13px]"
                />
              )}
              <IconTooltip label="Remove">
                <button type="button" onClick={() => removeLink(l.id)} aria-label="Remove" className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]">
                  <X size={16} strokeWidth={1.6} />
                </button>
              </IconTooltip>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const ok = addLink({ type: cfg.portfolioTypes[0] ?? "Other", url: "" });
            if (!ok) onToast("Link limit reached");
          }}
          className="mt-3 inline-flex h-8 items-center gap-1.5 self-start rounded-[4px] border border-[color:var(--color-border-strong)] px-3 text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
        >
          <Plus size={16} stroke={2} />
          Add link
        </button>
      </CardBig>

      {/* Portfolio file */}
      <CardBig>
        <header className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Portfolio file</h2>
          <Tag>optional</Tag>
        </header>
        {cfg.portfolioHint ? (
          <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {cfg.portfolioHint}
          </p>
        ) : null}
        <div className="mt-3">
          {extras.portfolioFile ? (
            <FileRow
              name={extras.portfolioFile.name}
              meta={`Uploaded ${new Date(extras.portfolioFile.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${Math.max(1, Math.round(extras.portfolioFile.size / 1024))} KB`}
              onPreview={() => onToast("Preview coming soon")}
              onReplace={() => setPortfolioUpload(true)}
              onDelete={() => { setPortfolioFile(null); onToast("Portfolio deleted"); }}
            />
          ) : (
            <DropzoneRow
              hint="PDF, up to 20 MB"
              label="Upload portfolio"
              onClick={() => setPortfolioUpload(true)}
            />
          )}
        </div>
      </CardBig>

      {/* Socials */}
      <CardBig>
        <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Social and profiles</h2>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          Suggested for your field:
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {cfg.socialNetworks.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addSocial({ network: s, url: "" })}
              className="inline-flex items-center gap-1 rounded-[4px] border border-dashed border-[color:var(--color-green)] px-2 py-1 text-[12px] font-semibold text-[color:var(--color-green)] hover:bg-[color:var(--color-mint)]"
            >
              <Plus size={12} strokeWidth={2.2} />
              {s}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {extras.socials.map((s) => (
            <div key={s.id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[180px_1fr_auto]">
              <select
                value={s.network}
                onChange={(e) => updateSocial(s.id, { network: e.target.value })}
                className="h-10 rounded-[4px] border pl-2 pr-8 text-[13px]"
                aria-label="Network"
              >
                {ALL_SOCIAL_NETWORKS.map((n) => <option key={n}>{n}</option>)}
              </select>
              <input
                placeholder="https://"
                value={s.url}
                onChange={(e) => updateSocial(s.id, { url: e.target.value })}
                className="h-10 rounded-[4px] border px-3 text-[13px]"
              />
              <IconTooltip label="Remove">
                <button type="button" onClick={() => removeSocial(s.id)} aria-label="Remove" className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]">
                  <X size={16} strokeWidth={1.6} />
                </button>
              </IconTooltip>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addSocial({ network: "LinkedIn", url: "" })}
          className="mt-3 inline-flex h-8 items-center gap-1.5 self-start rounded-[4px] border border-[color:var(--color-border-strong)] px-3 text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
        >
          <Plus size={16} stroke={2} />
          Add profile
        </button>
      </CardBig>

      <UploadModal
        open={portfolioUpload}
        title="Upload portfolio"
        maxMB={20}
        onClose={() => setPortfolioUpload(false)}
        onFile={(f) => {
          setPortfolioFile({ name: f.name, size: f.size, uploadedAt: new Date().toISOString() });
          setPortfolioUpload(false);
          onToast("Portfolio uploaded");
        }}
      />
    </>
  );
}

// ==========================================================================
// TAB 5 — Achievements
// ==========================================================================

function AchievementsTab({
  extras,
  cfg,
  onToast,
}: {
  extras: ReturnType<typeof useProfileExtras>;
  cfg: ReturnType<typeof fieldConfig>;
  onToast: (m: string) => void;
}) {
  const suggested = cfg.suggestedBlocks;
  const blocks = orderedBlocks(suggested);
  const [openBlocks, setOpenBlocks] = useState<Record<AchievementBlockKey, boolean>>(() => {
    const out = {} as Record<AchievementBlockKey, boolean>;
    for (const b of blocks) out[b] = suggested.includes(b);
    return out;
  });

  return (
    <>
      <CardBig>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Achievements and activity</h2>
            <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              Optional blocks of achievements and professional activity. Kept structured so they can be attached
              to applications.
            </p>
          </div>
          <SecondaryBtn onClick={() => onToast("PDF export coming soon")}>
            <Download size={14} strokeWidth={1.8} />
            Download achievements PDF
          </SecondaryBtn>
        </div>
        <hr className="my-4 border-t border-[color:var(--color-border)]" />
        <p className="text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          On apply, your achievements are appended to the cover letter automatically — with a preview before
          sending. If an employer caps the letter length, choose how to include them:
        </p>
        <div className="mt-3 flex flex-col gap-3">
          <ApplyRadio
            checked={extras.applyMode === "blocks"}
            onClick={() => setApplyMode("blocks")}
            title="Attach key blocks — you choose"
            body="Keeps the letter short. Pick the blocks to include:"
          >
            <div className="mt-2 flex flex-wrap gap-2">
              {blocks.map((b) => {
                const on = extras.applyBlocks.includes(b);
                return (
                  <label key={b} className={`inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] border px-2 py-1 text-[12px] ${on ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-[color:var(--color-foreground)] font-semibold" : "border-[color:var(--color-border-strong)] text-[color:var(--color-foreground)]"}`}>
                    <input type="checkbox" checked={on} onChange={() => toggleApplyBlock(b)} className="sr-only" />
                    {ACHIEVEMENT_LABELS[b]}
                  </label>
                );
              })}
            </div>
          </ApplyRadio>
          <ApplyRadio
            checked={extras.applyMode === "pdf"}
            onClick={() => setApplyMode("pdf")}
            title="Attach full profile as PDF"
            body="A multi-page PDF of everything on this page, attached to the application."
          >
            <div className="mt-2">
              <SecondaryBtn onClick={() => onToast("Download coming soon")}>
                <Download size={14} strokeWidth={1.8} />
                Download full profile (PDF)
              </SecondaryBtn>
            </div>
          </ApplyRadio>
        </div>
      </CardBig>

      <div className="flex flex-col gap-3">
        {blocks.map((b) => {
          const entries = extras.achievements[b];
          const isSuggested = suggested.includes(b);
          const open = openBlocks[b] ?? false;
          return (
            <CardSmall key={b}>
              <button
                type="button"
                onClick={() => setOpenBlocks((s) => ({ ...s, [b]: !s[b] }))}
                className="flex w-full items-center justify-between gap-3"
                aria-expanded={open}
              >
                <span className="flex flex-col items-start gap-1 text-[14px] font-semibold text-[color:var(--color-foreground)]">
                  <div className="flex items-center gap-2">
                    {ACHIEVEMENT_LABELS[b]}
                    {isSuggested ? <Tag tone="mint">SUGGESTED</Tag> : null}
                  </div>
                  <span className="text-[12px] font-normal text-[color:var(--color-text-muted)]">({entries.length})</span>
                </span>
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              {open ? (
                <div className="mt-3 flex flex-col gap-2">
                  {entries.map((e) => (
                    <div key={e.id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <input
                        value={e.description}
                        onChange={(ev) => updateAchievement(b, e.id, { description: ev.target.value })}
                        placeholder={cfg.achievementExamples?.[b] ?? "Description"}
                        className="h-10 rounded-[4px] border px-3 text-[13px]"
                      />
                      <input
                        value={e.url}
                        onChange={(ev) => updateAchievement(b, e.id, { url: ev.target.value })}
                        placeholder="https://"
                        className="h-10 rounded-[4px] border px-3 text-[13px]"
                      />
                      <button type="button" onClick={() => removeAchievement(b, e.id)} aria-label="Remove" className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]">
                        <X size={16} strokeWidth={1.6} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addAchievement(b)}
                    className="self-start text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
                  >
                    + Add entry
                  </button>
                </div>
              ) : null}
            </CardSmall>
          );
        })}
      </div>
    </>
  );
}

function ApplyRadio({
  checked, onClick, title, body, children,
}: {
  checked: boolean;
  onClick: () => void;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`cursor-pointer rounded-[6px] border p-3 ${
        checked ? "border-[color:var(--color-accent)] bg-[color:var(--color-surface-1)]" : "border-[color:var(--color-border)]"
      }`}
      onClick={onClick}
      role="radio"
      aria-checked={checked}
      tabIndex={0}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${checked ? "border-[color:var(--color-accent)]" : "border-[color:var(--color-border-strong)]"}`}>
          {checked ? <span className="h-2 w-2 rounded-full bg-[color:var(--color-accent)]" /> : null}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">{title}</div>
          <div className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>{body}</div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ==========================================================================
// TAB 6 — Experience
// ==========================================================================

const DEGREE_TYPES = ["Bachelor's", "Master's", "PhD", "Bootcamp", "Certificate", "Other"];
function yearOptions() {
  const now = new Date().getFullYear();
  const out: string[] = [];
  for (let y = now + 1; y >= 1970; y--) out.push(String(y));
  return out;
}

function ExperienceTab({
  resume,
  onToast,
}: {
  resume: ReturnType<typeof useResumeState>;
  onToast: (m: string) => void;
}) {
  const [editingExp, setEditingExp] = useState<string | null>(null);
  const [editingEdu, setEditingEdu] = useState<string | null>(null);
  const [confirmReimport, setConfirmReimport] = useState(false);

  const hasResume = resume.hasResume;
  const lead = hasResume
    ? "Pulled from your resume so you don't retype it — edit or add. Structured history sharpens matching; the PDF alone isn't enough."
    : "Add your work history manually, or upload a resume on the Documents tab to auto-fill it.";

  return (
    <>
      <CardBig>
        <header className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Previous jobs</h2>
          {hasResume ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="Coming soon"
              className="inline-flex h-8 items-center gap-1.5 rounded-[4px] border border-[color:var(--color-border-strong)] px-2.5 text-[12px] font-medium text-[color:var(--color-text-muted)] opacity-60 cursor-not-allowed"
            >
              <Refresh size={12} strokeWidth={1.8} />
              Re-import from resume
              <span className="ml-1 rounded-[3px] bg-[color:var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
                Coming soon
              </span>
            </button>
          ) : null}
        </header>
        <div className="mt-3 flex flex-col divide-y">
          {resume.data.experience.length === 0 ? (
            <div className="py-4 text-[13px] text-[color:var(--color-text-secondary)]">
              No previous jobs yet. Adding them improves your match accuracy.
            </div>
          ) : (
            resume.data.experience.map((e, idx) => (
              <JobEntry
                key={e.id}
                entry={e}
                index={idx}
                total={resume.data.experience.length}
                editing={editingExp === e.id}
                onEdit={() => setEditingExp(e.id)}
                onDone={() => { setEditingExp(null); onToast("Experience updated"); }}
              />
            ))
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditingExp(addExperience())}
          className="mt-3 inline-flex h-8 items-center gap-1.5 self-start rounded-[4px] border border-[color:var(--color-border-strong)] px-3 text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
        >
          <Plus size={16} stroke={2} />
          Add previous job
        </button>
      </CardBig>

      <CardBig>
        <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Education</h2>
        <div className="mt-3 flex flex-col divide-y">
          {resume.data.education.length === 0 ? (
            <div className="py-4 text-[13px] text-[color:var(--color-text-secondary)]">No education added yet.</div>
          ) : (
            resume.data.education.map((e) => (
              <EduEntry
                key={e.id}
                entry={e}
                editing={editingEdu === e.id}
                onEdit={() => setEditingEdu(e.id)}
                onDone={() => { setEditingEdu(null); onToast("Education updated"); }}
              />
            ))
          )}
        </div>
        <button
          type="button"
          onClick={() => setEditingEdu(addEducation())}
          className="mt-3 inline-flex h-8 items-center gap-1.5 self-start rounded-[4px] border border-[color:var(--color-border-strong)] px-3 text-[13px] font-semibold text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
        >
          <Plus size={16} stroke={2} />
          Add education
        </button>
      </CardBig>

      <ConfirmModal
        open={confirmReimport}
        title="Re-import from resume?"
        body="This replaces manual edits with the parsed resume content."
        confirmLabel="Re-import"
        onClose={() => setConfirmReimport(false)}
        onConfirm={() => {
          setConfirmReimport(false);
          onToast("Re-imported from resume");
        }}
      />
    </>
  );
}

function JobEntry({
  entry, index, total, editing, onEdit, onDone,
}: {
  entry: ResumeExperience;
  index: number;
  total: number;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
}) {
  const [role, setRole] = useState(entry.role);
  const [company, setCompany] = useState(entry.company);
  const [fromYear, setFromYear] = useState<string>("");
  const [toYear, setToYear] = useState<string>("");
  const [desc, setDesc] = useState<string>(entry.description ?? entry.bullets.join(" "));
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (editing) {
      setRole(entry.role);
      setCompany(entry.company);
      setDesc(entry.description ?? entry.bullets.join(" "));
      const m = entry.dates.match(/(\d{4}).*?(Present|\d{4})/);
      setFromYear(m?.[1] ?? "");
      setToYear(m?.[2] ?? "");
    }
  }, [editing, entry]);

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-3 py-4">
        <div className="min-w-0 flex-1">
          <h6 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 16, lineHeight: 1.4 }} className="text-[color:var(--color-foreground)]">
            {entry.role || "Untitled role"}
          </h6>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2" style={{ fontWeight: 300, fontSize: 14, lineHeight: 1.5 }}>
            <span className="text-[color:var(--color-text-secondary)]">{entry.company}</span>
            {entry.dates ? (
              <span className="text-[color:var(--color-text-muted)]">
                · {(entry.dates.match(/^\s*(\d{4}\s*[—-]\s*(?:Present|\d{4}))/i)?.[1] ?? entry.dates).trim()}
              </span>
            ) : null}
          </div>
          {(entry.description || entry.bullets.length) ? (
            <p className="mt-2 line-clamp-4 break-words text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              {entry.description || entry.bullets.join(" ")}
            </p>
          ) : null}
        </div>
        <IconTooltip label="Edit">
          <button
            type="button"
            aria-label="Edit"
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
          >
            <Pencil size={15} strokeWidth={1.6} />
          </button>
        </IconTooltip>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const dates = fromYear ? `${fromYear} — ${toYear || "Present"}` : "";
        updateExperience(entry.id, { role, company, dates, description: desc });
        onDone();
      }}
      className="flex flex-col gap-2 py-4"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <input autoFocus aria-label="Position" placeholder="e.g. Senior Frontend Engineer" value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-[4px] border px-3 text-[13px]" />
        <input aria-label="Company" placeholder="e.g. Nimbus Corp" value={company} onChange={(e) => setCompany(e.target.value)} className="h-10 rounded-[4px] border px-3 text-[13px]" />
      </div>
      <div className="flex items-center gap-2">
        <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} className="h-10 rounded-[4px] border pl-2 pr-8 text-[13px]" aria-label="From year">
          <option value="">From</option>
          {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-[13px] text-[color:var(--color-text-muted)]">to</span>
        <select value={toYear} onChange={(e) => setToYear(e.target.value)} className="h-10 rounded-[4px] border pl-2 pr-8 text-[13px]" aria-label="To year">
          <option value="">To</option>
          <option value="Present">Present</option>
          {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-1">
          <IconTooltip label="Move up"><button type="button" aria-label="Move up" disabled={index === 0} onClick={() => reorderExperience(entry.id, -1)} className="rounded-[4px] p-1 text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"><ArrowUp size={14} /></button></IconTooltip>
          <IconTooltip label="Move down"><button type="button" aria-label="Move down" disabled={index === total - 1} onClick={() => reorderExperience(entry.id, 1)} className="rounded-[4px] p-1 text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"><ArrowDown size={14} /></button></IconTooltip>
        </div>
      </div>
      <textarea aria-label="Responsibilities and achievements" placeholder="What you did and what it changed" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} className="w-full rounded-[4px] border p-3 text-[13px]" />
      <div className="flex flex-wrap items-center gap-2">
        <PrimaryBtn type="submit">Save</PrimaryBtn>
        <SecondaryBtn onClick={onDone}>Cancel</SecondaryBtn>
        <div className="ml-auto">
          {confirming ? (
            <span className="inline-flex flex-wrap items-center gap-2 text-[12px]">
              Remove this job?
              <button type="button" onClick={() => { removeExperience(entry.id); onDone(); }} className="rounded-[4px] bg-[color:var(--color-danger-subtle)] px-2 py-1 text-[color:var(--color-danger)]">Remove</button>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-[4px] px-2 py-1 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]">Keep</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="text-[12px] text-[color:var(--color-text-secondary)] hover:underline">Remove</button>
          )}
        </div>
      </div>
    </form>
  );
}

// ==========================================================================
// TAB 7 — Saved searches
// ==========================================================================

function SavedSearchesTab({ onToast }: { onToast: (m: string) => void }) {
  const saved = useSavedFilters();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const startEdit = (id: string, current: string) => {
    setEditingId(id);
    setDraftName(current);
  };

  const commitRename = (id: string) => {
    const next = draftName.trim();
    if (!next) {
      setEditingId(null);
      return;
    }
    renameSavedFilter(id, next);
    setEditingId(null);
    onToast("Saved search renamed");
  };

  return (
    <>
      <CardBig>
        <header className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Saved searches</h2>
          <span className="text-[12px] text-[color:var(--color-text-muted)]">
            {saved.length} / {SAVED_FILTER_LIMIT}
          </span>
        </header>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          Up to {SAVED_FILTER_LIMIT} filter sets you saved from your Digest. Rename them to remember what
          each one is for, or delete the ones you no longer use.
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {saved.length === 0 ? (
            <div className="flex flex-wrap items-center gap-3 rounded-[6px] border border-dashed border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-1)] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)]" aria-hidden>
                <FileText size={20} strokeWidth={1.6} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold text-[color:var(--color-foreground)]">No saved searches yet</div>
                <div className="text-[12px] text-[color:var(--color-text-muted)]">
                  Open the Digest, tune your filters, and use "Save filter" to store them here.
                </div>
              </div>
            </div>
          ) : (
            saved.map((s) => {
              const editing = editingId === s.id;
              const asking = confirmDel === s.id;
              const summary = summarizeSavedFilter(s.filters);
              return (
                <div
                  key={s.id}
                  className="group/row flex items-center gap-3 rounded-[6px] border bg-[color:var(--color-surface-1)] p-3"
                >
                  <div className="min-w-0 flex-1">
                    {editing ? (
                      <input
                        autoFocus
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(s.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-9 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3 text-[14px]"
                        aria-label="Search name"
                      />
                    ) : (
                      <>
                        <div className="truncate text-[14px] font-semibold text-[color:var(--color-foreground)]">
                          {s.name}
                        </div>
                        <div className="text-[12px] text-[color:var(--color-text-muted)] break-words">
                          {summary || "No filters selected"}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {asking ? (
                      <div className="flex items-center gap-2 text-[12px]">
                        <span>Delete?</span>
                        <button
                          type="button"
                          onClick={() => {
                            deleteSavedFilter(s.id);
                            setConfirmDel(null);
                            onToast("Saved search deleted");
                          }}
                          className="rounded-[4px] bg-[color:var(--color-danger-subtle)] px-2 py-1 text-[color:var(--color-danger)]"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDel(null)}
                          className="rounded-[4px] px-2 py-1 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                        >
                          Keep
                        </button>
                      </div>
                    ) : editing ? (
                      <>
                        <GhostBtn onClick={() => commitRename(s.id)}>Save</GhostBtn>
                        <GhostBtn onClick={() => setEditingId(null)}>Cancel</GhostBtn>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 lg:opacity-0 lg:transition-opacity lg:group-hover/row:opacity-100 lg:focus-within:opacity-100">
                          <RowIconBtn onClick={() => startEdit(s.id, s.name)} label="Rename"><Pencil size={16} strokeWidth={1.8} /></RowIconBtn>
                          <RowIconBtn onClick={() => setConfirmDel(s.id)} label="Delete" danger><Trash size={16} strokeWidth={1.8} /></RowIconBtn>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardBig>
    </>
  );
}

function summarizeSavedFilter(f: unknown): string {
  if (!f || typeof f !== "object") return "";
  const s = f as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof s.field === "string" && s.field && s.field !== "Any") parts.push(s.field);
  if (Array.isArray(s.roles) && s.roles.length) {
    parts.push(s.roles.length === 1 ? String(s.roles[0]) : `${s.roles.length} roles`);
  }
  if (Array.isArray(s.seniority) && s.seniority.length) parts.push(s.seniority.join(", "));
  if (Array.isArray(s.years) && s.years.length) {
    parts.push(s.years.length === 1 ? String(s.years[0]) : `${s.years.length} exp ranges`);
  }
  if (typeof s.english === "string" && s.english) parts.push(`English ${s.english}`);
  if (s.onlyRemote === true) parts.push("Remote only");
  if (Array.isArray(s.locations) && s.locations.length) {
    parts.push(s.locations.length === 1 ? String(s.locations[0]) : `${s.locations.length} locations`);
  }
  if (Array.isArray(s.sources) && s.sources.length) {
    parts.push(s.sources.length === 1 ? String(s.sources[0]) : `${s.sources.length} sources`);
  }
  if (typeof s.minMatch === "number" && s.minMatch > 0) parts.push(`Match ≥ ${s.minMatch}%`);
  if (typeof s.minSalary === "number" && s.minSalary > 0) {
    parts.push(`Salary ≥ $${Math.round(s.minSalary / 1000)}k`);
  }
  if (typeof s.postedWithin === "string" && s.postedWithin && s.postedWithin !== "any") {
    parts.push(`Posted ${s.postedWithin}`);
  }
  return parts.join(" · ");
}

function EduEntry({ entry, editing, onEdit, onDone }: { entry: ResumeEducation; editing: boolean; onEdit: () => void; onDone: () => void }) {
  const [degreeType, setDegreeType] = useState(entry.degreeType ?? "");
  const [field, setField] = useState(entry.field ?? "");
  const [school, setSchool] = useState(entry.school);
  const [fromYear, setFromYear] = useState<string>("");
  const [toYear, setToYear] = useState<string>("");
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (editing) {
      setDegreeType(entry.degreeType ?? "");
      setField(entry.field ?? "");
      setSchool(entry.school);
      const m = entry.years.match(/(\d{4}).*?(Present|\d{4})/);
      setFromYear(m?.[1] ?? "");
      setToYear(m?.[2] ?? "");
    }
  }, [editing, entry]);

  if (!editing) {
    const heading = [entry.degreeType, entry.field].filter(Boolean).join(" · ") || entry.degree || "Untitled";
    return (
      <div className="flex items-start justify-between gap-3 py-4">
        <div className="min-w-0 flex-1">
          <h6 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 16, lineHeight: 1.4 }} className="text-[color:var(--color-foreground)]">
            {heading}
          </h6>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-2" style={{ fontWeight: 300, fontSize: 14, lineHeight: 1.5 }}>
            <span className="text-[color:var(--color-text-secondary)]">{entry.school}</span>
            {entry.years ? <span className="text-[color:var(--color-text-muted)]">· {entry.years}</span> : null}
          </div>
        </div>
        <IconTooltip label="Edit">
          <button type="button" aria-label="Edit" onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]">
            <Pencil size={15} strokeWidth={1.6} />
          </button>
        </IconTooltip>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const years = fromYear ? `${fromYear} — ${toYear || "Present"}` : "";
        const degree = [degreeType, field].filter(Boolean).join(" in ") || entry.degree;
        updateEducation(entry.id, { degreeType, field, school, years, degree });
        onDone();
      }}
      className="flex flex-col gap-2 py-4"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <select autoFocus value={degreeType} onChange={(e) => setDegreeType(e.target.value)} className="h-10 rounded-[4px] border pl-2 pr-8 text-[13px]" aria-label="Degree">
          <option value="">Degree</option>
          {DEGREE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input aria-label="Field" placeholder="e.g. Computer Science" value={field} onChange={(e) => setField(e.target.value)} className="h-10 rounded-[4px] border px-3 text-[13px]" />
      </div>
      <input aria-label="School" placeholder="School" value={school} onChange={(e) => setSchool(e.target.value)} className="h-10 rounded-[4px] border px-3 text-[13px]" />
      <div className="flex items-center gap-2">
        <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} className="h-10 rounded-[4px] border pl-2 pr-8 text-[13px]" aria-label="From year">
          <option value="">From</option>
          {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-[13px] text-[color:var(--color-text-muted)]">to</span>
        <select value={toYear} onChange={(e) => setToYear(e.target.value)} className="h-10 rounded-[4px] border pl-2 pr-8 text-[13px]" aria-label="To year">
          <option value="">To</option>
          <option value="Present">Present</option>
          {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PrimaryBtn type="submit">Save</PrimaryBtn>
        <SecondaryBtn onClick={onDone}>Cancel</SecondaryBtn>
        <div className="ml-auto">
          {confirming ? (
            <span className="inline-flex flex-wrap items-center gap-2 text-[12px]">
              Remove this education?
              <button type="button" onClick={() => { removeEducation(entry.id); onDone(); }} className="rounded-[4px] bg-[color:var(--color-danger-subtle)] px-2 py-1 text-[color:var(--color-danger)]">Remove</button>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-[4px] px-2 py-1 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]">Keep</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className="text-[12px] text-[color:var(--color-text-secondary)] hover:underline">Remove</button>
          )}
        </div>
      </div>
    </form>
  );
}