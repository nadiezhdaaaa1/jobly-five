import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { IconArrowDown as ArrowDown, IconArrowUp as ArrowUp, IconCheck as Check, IconChevronRight as ChevronRight, IconGripVertical as GripVertical, IconPencil as Pencil, IconX as X } from "@tabler/icons-react";
import { AppHeader, MobileTabBar } from "@/components/app/AppNav";
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
  updateResumeData,
  useResumeState,
  type ResumeEducation,
  type ResumeExperience,
} from "@/lib/resume-store";
import { loadQuiz, quizSummary, updateQuiz, type QuizAnswers } from "@/lib/quiz-store";
import { FIELD_ROLES, skillsForRoles } from "@/lib/quiz-data";
import {
  FieldStep,
  RoleStep,
  SingleSkillStep,
  ExperienceStep,
  LocationStep,
  StepShell,
  STEP_ORDER,
  type StepKey,
} from "@/routes/quiz";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfileScreen,
});

type EditKey = null | "identity" | "match" | `exp:${string}` | `edu:${string}` | "expNew" | "eduNew";

const LEVELS = ["Junior", "Mid", "Senior", "Staff+"] as const;
const WORK_TYPES: { key: "remote" | "hybrid" | "onsite"; label: string }[] = [
  { key: "remote", label: "Remote" },
  { key: "hybrid", label: "Hybrid" },
  { key: "onsite", label: "On-site" },
];
const DEGREE_TYPES = ["Bachelor's", "Master's", "PhD", "Bootcamp", "Certificate", "Other"];

function yearOptions() {
  const now = new Date().getFullYear();
  const out: string[] = [];
  for (let y = now + 1; y >= 1970; y--) out.push(String(y));
  return out;
}

