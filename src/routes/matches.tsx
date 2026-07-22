import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { IconLoader2 as Loader2 } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { loadQuiz, type QuizAnswers } from "@/lib/quiz-store";
import { getAllJobs, type Job } from "@/lib/jobs-data";

export const Route = createFileRoute("/matches")({
  head: () => ({
    meta: [
      { title: "Your top matches — Jobly" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MatchesPage,
});

const MOCK_JOBS: Job[] = getAllJobs().slice(0, 5);

function ago(days: number) {
  if (days <= 0) return "Posted today";
  if (days === 1) return "Posted 1 day ago";
  return `Posted ${days} days ago`;
}

function MatchesPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [mode, setMode] = useState<"choose" | "email">("choose");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAnswers(loadQuiz());
  }, []);

  async function handleGoogle() {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    navigate({ to: "/dashboard" });
  }

  async function handleEmailCreate(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <header className="pt-6 pb-6">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link
            to="/"
            className="text-[30px] font-bold text-[color:var(--color-green)]"
            style={{ fontFamily: "var(--font-logo)" }}
          >
            jobly
          </Link>
          <Link
            to="/login"
            className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 rounded-[10px] px-2 py-1"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        <div>
          <p className="text-sm text-[color:var(--color-green)] font-semibold">
            Matches ready
          </p>
          <h1 className="mt-1 text-3xl sm:text-4xl">Your top matches</h1>
          <p className="mt-2 text-[color:var(--color-text-secondary)]">
            Ranked by fit against {(answers.roles && answers.roles[0]) || answers.role || "your role"}
            {answers.level ? `, ${answers.level.toLowerCase()} level` : ""}.
          </p>
        </div>

        <ol className="mt-6 flex flex-col gap-3">
          {MOCK_JOBS.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </ol>

        <section className="mt-10 rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-6 sm:p-8">
          <h2 className="text-2xl">Create your account to save these matches</h2>
          <p className="mt-2 text-[color:var(--color-text-secondary)]">
            We'll email your daily digest and keep your preferences safe.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              className="button-medium inline-flex h-12 items-center justify-center gap-3 rounded-button border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-5 transition-colors hover:border-[color:var(--color-border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {mode === "choose" ? (
              <button
                type="button"
                onClick={() => setMode("email")}
                className="button-medium inline-flex h-12 items-center justify-center rounded-button px-5 transition-colors bg-[color:var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2"
              >
                Continue with email
              </button>
            ) : (
              <form onSubmit={handleEmailCreate} className="flex flex-col gap-3">
                <div>
                  <label className="text-sm font-semibold">Email</label>
                  <input
                    type="email"
                    value={answers.email ?? ""}
                    readOnly
                    className="mt-1.5 h-11 w-full rounded-[4px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] px-3 text-sm text-[color:var(--color-text-secondary)]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold" htmlFor="pw">
                    Choose a password
                  </label>
                  <input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={cn(
                      "mt-1.5 h-12 w-full rounded-[4px] border bg-[color:var(--color-surface-1)] px-3.5 text-[15px] outline-none placeholder:text-[color:var(--color-text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2",
                      error ? "border-[color:var(--color-danger)]" : "border-[color:var(--color-border)]"
                    )}
                  />
                  {error && (
                    <span className="mt-1.5 block text-sm text-[color:var(--color-danger)]">
                      {error}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="button-medium inline-flex h-12 items-center justify-center gap-2 rounded-button px-5 transition-colors bg-[color:var(--color-primary)] text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)] focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>
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
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#E3E7E8" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#0E735A" strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="butt" />
      </svg>
      <span className="absolute text-[14px]" style={{ fontFamily: "var(--font-sans)", fontWeight: 400, color: "#090B0C" }}>
        {score}%
      </span>
    </div>
  );
}

function JobCard({ job }: { job: Job }) {
  return (
    <li className="rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-4">
      <div className="flex w-full items-start gap-3">
        {job.logo ? (
          <img src={job.logo} alt={`${job.company} logo`} className="h-10 w-10 shrink-0 rounded-[4px] object-cover" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[4px] bg-[color:var(--color-foreground)] text-[14px] font-semibold text-white">
            {job.company.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-[color:var(--color-foreground)]">
            {job.title}
          </span>
          <div className="mt-0.5 text-[13px] text-[color:var(--color-text-secondary)]" style={{ fontWeight: 300 }}>
            {job.company} · {job.location} · {job.salary}
          </div>
          <p className="mt-1 text-[13px] text-[color:var(--color-text-muted)]" style={{ fontWeight: 300 }}>
            {job.why}
          </p>
        </div>
        <ScoreRing score={job.score} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.source === "direct" ? (
          <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-mint)] px-2 py-0.5 text-[12px] text-[color:var(--color-green)]">
            Direct employer
          </span>
        ) : (
          <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[12px] text-[color:var(--color-text-secondary)]">
            Aggregated
          </span>
        )}
        <span className="inline-flex items-center rounded-[4px] bg-[color:var(--color-surface-2)] px-2 py-0.5 text-[12px] text-[color:var(--color-text-muted)]">
          {ago(job.postedDays)}
        </span>
      </div>
    </li>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.9 32.4 29.4 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.9 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.4 29.2 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5.1 0 9.8-1.9 13.3-5.1l-6.2-5.1c-2 1.4-4.4 2.2-7.1 2.2-5.4 0-9.9-3.1-11.3-7.5l-6.5 5C9.6 39 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.7 2-2 3.8-3.7 5l6.2 5.1c-.4.4 6.7-4.9 6.7-14.1 0-1.2-.1-2.3-.3-3.5z" />
    </svg>
  );
}