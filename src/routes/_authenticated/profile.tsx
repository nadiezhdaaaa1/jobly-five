import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  IconArrowDown as ArrowDown,
  IconArrowUp as ArrowUp,
  IconCheck as Check,
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
  IconBold as Bold,
  IconItalic as Italic,
  IconUnderline as Underline,
  IconList as ListUL,
  IconListNumbers as ListOL,
  IconLink as LinkIcon,
  IconClearFormatting as ClearFmt,
} from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
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
  addResumeFile,
  deleteResumeFile,
  setPrimaryResumeFile,
  type ResumeEducation,
  type ResumeExperience,
} from "@/lib/resume-store";
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
  setCvFile,
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

const TAB_KEYS = [
  "preferences",
  "documents",
  "letters",
  "portfolio",
  "achievements",
  "experience",
] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  preferences: "Preferences",
  documents: "Documents",
  letters: "Cover letters",
  portfolio: "Portfolio & links",
  achievements: "Achievements",
  experience: "Experience",
};

const searchSchema = z.object({
  tab: z.enum(TAB_KEYS).optional(),
});

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Jobly" },
      { name: "robots", content: "noindex" },
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [nameOpen, setNameOpen] = useState(false);
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url, display_name")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;
      const fallback =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        (user.email ? user.email.split("@")[0] : "");
      setName(data?.display_name ?? fallback ?? "");
      const path = data?.avatar_url ?? null;
      if (!path) return;
      setAvatarPath(path);
      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      if (active && signed?.signedUrl) setAvatarUrl(signed.signedUrl);
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
    const items = [
      { key: "quiz", label: "Quiz completed", done: (quiz.roles?.length ?? 0) > 0 },
      { key: "resume", label: "Résumé added", done: resume.hasResume },
      { key: "jobs", label: "Previous jobs", done: resume.data.experience.length > 0 },
      { key: "edu", label: "Education", done: resume.data.education.length > 0 },
      { key: "verify", label: "Verify your email", done: false },
    ];
    const done = items.filter((i) => i.done).length;
    return { items, pct: Math.round((done / 5) * 100) };
  }, [quiz.roles, resume]);

  return (
    <div className="min-h-screen overflow-x-clip bg-[color:var(--color-background)] pb-24 md:pb-8">
      <AppHeader active="profile" />
      <main className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
        {/* Header */}
        <section className="flex items-center gap-4">
          <Avatar
            url={avatarUrl}
            name={name || "S"}
            onUpload={(path, signed) => {
              setAvatarPath(path);
              setAvatarUrl(signed);
            }}
            onRemove={async () => {
              if (!user || !avatarPath) return;
              await supabase.storage.from("avatars").remove([avatarPath]);
              await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
              setAvatarPath(null);
              setAvatarUrl(null);
            }}
            uid={user?.id}
            oldPath={avatarPath}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1
                className="min-w-0 truncate text-[24px] leading-tight text-[color:var(--color-foreground)]"
                style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}
              >
                {name || "—"}
              </h1>
              <button
                type="button"
                onClick={() => setNameOpen(true)}
                aria-label="Edit name"
                className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
              >
                <Pencil size={15} strokeWidth={1.6} />
              </button>
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
                className={`shrink-0 border-b-2 pb-3 text-[14px] transition-colors ${
                  active
                    ? "border-[color:var(--color-accent)] text-[color:var(--color-foreground)] font-semibold"
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
                cvFile={extras.cvFile}
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
            {tab === "achievements" && (
              <AchievementsTab
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
                  <li className="flex items-center gap-2 text-[13px] text-[color:var(--color-text-muted)]">
                    <span className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)]" />
                    CV / portfolio — optional
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
                  Your preferences, résumé, and history are compared against every job we collect.
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
        <label className="mt-3 block text-[12px] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
          Display name
        </label>
        <input
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          className="mt-2 h-10 w-full rounded-[4px] border px-3 text-[14px]"
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
    { key: "hard", label: "Hard skills & methods", value: (quiz.hardSkills ?? []).join(", "), done: (quiz.hardSkills?.length ?? 0) > 0, hidden: cfg.extraPref === "stack" },
    { key: "tools", label: "Tools", value: (quiz.tools ?? []).join(", "), done: (quiz.tools?.length ?? 0) > 0 },
    { key: "soft", label: "Soft skills", value: (quiz.softSkills ?? []).join(", "), done: (quiz.softSkills?.length ?? 0) > 0 },
    { key: "level", label: "Experience", value: s.experience === "—" ? "" : s.experience, done: !!quiz.level },
    { key: "loc", label: "Location & salary", value: [s.salary, s.locations].filter((v) => v && v !== "—").join(" · "), done: !!(quiz.locations?.length || quiz.workMode === "remote") },
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
      <p className="text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        Collected from onboarding. This powers your match score.
      </p>
      <div className="flex flex-col gap-3">
        {rows
          .filter((r) => !r.hidden)
          .map((row) => (
            <div
              key={row.key}
              className="flex items-start gap-3 rounded-[6px] border bg-[color:var(--color-surface-1)] p-3"
            >
              <div
                className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[4px] ${
                  row.done
                    ? "bg-[color:var(--color-accent)] text-[color:var(--color-foreground)]"
                    : "bg-[color:var(--color-surface-2)] text-[color:var(--color-text-muted)]"
                }`}
                aria-hidden
              >
                {row.done ? <Check size={16} strokeWidth={2.4} /> : <X size={14} strokeWidth={1.8} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-text-muted)]">
                  {row.label}
                  {row.key === "stack" ? <span className="ml-1"><Tag>optional</Tag></span> : null}
                </div>
                <div
                  className={`mt-1 truncate text-[14px] ${
                    row.value
                      ? "text-[color:var(--color-foreground)]"
                      : "text-[color:var(--color-text-muted)]"
                  }`}
                  style={{ fontWeight: row.value ? 600 : 400 }}
                >
                  {row.value || "Not set"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(row.key)}
                aria-label={`Edit ${row.label}`}
                className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
              >
                <Pencil size={15} strokeWidth={1.6} />
              </button>
            </div>
          ))}
      </div>

      {/* Edit modal — reuses quiz Step components */}
      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-[640px] rounded-[8px] p-5">
          <DialogTitle className="text-[16px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
            Edit {rows.find((r) => r.key === editing)?.label ?? ""}
          </DialogTitle>
          <div className="mt-3 max-h-[70vh] overflow-y-auto">
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
  resume,
  cvFile,
}: {
  onToast: (m: string) => void;
  resume: ReturnType<typeof useResumeState>;
  cvFile: { name: string; size: number; uploadedAt: string } | null;
}) {
  const [uploadOpen, setUploadOpen] = useState<null | "resume" | "cv">(null);
  const [confirmDel, setConfirmDel] = useState<null | "resume" | "cv">(null);

  const primary = resume.files.find((f) => f.id === resume.primaryId) ?? null;

  return (
    <>
      <p className="text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        Upload the documents you send with applications.
      </p>

      {/* Résumé */}
      <CardBig>
        <header className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Résumé</h2>
          <Tag tone="mint">Primary</Tag>
        </header>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          Your main document — US standard, 1–2 pages. Used for match scoring and applications. On upload we
          parse it into your Experience.
        </p>
        <div className="mt-3">
          {primary ? (
            <FileRow
              name={`${primary.name}.${primary.ext}`}
              meta={`Uploaded ${new Date(primary.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${Math.max(1, Math.round(primary.size / 1024))} KB`}
              onPreview={() => onToast("Preview coming soon")}
              onReplace={() => setUploadOpen("resume")}
              onDelete={() => setConfirmDel("resume")}
            />
          ) : (
            <DropzoneRow
              hint="PDF or DOCX, up to 10 MB"
              label="Upload résumé"
              onClick={() => setUploadOpen("resume")}
            />
          )}
        </div>
      </CardBig>

      {/* CV */}
      <CardBig>
        <header className="flex items-center gap-2">
          <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">CV</h2>
          <Tag>optional</Tag>
        </header>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
          Long-form document for academic / research / medical roles. Your résumé stays the primary document.
        </p>
        <div className="mt-3">
          {cvFile ? (
            <FileRow
              name={cvFile.name}
              meta={`Uploaded ${new Date(cvFile.uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${Math.max(1, Math.round(cvFile.size / 1024))} KB`}
              onPreview={() => onToast("Preview coming soon")}
              onReplace={() => setUploadOpen("cv")}
              onDelete={() => setConfirmDel("cv")}
            />
          ) : (
            <DropzoneRow
              hint="PDF or DOCX, up to 10 MB"
              label="Upload CV"
              onClick={() => setUploadOpen("cv")}
            />
          )}
        </div>
      </CardBig>

      {/* Coming-soon */}
      <div className="grid gap-4 md:grid-cols-2">
        <ComingSoonMini
          title="Tailor résumé to a job"
          body="One click adapts your primary résumé to a specific opening from your digest."
        />
        <ComingSoonMini
          title="ATS check"
          body="See how much of your résumé or CV an ATS can parse — plus fixes to raise your pass rate."
        />
      </div>

      <UploadModal
        open={uploadOpen !== null}
        title={uploadOpen === "cv" ? "Upload CV" : "Upload résumé"}
        maxMB={10}
        onClose={() => setUploadOpen(null)}
        onFile={(file) => {
          if (uploadOpen === "resume") {
            const ext = file.name.toLowerCase().endsWith(".docx") ? "docx" : "pdf";
            const base = file.name.replace(/\.[^.]+$/, "");
            addResumeFile({ name: base, ext, size: file.size });
            onToast("Résumé uploaded · Experience updated");
          } else if (uploadOpen === "cv") {
            setCvFile({ name: file.name, size: file.size, uploadedAt: new Date().toISOString() });
            onToast("CV uploaded");
          }
          setUploadOpen(null);
        }}
      />

      <ConfirmModal
        open={confirmDel !== null}
        title={confirmDel === "cv" ? "Delete CV?" : "Delete résumé?"}
        body="This removes the file from your profile. You can upload it again anytime."
        onClose={() => setConfirmDel(null)}
        onConfirm={() => {
          if (confirmDel === "resume" && primary) {
            deleteResumeFile(primary.id);
            onToast("Résumé deleted");
          } else if (confirmDel === "cv") {
            setCvFile(null);
            onToast("CV deleted");
          }
          setConfirmDel(null);
        }}
      />
    </>
  );
}