function ProfileScreen() {
  const resume = useResumeState();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState<EditKey>(null);
  const [banner, setBanner] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizAnswers>(() => loadQuiz());

  useEffect(() => setQuiz(loadQuiz()), []);

  const email = user?.email ?? "serhii@example.com";
  const displayName = quiz.email ? "Serhii Kovalenko" : "Serhii Kovalenko";
  const [name, setName] = useState(displayName);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      const path = data?.avatar_url ?? null;
      if (!active || !path) return;
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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5 MB.");
      return;
    }
    setAvatarError(null);
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      if (avatarPath && avatarPath !== path) {
        await supabase.storage.from("avatars").remove([avatarPath]);
      }
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("id", user.id);
      if (dbErr) throw dbErr;
      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 7);
      setAvatarPath(path);
      if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
      showSaved("identity");
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleAvatarRemove() {
    if (!user || !avatarPath) return;
    setUploading(true);
    try {
      await supabase.storage.from("avatars").remove([avatarPath]);
      await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
      setAvatarPath(null);
      setAvatarUrl(null);
    } finally {
      setUploading(false);
    }
  }

  function showSaved(key: string) {
    setFlash(key);
    window.setTimeout(() => setFlash((f) => (f === key ? null : f)), 1400);
  }

  function saveMatch(next: QuizAnswers) {
    updateQuiz(next);
    setQuiz({ ...loadQuiz() });
    setBanner(true);
    setEditing(null);
    showSaved("match");
  }

  const identityPencilRef = useRef<HTMLButtonElement | null>(null);
  const matchPencilRef = useRef<HTMLButtonElement | null>(null);

  const strength = useMemo(() => {
    const items = [
      { key: "quiz", label: "Quiz completed", done: (quiz.roles?.length ?? 0) > 0 },
      { key: "resume", label: "Resume added", done: resume.hasResume },
      { key: "jobs", label: "Previous jobs — add at least one", done: resume.data.experience.length > 0, target: "card-jobs" },
      { key: "edu", label: "Education — add at least one", done: resume.data.education.length > 0, target: "card-education" },
      { key: "verify", label: "Verify your email", done: false, target: "card-account" },
    ];
    const pct = Math.round((items.filter((i) => i.done).length / items.length) * 100);
    return { items, pct };
  }, [quiz.roles, resume]);

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] pb-24 md:pb-8">
      <AppHeader active="profile" />
      <main className="mx-auto max-w-[1200px] px-6 py-8">
        {banner ? (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-[6px] bg-[color:var(--color-mint)] px-4 py-3 text-[13px] text-[color:var(--color-green)]">
            <span>Updated — your next digest will use these preferences.</span>
            <button type="button" onClick={() => setBanner(false)} aria-label="Dismiss">
              <X size={14} strokeWidth={1.6} />
            </button>
          </div>
        ) : null}

        <h1 className="text-[24px] text-[color:var(--color-foreground)]" style={{ fontFamily: "var(--font-display)", fontWeight: 400 }}>
          Profile
        </h1>

        {/* Identity row */}
        <section className="mt-4 flex items-center gap-4">
          <div className="relative">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Change avatar"
              disabled={uploading}
              className="group relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-[8px] text-[22px] font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]"
              style={{ background: "linear-gradient(135deg, var(--color-accent), var(--color-green))" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span aria-hidden>{(name || "S").charAt(0).toUpperCase()}</span>
              )}
              <span className="pointer-events-none absolute inset-x-0 bottom-0 flex h-5 items-center justify-center bg-black/45 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                {uploading ? "Uploading…" : "Change"}
              </span>
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {avatarUrl ? (
              <button
                type="button"
                onClick={handleAvatarRemove}
                aria-label="Remove avatar"
                disabled={uploading}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border bg-[color:var(--color-surface-1)] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
              >
                <X size={11} strokeWidth={1.8} />
              </button>
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            {avatarError ? (
              <div className="mb-1 text-[12px] text-[color:var(--color-danger)]">{avatarError}</div>
            ) : null}
            {editing === "identity" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditing(null);
                  showSaved("identity");
                  window.setTimeout(() => identityPencilRef.current?.focus(), 0);
                }}
                className="flex flex-wrap items-center gap-2"
              >
                <input
                  autoFocus
                  aria-label="Display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 rounded-[4px] border px-3 text-[15px]"
                />
                <button type="submit" className="h-10 rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]">Save</button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    window.setTimeout(() => identityPencilRef.current?.focus(), 0);
                  }}
                  className="h-10 rounded-[4px] px-3 text-[13px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <div className="text-[18px] font-semibold text-[color:var(--color-foreground)]">{name}</div>
                  <button
                    ref={identityPencilRef}
                    type="button"
                    aria-label="Edit name"
                    aria-expanded={false}
                    onClick={() => setEditing("identity")}
                    className="flex h-8 w-8 items-center justify-center rounded-[4px] text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)]"
                  >
                    <Pencil size={15} strokeWidth={1.6} />
                  </button>
                  {flash === "identity" ? <span className="text-[12px] text-[color:var(--color-green)]">Saved</span> : null}
                </div>
                <div className="text-[13px] text-[color:var(--color-text-muted)]">{email}</div>
              </div>
            )}
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          {/* Main column */}
          <div className="flex flex-col gap-4">
            {/* Card 1: Match preferences */}
            <MatchCard onSaved={saveMatch} flash={flash === "match"} />

            {/* Card 2: Previous jobs */}
            <JobsCard
              id="card-jobs"
              entries={resume.data.experience}
              editingKey={editing}
              setEditing={setEditing}
              flashKey={flash}
              onSaved={(k) => showSaved(k)}
            />

            {/* Card 3: Education */}
            <EducationCard
              id="card-education"
              entries={resume.data.education}
              editingKey={editing}
              setEditing={setEditing}
              flashKey={flash}
              onSaved={(k) => showSaved(k)}
            />

            {/* Card 4: Account */}
            <section id="card-account" className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5">
              <h2 className="text-[15px] font-semibold text-[color:var(--color-foreground)]">Account</h2>
              <div className="mt-3 divide-y">
                <Row label="Email" value={email} />
                <div className="flex items-center justify-between py-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wide text-[color:var(--color-text-muted)]">Plan</div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--color-green)]">Pro</span>
                      <span className="text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>renews Aug 20, 2026</span>
                    </div>
                  </div>
                </div>
                {[
                  "Subscription & billing",
                  "Notifications & digest frequency",
                  "Security & sign-in",
                ].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className="flex w-full items-center justify-between py-3 text-left text-[14px] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-2)]"
                  >
                    <span>{label}</span>
                    <ChevronRight size={16} strokeWidth={1.6} className="text-[color:var(--color-text-muted)]" />
                  </button>
                ))}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate({ to: "/login" });
                    }}
                    className="text-[13px] text-[color:var(--color-text-secondary)] hover:underline"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right rail */}
          <aside className="flex flex-col gap-4">
            <div className="rounded-[6px] border bg-[color:var(--color-surface-1)] p-4">
              <h3 className="text-[14px] font-semibold text-[color:var(--color-foreground)]">Profile strength</h3>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="h-1 flex-1 bg-[color:var(--color-surface-2)]"
                  role="progressbar"
                  aria-valuenow={strength.pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`${strength.pct} percent`}
                >
                  <div className="h-1 bg-[color:var(--color-green)]" style={{ width: `${strength.pct}%` }} />
                </div>
                <div className="text-[13px] font-semibold text-[color:var(--color-foreground)]">{strength.pct}%</div>
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {strength.items.map((i) => (
                  <li key={i.key}>
                    {i.done ? (
                      <span className="flex items-center gap-2 text-[13px] text-[color:var(--color-text-muted)]">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--color-mint)] text-[color:var(--color-green)]">
                          <Check size={11} strokeWidth={2.5} />
                        </span>
                        {i.label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if ("target" in i && i.target) {
                            document.getElementById(i.target)?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }
                        }}
                        className="flex items-center gap-2 text-left text-[13px] text-[color:var(--color-foreground)] hover:underline"
                      >
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[color:var(--color-border-strong)]" />
                        {i.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
                A fuller profile means sharper match scores.
              </p>
            </div>
            <div className="rounded-[6px] border bg-[color:var(--color-surface-1)] p-4">
              <h3 className="text-[14px] font-semibold text-[color:var(--color-foreground)]">How matching works</h3>
              <p className="mt-2 text-[12px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
                Your preferences, resume, and history are compared against every job we collect. You can see the breakdown on any job card.
              </p>
            </div>
            <Link
              to="/resume"
              className="text-center text-[13px] text-[color:var(--color-green)] hover:underline"
            >
              Open resume
            </Link>
          </aside>
        </div>
      </main>
      <MobileTabBar active="profile" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-3">
      <div className="text-[11px] uppercase tracking-wide text-[color:var(--color-text-muted)]">{label}</div>
      <div className="mt-1 text-[14px] text-[color:var(--color-foreground)]" style={{ fontWeight: 300 }}>{value}</div>
    </div>
  );
}

function SectionShell({
  id,
  title,
  editing,
  onEdit,
  flash,
  pencilRef,
  children,
}: {
  id?: string;
  title: string;
  editing: boolean;
  onEdit: () => void;
  flash?: boolean;
  pencilRef?: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5">
      <header className="flex items-start justify-between">
        <h2 className="text-[15px] font-semibold text-[color:var(--color-foreground)]">{title}</h2>
        <div className="flex items-center gap-2">
          {flash ? <span className="text-[12px] text-[color:var(--color-green)]">Saved</span> : null}
          {!editing ? (
            <button
              ref={pencilRef}
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
      </header>
      <div className="mt-3">{children}</div>
    </section>
  );
}

// ---------- Match preferences ----------

function MatchCard({
  quiz,
  editing,
  onEdit,
  onCancel,
  onSave,
  flash,
  pencilRef,
}: {
  quiz: QuizAnswers;
  editing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (next: QuizAnswers) => void;
  flash: boolean;
  pencilRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const summary = quizSummary(quiz);

  return (
    <SectionShell
      title="Match preferences"
      editing={editing}
      onEdit={onEdit}
      flash={flash}
      pencilRef={pencilRef}
    >
      {editing ? (
        <MatchEdit quiz={quiz} onCancel={onCancel} onSave={onSave} />
      ) : (
        <div className="divide-y">
          <Row label="Role" value={summary.roles} />
          <Row label="Stack" value={summary.stack} />
          <Row label="Experience" value={summary.experience} />
          <Row label="Location and salary" value={summary.locationAndSalary} />
        </div>
      )}
    </SectionShell>
  );
}

function MatchEdit({ quiz, onCancel, onSave }: { quiz: QuizAnswers; onCancel: () => void; onSave: (q: QuizAnswers) => void }) {
  const [role, setRole] = useState<string>(quiz.roles?.[0] ?? "Frontend Engineer");
  const [roleQuery, setRoleQuery] = useState("");
  const [stack, setStack] = useState<string[]>(quiz.hardSkills?.length ? quiz.hardSkills : ["React", "Vue", "TypeScript"]);
  const [stackInput, setStackInput] = useState("");
  const [level, setLevel] = useState<string>(quiz.level ?? "Senior");
  const initialWorks: Record<string, boolean> = {
    remote: quiz.workMode === "remote" || !!quiz.remote,
    hybrid: false,
    onsite: quiz.workMode === "onsite",
  };
  if (!initialWorks.remote && !initialWorks.hybrid && !initialWorks.onsite) initialWorks.remote = true;
  const [works, setWorks] = useState(initialWorks);
  const [locations, setLocations] = useState<string[]>(quiz.locations?.length ? quiz.locations : ["New York City", "Baltimore", "Philadelphia"]);
  const [locInput, setLocInput] = useState("");
  const [salaryMin, setSalaryMin] = useState<number>(quiz.salaryMin ?? 100);
  const [salaryMax, setSalaryMax] = useState<number>(quiz.salaryMax ?? 160);

  const roleSuggestions = useMemo(() => {
    if (!roleQuery.trim()) return [] as string[];
    const q = roleQuery.toLowerCase();
    return ROLES.filter((r) => r.toLowerCase().includes(q)).slice(0, 6);
  }, [roleQuery]);

  const locSuggestions = useMemo(() => {
    if (!locInput.trim()) return [] as string[];
    const q = locInput.toLowerCase();
    return USA_LOCATIONS.filter((l) => l.toLowerCase().includes(q) && !locations.includes(l.split(",")[0])).slice(0, 6);
  }, [locInput, locations]);

  const invalid = salaryMin > salaryMax;

  function commitStack(tag: string) {
    const t = tag.trim();
    if (!t || stack.includes(t)) return;
    setStack([...stack, t]);
    setStackInput("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (invalid) return;
    const workMode: WorkMode | undefined = works.onsite && !works.remote ? "onsite" : "remote";
    onSave({
      ...quiz,
      roles: [role],
      role,
      hardSkills: stack,
      level,
      workMode,
      remote: works.remote,
      locations: works.remote && !works.hybrid && !works.onsite ? [] : locations,
      salaryMin,
      salaryMax,
    });
  }

  const locationsHidden = works.remote && !works.hybrid && !works.onsite;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {/* Role */}
      <div>
        <label className="text-[12px] text-[color:var(--color-text-muted)]">Role</label>
        <div className="mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-1 text-[13px]">
            {role}
          </span>
          <input
            autoFocus
            value={roleQuery}
            onChange={(e) => setRoleQuery(e.target.value)}
            placeholder="Search a different role"
            className="h-9 flex-1 rounded-[4px] border px-3 text-[13px]"
          />
        </div>
        {roleSuggestions.length ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {roleSuggestions.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  setRoleQuery("");
                }}
                className="rounded-[4px] border px-2 py-1 text-[12px] hover:border-[color:var(--color-border-strong)]"
              >
                {r}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Stack */}
      <div>
        <label className="text-[12px] text-[color:var(--color-text-muted)]">Stack</label>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-[4px] border p-2">
          {stack.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[12px] text-[color:var(--color-green)]">
              {s}
              <button
                type="button"
                aria-label={`Remove ${s}`}
                onClick={() => setStack(stack.filter((x) => x !== s))}
                className="rounded-full hover:bg-[color:var(--color-surface-2)]"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </span>
          ))}
          <input
            value={stackInput}
            onChange={(e) => setStackInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitStack(stackInput);
              } else if (e.key === "Backspace" && !stackInput && stack.length) {
                setStack(stack.slice(0, -1));
              }
            }}
            placeholder="Add a technology, press Enter"
            className="min-w-[160px] flex-1 border-none bg-transparent px-1 text-[13px] outline-none"
          />
        </div>
      </div>

      {/* Level segmented */}
      <div>
        <label className="text-[12px] text-[color:var(--color-text-muted)]">Level</label>
        <div className="mt-1 inline-flex overflow-hidden rounded-[4px] border">
          {LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevel(l)}
              className={`px-3 py-1.5 text-[13px] ${level === l ? "bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]" : "hover:bg-[color:var(--color-surface-2)]"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Work type */}
      <div>
        <label className="text-[12px] text-[color:var(--color-text-muted)]">Work type</label>
        <div className="mt-1 flex gap-4">
          {WORK_TYPES.map((w) => (
            <label key={w.key} className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={works[w.key]}
                onChange={(e) => setWorks({ ...works, [w.key]: e.target.checked })}
              />
              {w.label}
            </label>
          ))}
        </div>
      </div>

      {/* Locations */}
      {!locationsHidden ? (
        <div>
          <label className="text-[12px] text-[color:var(--color-text-muted)]">Locations</label>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 rounded-[4px] border p-2">
            {locations.map((l) => (
              <span key={l} className="inline-flex items-center gap-1 rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[12px]">
                {l}
                <button type="button" aria-label={`Remove ${l}`} onClick={() => setLocations(locations.filter((x) => x !== l))}>
                  <X size={12} strokeWidth={2} />
                </button>
              </span>
            ))}
            <input
              value={locInput}
              onChange={(e) => setLocInput(e.target.value)}
              placeholder="Add a city"
              className="min-w-[160px] flex-1 border-none bg-transparent px-1 text-[13px] outline-none"
            />
          </div>
          {locSuggestions.length ? (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {locSuggestions.map((s) => {
                const city = s.split(",")[0];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setLocations([...locations, city]);
                      setLocInput("");
                    }}
                    className="rounded-[4px] border px-2 py-1 text-[12px] hover:border-[color:var(--color-border-strong)]"
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Salary */}
      <div>
        <label className="text-[12px] text-[color:var(--color-text-muted)]">Salary range</label>
        <div className="mt-1 flex items-center gap-3">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[color:var(--color-text-muted)]">$</span>
            <input
              type="number"
              aria-label="Minimum salary"
              aria-describedby={invalid ? "salary-error" : undefined}
              value={salaryMin}
              onChange={(e) => setSalaryMin(Number(e.target.value))}
              className="h-9 w-28 rounded-[4px] border pl-6 pr-2 text-[13px]"
            />
            <div className="mt-0.5 text-[11px] text-[color:var(--color-text-muted)]">Minimum (k)</div>
          </div>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[color:var(--color-text-muted)]">$</span>
            <input
              type="number"
              aria-label="Target salary"
              value={salaryMax}
              onChange={(e) => setSalaryMax(Number(e.target.value))}
              className="h-9 w-28 rounded-[4px] border pl-6 pr-2 text-[13px]"
            />
            <div className="mt-0.5 text-[11px] text-[color:var(--color-text-muted)]">Target (k)</div>
          </div>
        </div>
        {invalid ? (
          <div id="salary-error" className="mt-1 text-[12px] text-[color:var(--color-danger)]">Minimum can't exceed target.</div>
        ) : null}
      </div>

      <div className="text-[12px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
        These preferences directly shape your match scores.
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={invalid}
          className="h-10 rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] disabled:opacity-50"
        >
          Save
        </button>
        <button type="button" onClick={onCancel} className="h-10 rounded-[4px] px-3 text-[13px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------- Previous jobs ----------

function JobsCard({
  id,
  entries,
  editingKey,
  setEditing,
  flashKey,
  onSaved,
}: {
  id: string;
  entries: ResumeExperience[];
  editingKey: EditKey;
  setEditing: (k: EditKey) => void;
  flashKey: string | null;
  onSaved: (k: string) => void;
}) {
  return (
    <section id={id} className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5">
      <header className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[color:var(--color-foreground)]">Previous jobs</h2>
        {flashKey === "jobs" ? <span className="text-[12px] text-[color:var(--color-green)]">Saved</span> : null}
      </header>
      <div className="mt-3 flex flex-col divide-y">
        {entries.length === 0 ? (
          <div className="py-4 text-[13px] text-[color:var(--color-text-secondary)]">
            No previous jobs yet. Adding them improves your match accuracy.
          </div>
        ) : (
          entries.map((e, idx) => (
            <JobEntry
              key={e.id}
              entry={e}
              index={idx}
              total={entries.length}
              editing={editingKey === `exp:${e.id}`}
              onEdit={() => setEditing(`exp:${e.id}`)}
              onDone={() => {
                setEditing(null);
                onSaved("jobs");
              }}
            />
          ))
        )}
      </div>
      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            const id2 = addExperience();
            setEditing(`exp:${id2}`);
          }}
          className="text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
        >
          + Add previous job
        </button>
      </div>
    </section>
  );
}

function JobEntry({
  entry,
  index,
  total,
  editing,
  onEdit,
  onDone,
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
  const [showMore, setShowMore] = useState(false);
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
      <div className="group flex items-start justify-between gap-3 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[14px] font-semibold text-[color:var(--color-foreground)]">{entry.role || "Untitled role"}</span>
            <span className="text-[13px] text-[color:var(--color-text-secondary)]">{entry.company}</span>
            {entry.dates ? <span className="text-[13px] text-[color:var(--color-text-muted)]">· {entry.dates}</span> : null}
          </div>
          {(entry.description || entry.bullets.length) ? (
            <p className={`mt-1 text-[13px] text-[color:var(--color-text-secondary)] ${showMore ? "" : "line-clamp-4"}`} style={{ fontWeight: 300 }}>
              {entry.description || entry.bullets.join(" ")}
            </p>
          ) : null}
          {(entry.description ?? "").length > 260 || entry.bullets.join(" ").length > 260 ? (
            <button type="button" className="mt-1 text-[12px] text-[color:var(--color-green)] hover:underline" onClick={() => setShowMore((v) => !v)}>
              {showMore ? "Show less" : "Show more"}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={`Edit ${entry.role || "entry"}`}
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
      className="flex items-start gap-2 py-4"
    >
      <div className="flex flex-col items-center gap-1 pt-2">
        <GripVertical size={14} className="text-[color:var(--color-text-muted)]" aria-hidden />
        <button
          type="button"
          aria-label="Move up"
          disabled={index === 0}
          onClick={() => reorderExperience(entry.id, -1)}
          className="rounded-[4px] p-1 text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"
        >
          <ArrowUp size={12} />
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={index === total - 1}
          onClick={() => reorderExperience(entry.id, 1)}
          className="rounded-[4px] p-1 text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-2)] disabled:opacity-30"
        >
          <ArrowDown size={12} />
        </button>
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            autoFocus
            aria-label="Position"
            placeholder="e.g. Senior Frontend Engineer"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 rounded-[4px] border px-3 text-[13px]"
          />
          <input
            aria-label="Company"
            placeholder="e.g. Nimbus Corp"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="h-10 rounded-[4px] border px-3 text-[13px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} className="h-10 rounded-[4px] border px-2 text-[13px]" aria-label="From year">
            <option value="">From</option>
            {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <span className="text-[13px] text-[color:var(--color-text-muted)]">to</span>
          <select value={toYear} onChange={(e) => setToYear(e.target.value)} className="h-10 rounded-[4px] border px-2 text-[13px]" aria-label="To year">
            <option value="">To</option>
            <option value="Present">Present</option>
            {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <textarea
            aria-label="Responsibilities and achievements"
            placeholder="What you did and what it changed — shipped features, team size, metrics…"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            className="w-full rounded-[4px] border p-3 text-[13px]"
          />
          <div className="mt-1 text-right text-[11px] text-[color:var(--color-text-muted)]">{desc.length} / 600</div>
        </div>
        <div className="flex items-center gap-2">
          <button type="submit" className="h-10 rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]">Save</button>
          <button type="button" onClick={onDone} className="h-10 rounded-[4px] px-3 text-[13px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]">Cancel</button>
          <div className="ml-auto">
            {confirming ? (
              <span className="inline-flex items-center gap-2 text-[12px]">
                Remove this job?
                <button type="button" onClick={() => { removeExperience(entry.id); onDone(); }} className="rounded-[4px] bg-[color:var(--color-danger-subtle)] px-2 py-1 text-[color:var(--color-danger)]">Remove</button>
                <button type="button" onClick={() => setConfirming(false)} className="rounded-[4px] px-2 py-1 text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]">Keep</button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="text-[12px] text-[color:var(--color-text-secondary)] hover:underline">Remove</button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}

// ---------- Education ----------

function EducationCard({
  id,
  entries,
  editingKey,
  setEditing,
  flashKey,
  onSaved,
}: {
  id: string;
  entries: ResumeEducation[];
  editingKey: EditKey;
  setEditing: (k: EditKey) => void;
  flashKey: string | null;
  onSaved: (k: string) => void;
}) {
  return (
    <section id={id} className="rounded-[8px] border bg-[color:var(--color-surface-1)] p-5">
      <header className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[color:var(--color-foreground)]">Education</h2>
        {flashKey === "edu" ? <span className="text-[12px] text-[color:var(--color-green)]">Saved</span> : null}
      </header>
      <div className="mt-3 flex flex-col divide-y">
        {entries.length === 0 ? (
          <div className="py-4 text-[13px] text-[color:var(--color-text-secondary)]">No education added yet.</div>
        ) : (
          entries.map((e) => (
            <EduEntry
              key={e.id}
              entry={e}
              editing={editingKey === `edu:${e.id}`}
              onEdit={() => setEditing(`edu:${e.id}`)}
              onDone={() => {
                setEditing(null);
                onSaved("edu");
              }}
            />
          ))
        )}
      </div>
      <div className="mt-3">
        <button
          type="button"
          onClick={() => {
            const id2 = addEducation();
            setEditing(`edu:${id2}`);
          }}
          className="text-[13px] font-semibold text-[color:var(--color-green)] hover:underline"
        >
          + Add education
        </button>
      </div>
    </section>
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
        <button
          type="button"
          aria-label="Edit education"
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
        const years = fromYear ? `${fromYear} — ${toYear || "Present"}` : "";
        const degree = [degreeType, field].filter(Boolean).join(" in ") || entry.degree;
        updateEducation(entry.id, { degreeType, field, school, years, degree });
        onDone();
      }}
      className="flex flex-col gap-2 py-4"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        <select autoFocus value={degreeType} onChange={(e) => setDegreeType(e.target.value)} className="h-10 rounded-[4px] border px-2 text-[13px]" aria-label="Degree">
          <option value="">Degree</option>
          {DEGREE_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input aria-label="Field" placeholder="e.g. Computer Science" value={field} onChange={(e) => setField(e.target.value)} className="h-10 rounded-[4px] border px-3 text-[13px]" />
      </div>
      <input aria-label="School" placeholder="School" value={school} onChange={(e) => setSchool(e.target.value)} className="h-10 rounded-[4px] border px-3 text-[13px]" />
      <div className="flex items-center gap-2">
        <select value={fromYear} onChange={(e) => setFromYear(e.target.value)} className="h-10 rounded-[4px] border px-2 text-[13px]" aria-label="From year">
          <option value="">From</option>
          {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <span className="text-[13px] text-[color:var(--color-text-muted)]">to</span>
        <select value={toYear} onChange={(e) => setToYear(e.target.value)} className="h-10 rounded-[4px] border px-2 text-[13px]" aria-label="To year">
          <option value="">To</option>
          <option value="Present">Present</option>
          {yearOptions().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" className="h-10 rounded-[4px] bg-[color:var(--color-accent)] px-4 text-[13px] font-semibold text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]">Save</button>
        <button type="button" onClick={onDone} className="h-10 rounded-[4px] px-3 text-[13px] text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]">Cancel</button>
        <div className="ml-auto">
          {confirming ? (
            <span className="inline-flex items-center gap-2 text-[12px]">
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