function FileRow({
  name, meta, onPreview, onReplace, onDelete,
}: {
  name: string; meta: string; onPreview: () => void; onReplace: () => void; onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[6px] border bg-[color:var(--color-surface-1)] p-3">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px]"
        style={{ background: "var(--color-mint)", color: "var(--color-green)" }}
        aria-hidden
      >
        <FileText size={20} strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-semibold text-[color:var(--color-foreground)]">{name}</div>
        <div className="truncate text-[12px] text-[color:var(--color-text-muted)]">{meta}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <SecondaryBtn onClick={onPreview}>Preview</SecondaryBtn>
        <SecondaryBtn onClick={onReplace}>Replace</SecondaryBtn>
        <SecondaryBtn danger onClick={onDelete}>Delete</SecondaryBtn>
      </div>
    </div>
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
  const remaining = COVER_LETTER_LIMIT - letters.length;

  return (
    <>
      <p className="text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        Up to {COVER_LETTER_LIMIT} reusable templates. Pick one when you apply.
      </p>
      <div
        className="rounded-[6px] border bg-[color:var(--color-mint)] px-4 py-3 text-[13px] text-[color:var(--color-foreground)]"
        style={{ borderColor: "var(--color-green)" }}
      >
        Your achievements can be appended to the letter automatically when you apply — set that up under{" "}
        <span className="font-semibold">Achievements → When you apply</span>. You'll always preview before sending.
      </div>
      <div className="flex flex-col gap-3">
        {letters.map((l) => (
          <CardSmall key={l.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-[color:var(--color-foreground)]">{l.name}</div>
                <p className="mt-1 line-clamp-1 text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
                  {stripHtml(l.body).slice(0, 96)}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <SecondaryBtn onClick={() => setEditing(l)}>Edit</SecondaryBtn>
              <SecondaryBtn onClick={() => {
                const ok = duplicateCoverLetter(l.id);
                if (!ok) onToast("Limit of 5 reached");
              }}>Duplicate</SecondaryBtn>
              <SecondaryBtn danger onClick={() => setConfirmDel(l)}>Delete</SecondaryBtn>
            </div>
          </CardSmall>
        ))}
      </div>
      {remaining > 0 ? (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="self-start text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
        >
          + New template ({remaining} left)
        </button>
      ) : (
        <span className="text-[13px] text-[color:var(--color-text-muted)]">+ New template (limit 5 reached)</span>
      )}

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
            if (!cl) onToast("Limit of 5 reached");
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
              <button key={cmd as string} type="button" aria-label={label as string} onClick={() => exec(cmd as string)} className="flex h-[34px] w-[34px] items-center justify-center rounded-[4px] border text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]">
                <Icon size={15} strokeWidth={1.8} />
              </button>
            );
          })}
          <button type="button" aria-label="Link" onClick={() => { const url = window.prompt("Link URL"); if (url) exec("createLink", url); }} className="flex h-[34px] w-[34px] items-center justify-center rounded-[4px] border text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]">
            <LinkIcon size={15} strokeWidth={1.8} />
          </button>
          <button type="button" aria-label="Clear formatting" onClick={() => exec("removeFormat")} className="flex h-[34px] w-[34px] items-center justify-center rounded-[4px] border text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]">
            <ClearFmt size={15} strokeWidth={1.8} />
          </button>
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
              <button type="button" onClick={() => removeLink(l.id)} aria-label="Remove" className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]">
                <X size={16} strokeWidth={1.6} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const ok = addLink({ type: cfg.portfolioTypes[0] ?? "Other", url: "" });
            if (!ok) onToast("Link limit reached");
          }}
          className="mt-3 self-start text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
        >
          + Add link
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
        <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Social & profiles</h2>
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
              <button type="button" onClick={() => removeSocial(s.id)} aria-label="Remove" className="flex h-10 w-10 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]">
                <X size={16} strokeWidth={1.6} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => addSocial({ network: "LinkedIn", url: "" })}
          className="mt-3 self-start text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
        >
          + Add profile
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
            <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Achievements & activity</h2>
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
                <span className="flex items-center gap-2 text-[14px] font-semibold text-[color:var(--color-foreground)]">
                  {ACHIEVEMENT_LABELS[b]}
                  {isSuggested ? <Tag tone="mint">suggested</Tag> : null}
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
    ? "Pulled from your résumé so you don't retype it — edit or add. Structured history sharpens matching; the PDF alone isn't enough."
    : "Add your work history manually, or upload a résumé on the Documents tab to auto-fill it.";

  const source = hasResume
    ? `Parsed from ${resume.filename ?? "your résumé"} — edit or add more.`
    : "No résumé yet — entries below are added manually.";

  return (
    <>
      <p className="text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
        {lead}
      </p>

      <CardBig>
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-[color:var(--color-foreground)]">Previous jobs</h2>
          {hasResume ? (
            <SecondaryBtn onClick={() => setConfirmReimport(true)}>
              <Refresh size={14} strokeWidth={1.8} />
              Re-import from résumé
            </SecondaryBtn>
          ) : null}
        </header>
        <p className="mt-1 text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
          {source}
        </p>
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
          className="mt-3 self-start text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
        >
          + Add previous job
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
          className="mt-3 self-start text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
        >
          + Add education
        </button>
      </CardBig>

      <ConfirmModal
        open={confirmReimport}
        title="Re-import from résumé?"
        body="This replaces manual edits with the parsed résumé content."
        confirmLabel="Re-import"
        onClose={() => setConfirmReimport(false)}
        onConfirm={() => {
          setConfirmReimport(false);
          onToast("Re-imported from résumé");
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
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[14px] font-semibold text-[color:var(--color-foreground)]">{entry.role || "Untitled role"}</span>
            <span className="text-[13px] text-[color:var(--color-text-secondary)]">{entry.company}</span>
            {entry.dates ? <span className="text-[13px] text-[color:var(--color-text-muted)]">· {entry.dates}</span> : null}
          </div>
          {(entry.description || entry.bullets.length) ? (
            <p className="mt-1 line-clamp-4 break-words text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
              {entry.description || entry.bullets.join(" ")}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          aria-label="Edit"
          onClick={onEdit}
          className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
        >
          <Pencil size={15} strokeWidth={1.6} />
        </button>
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
          <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => reorderExperience(entry.id, -1)} className="rounded-[4px] p-1 text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"><ArrowUp size={14} /></button>
          <button type="button" aria-label="Move down" disabled={index === total - 1} onClick={() => reorderExperience(entry.id, 1)} className="rounded-[4px] p-1 text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"><ArrowDown size={14} /></button>
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
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[14px] font-semibold text-[color:var(--color-foreground)]">{heading}</span>
            <span className="text-[13px] text-[color:var(--color-text-secondary)]">{entry.school}</span>
            {entry.years ? <span className="text-[13px] text-[color:var(--color-text-muted)]">· {entry.years}</span> : null}
          </div>
        </div>
        <button type="button" aria-label="Edit" onClick={onEdit} className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]">
          <Pencil size={15} strokeWidth={1.6} />
        </button>
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