import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Check, Minus, ChevronDown, Ghost, ListFilter, ClipboardList, Sparkle } from "lucide-react";

import heroAsset from "../assets/hero.png.asset.json";
import t1Asset from "../assets/t1.png.asset.json";
import t2Asset from "../assets/t2.png.asset.json";
import t3Asset from "../assets/t3.png.asset.json";
import { ScoreRing } from "../components/landing/ScoreRing";
import {
  AshbyLogo,
  GreenhouseLogo,
  JoobleLogo,
  LeverLogo,
  UsaJobsLogo,
} from "../components/landing/logos";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Jobly — Relevant jobs, first. Scored to you." },
      {
        name: "description",
        content:
          "Email-first job discovery for tech candidates. Five ranked matches in your inbox daily — with an AI match score and why each fits.",
      },
      { property: "og:title", content: "Jobly — Relevant jobs, first. Scored to you." },
      {
        property: "og:description",
        content:
          "Stop scrolling LinkedIn and Indeed. Get five ranked, AI-scored tech jobs in your inbox daily.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <Header />
      <main>
        <Hero />
        <InboxToOffer />
        <OfficialApis />
        <JobSearchBroken />
        <HowItWorks />
        <FeatureCards />
        <QualityOverQuantity />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}

/* ------------------------------ Header ------------------------------ */

function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`text-green ${className}`}
      style={{ fontFamily: "'Stack Sans Notch', sans-serif", fontSize: 24, letterSpacing: "-0.03em" }}
    >
      jobly
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const nav = [
    { label: "Product", href: "#product" },
    { label: "Pricing", href: "#pricing" },
    { label: "Blog", href: "#blog" },
    { label: "About", href: "#about" },
  ];
  return (
    <header className="sticky top-0 z-[1100] border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
        <Link to="/" className="flex items-center">
          <Wordmark />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
            >
              {n.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#login"
            className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
          >
            Log in
          </a>
          <Link
            to="/quiz"
            className="inline-flex h-10 items-center rounded-lg bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-on-accent)] transition-colors hover:bg-[color:var(--color-accent-hover)]"
          >
            Sign up
          </Link>
        </div>
        <button
          type="button"
          aria-label="Toggle menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-[color:var(--color-border)] md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && (
        <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] md:hidden">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-1 px-5 py-4">
            {nav.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="rounded-lg px-3 py-3 text-sm text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-2)]"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </a>
            ))}
            <a href="#login" className="rounded-lg px-3 py-3 text-sm">
              Log in
            </a>
            <Link
              to="/quiz"
              className="mt-2 inline-flex h-11 items-center justify-center rounded-lg bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-on-accent)]"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ------------------------------- Hero ------------------------------- */

function useCounter(target: number, durationMs = 1200) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let frame = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);
  return n;
}

function Hero() {
  const count = useCounter(537055);
  return (
    <section className="border-b border-[color:var(--color-border)]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 py-1.5 text-xs text-[color:var(--color-text-secondary)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-accent)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-green)]" />
            </span>
            Live · US tech openings across our sources ·{" "}
            <span className="text-[color:var(--color-foreground)] tabular-nums">
              {count.toLocaleString("en-US")}
            </span>
          </div>
          <h1
            className="mt-6 text-[42px] leading-[1.05] md:text-[56px] lg:text-[64px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Relevant jobs, first
            <br />
            <span>— scored to you</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg font-light text-[color:var(--color-text-secondary)]">
            Stop scrolling LinkedIn, Indeed, and every other job board. Five matches, ranked for you, in your inbox daily.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/quiz"
              className="inline-flex h-12 items-center rounded-lg bg-[color:var(--color-accent)] px-6 text-[color:var(--color-on-accent)] transition-colors hover:bg-[color:var(--color-accent-hover)]"
            >
              Get my matches
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-6 hover:bg-[color:var(--color-surface-2)]"
            >
              How it works
            </a>
          </div>
        </div>
        <HeroCard />
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-mint)]">
        <img
          src={heroAsset.url}
          alt="A person checking Jobly matches on their phone"
          className="block h-[420px] w-full object-cover object-right md:h-[520px]"
        />
        {/* Floating match reveal card */}
        <div className="absolute left-4 top-6 w-[280px] rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-4 shadow-[0_8px_24px_rgba(0,0,0,0.08)] md:left-8 md:top-10 md:w-[320px]">
          <div className="mb-3 flex items-center justify-between text-xs text-[color:var(--color-text-muted)]">
            <span className="inline-flex items-center gap-1.5">
              <Sparkle size={12} className="text-[color:var(--color-green)]" />
              Top match
            </span>
            <span>1 / 5</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--color-foreground)] text-[color:var(--color-background)]">
              <span style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>▲</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Senior Data Analyst</p>
              <p className="truncate text-xs text-[color:var(--color-text-muted)]">Alto · Remote · 1 hour ago</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[color:var(--color-border)] pt-4">
            <ScoreRing value={95} label="Experience" size={64} />
            <ScoreRing value={93} label="Skill" size={64} />
            <ScoreRing value={96} label="Industry" size={64} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------- From inbox to offer -------------------------- */

const testimonials = [
  {
    photo: t1Asset.url,
    quote:
      "I was tired of spraying resumes. Jobly sent me exactly what I wanted. Signed my offer last week.",
    name: "David K.",
    role: "Senior Web Developer",
  },
  {
    photo: t2Asset.url,
    quote:
      "The match score is shockingly accurate. No recruiter spam, just high quality direct listings.",
    name: "Sarah L.",
    role: "Lead Product Designer",
  },
  {
    photo: t3Asset.url,
    quote:
      "Ghost job filtering alone makes this worth it. Saved me dozens of wasted application hours.",
    name: "Arjun P.",
    role: "DevOps Specialist",
  },
];

function InboxToOffer() {
  return (
    <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]" id="product">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          From inbox to offer
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <article
              key={t.name}
              className="relative overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-foreground)] text-[color:var(--color-background)]"
            >
              <img src={t.photo} alt={t.name} className="h-64 w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4">
                <p className="text-sm">"{t.quote}"</p>
                <p className="mt-3 text-xs opacity-80">
                  {t.name} · {t.role}
                </p>
              </div>
            </article>
          ))}
          <aside className="flex flex-col justify-between gap-6 rounded-2xl bg-[color:var(--color-mint)] p-6 text-[color:var(--color-foreground)]">
            <Stat top="12 days" bottom="Average time to offer" />
            <Stat top="5" bottom="Scored matches in your inbox daily" />
            <Stat top="5 hrs/week" bottom="Saved vs. manual board scrolling" />
          </aside>
        </div>
      </div>
    </section>
  );
}

function Stat({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div>
      <div className="text-2xl md:text-3xl" style={{ fontFamily: "var(--font-display)" }}>
        {top}
      </div>
      <div className="mt-1 text-sm text-[color:var(--color-text-secondary)]">{bottom}</div>
    </div>
  );
}

/* ---------------------------- Official APIs ---------------------------- */

function OfficialApis() {
  return (
    <section className="border-b border-[color:var(--color-border)]">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
        <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          Official APIs and ATS — not scraping. Ghost jobs filtered.
        </h2>
        <p className="mt-3 text-[color:var(--color-text-secondary)]">
          Verified integrations with leading hiring platforms.
        </p>
        <div className="mt-10 grid grid-cols-2 items-center gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[JoobleLogo, GreenhouseLogo, LeverLogo, AshbyLogo, UsaJobsLogo].map((Logo, i) => (
            <div
              key={i}
              className="flex h-20 items-center justify-center rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-4"
            >
              <Logo />
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-6 border-t border-[color:var(--color-border)] pt-6 sm:grid-cols-3">
          <Counter label="Jobs analysed today" value={14230} />
          <Counter label="New in 24h" value={892} />
          <Counter label="Ghost jobs filtered" value={2100} />
        </div>
      </div>
    </section>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  const n = useCounter(value);
  return (
    <div>
      <div className="text-3xl tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
        {n.toLocaleString("en-US")}
      </div>
      <div className="mt-1 text-sm text-[color:var(--color-text-secondary)]">{label}</div>
    </div>
  );
}

/* -------------------------- Job search broken -------------------------- */

function JobSearchBroken() {
  const items = [
    {
      icon: ListFilter,
      title: "Hours on LinkedIn with no results",
      body: "Endless scrolling past promoted junk, ads, and reposts only to find the same matches repeatedly.",
    },
    {
      icon: Ghost,
      title: "Ghost jobs waste your time",
      body: "Up to 30% of postings are left open indefinitely for 'pipeline building' without actual intention to hire.",
    },
    {
      icon: ClipboardList,
      title: "Hundreds of irrelevant listings",
      body: "Keywords matching titles but completely ignoring stack requirements, salary expectations, or remote levels.",
    },
  ];
  return (
    <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            The job search is broken
          </h2>
          <p className="mt-3 text-[color:var(--color-text-secondary)]">
            Candidate experience is at an all-time low. Here is why your current routine feels like a second full-time job.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[color:var(--color-surface-2)]">
                <it.icon size={20} className="text-[color:var(--color-text-secondary)]" />
              </div>
              <h3 className="mt-5 text-xl" style={{ fontFamily: "var(--font-display)" }}>
                {it.title}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------- How it works ---------------------------- */

function HowItWorks() {
  const steps = [
    { n: 1, title: "Profile quiz", body: "2-minute quiz about role, stack, level, location & salary." },
    { n: 2, title: "AI matching", body: "We score every job against your profile — no black box." },
    { n: 3, title: "Daily digest", body: "5 best-fit jobs in your inbox each morning." },
  ];
  return (
    <section id="how-it-works" className="border-b border-[color:var(--color-border)]">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            How Jobly works
          </h2>
          <p className="mt-3 text-[color:var(--color-text-secondary)]">
            We flipped the script. Instead of searching, you receive matching digests directly in your inbox.
          </p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]" style={{ fontFamily: "var(--font-display)" }}>
                {s.n}
              </div>
              <h3 className="mt-5 text-xl" style={{ fontFamily: "var(--font-display)" }}>
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------- Feature cards --------------------------- */

function FeatureCards() {
  return (
    <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]">
      <div className="mx-auto grid max-w-[1200px] gap-4 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-6 md:p-8">
          <h3 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            Match score & why it fits
          </h3>
          <p className="mt-2 max-w-md text-sm text-[color:var(--color-text-secondary)]">
            Every job is evaluated down to details like framework alignment, commute tolerance, and historical compensation ranges.
          </p>
          <div className="mt-6 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm">Senior Frontend Engineer</span>
              <span className="rounded-md bg-[color:var(--color-mint)] px-2 py-0.5 text-xs text-[color:var(--color-green)]">
                94%
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <ScoreBar label="React & TypeScript" value={96} />
              <ScoreBar label="Remote / US" value={100} />
              <ScoreBar label="Salary band" value={88} />
              <ScoreBar label="Company size" value={82} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-6 md:p-8">
          <h3 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            Application tracker
          </h3>
          <p className="mt-2 max-w-md text-sm text-[color:var(--color-text-secondary)]">
            Say goodbye to chaotic spreadsheets. We automatically detect when you apply and help coordinate follow-ups.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Applied", count: 8, tone: "surface" },
              { label: "Interview", count: 3, tone: "mint" },
              { label: "Offer", count: 1, tone: "accent" },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-[color:var(--color-border)] p-3"
                style={{
                  backgroundColor:
                    c.tone === "mint"
                      ? "var(--color-mint)"
                      : c.tone === "accent"
                      ? "var(--color-accent)"
                      : "var(--color-surface-1)",
                  color: c.tone === "accent" ? "var(--color-on-accent)" : undefined,
                }}
              >
                <div className="text-xs opacity-80">{c.label}</div>
                <div className="mt-1 text-2xl" style={{ fontFamily: "var(--font-display)" }}>
                  {c.count}
                </div>
                <div className="mt-3 space-y-1.5">
                  <div className="h-2 rounded bg-black/10" />
                  <div className="h-2 w-4/5 rounded bg-black/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[color:var(--color-text-secondary)]">{label}</span>
        <span className="text-[color:var(--color-green)]">{value}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
        <div
          className="h-full rounded-full bg-[color:var(--color-green)]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

/* -------------------------- Quality over quantity -------------------------- */

function QualityOverQuantity() {
  return (
    <section className="border-b border-[color:var(--color-border)]">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Five right matches beat a hundred blind applications
          </h2>
          <p className="mt-3 text-[color:var(--color-text-secondary)]">
            Spraying and praying does not work. Focus on positions where you have an unfair advantage based on deep compatibility.
          </p>
        </div>
        <div className="mt-12 grid items-center gap-8 md:grid-cols-[auto_auto_1fr] md:justify-center">
          <div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-md"
                  style={{ backgroundColor: "var(--color-green)" }}
                />
              ))}
            </div>
            <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
              <span className="text-[color:var(--color-foreground)]">5 matched</span> — focused, high likelihood
            </p>
          </div>
          <div className="text-center text-sm text-[color:var(--color-text-muted)]">vs</div>
          <div>
            <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-1">
              {Array.from({ length: 100 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: "var(--color-border)" }}
                />
              ))}
            </div>
            <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
              <span className="text-[color:var(--color-foreground)]">100 random</span> — low reply rate, exhausting
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Pricing ------------------------------ */

function Pricing() {
  const rows: { label: string; free: string | boolean; pro: string | boolean }[] = [
    { label: "Matches per digest", free: "Top 5", pro: "Top 5" },
    { label: "Digest frequency", free: "Weekly", pro: "Daily" },
    { label: "AI match score & \"why it fits\"", free: false, pro: true },
    { label: "Application tracker", free: false, pro: true },
    { label: "Follow-up reminders", free: false, pro: true },
    { label: "\"Found a job\" pause", free: false, pro: true },
  ];
  return (
    <section id="pricing" className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            Simple pricing
          </h2>
          <p className="mt-3 text-[color:var(--color-text-secondary)]">
            Choose the tier that fits your pacing. Cancel or pause anytime.
          </p>
        </div>

        {/* Desktop table */}
        <div className="mt-10 hidden overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] md:block">
          <div className="grid grid-cols-3 border-b border-[color:var(--color-border)]">
            <div className="p-6" />
            <div className="border-l border-[color:var(--color-border)] p-6">
              <div className="text-sm text-[color:var(--color-text-muted)]">Free</div>
              <div className="mt-1 text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                $0/mo
              </div>
            </div>
            <div className="relative border-l border-[color:var(--color-border)] bg-[color:var(--color-mint)] p-6">
              <span className="absolute right-6 top-6 rounded-full bg-[color:var(--color-green)] px-2 py-0.5 text-xs text-white">
                Recommended
              </span>
              <div className="text-sm text-[color:var(--color-green)]">Pro</div>
              <div className="mt-1 text-3xl" style={{ fontFamily: "var(--font-display)" }}>
                $9.99/mo
              </div>
              <div className="text-xs text-[color:var(--color-text-secondary)]">after 3-day trial</div>
            </div>
          </div>
          {rows.map((r, i) => (
            <div
              key={r.label}
              className={`grid grid-cols-3 ${i < rows.length - 1 ? "border-b border-[color:var(--color-border)]" : ""}`}
            >
              <div className="p-4 text-sm">{r.label}</div>
              <PricingCell v={r.free} border />
              <PricingCell v={r.pro} border tint />
            </div>
          ))}
        </div>

        {/* Mobile stacked */}
        <div className="mt-10 grid gap-4 md:hidden">
          <PlanCard title="Free" price="$0/mo" rows={rows.map((r) => ({ label: r.label, value: r.free }))} />
          <PlanCard
            title="Pro"
            price="$9.99/mo"
            note="after 3-day trial"
            recommended
            rows={rows.map((r) => ({ label: r.label, value: r.pro }))}
          />
        </div>

        <div className="mt-6 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-5 text-sm text-[color:var(--color-text-secondary)]">
          Billed $9.99/mo after your 3-day trial. Cancel in 2 steps. Pause for 6 months if you find a job.
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/quiz"
            className="inline-flex h-12 items-center rounded-lg bg-[color:var(--color-accent)] px-6 text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
          >
            Start free trial
          </Link>
        </div>
      </div>
    </section>
  );
}

function PricingCell({ v, border, tint }: { v: string | boolean; border?: boolean; tint?: boolean }) {
  return (
    <div
      className={`p-4 text-sm ${border ? "border-l border-[color:var(--color-border)]" : ""}`}
      style={tint ? { backgroundColor: "color-mix(in oklab, var(--color-mint) 40%, transparent)" } : undefined}
    >
      {typeof v === "boolean" ? (
        v ? (
          <Check size={18} className="text-[color:var(--color-green)]" />
        ) : (
          <Minus size={18} className="text-[color:var(--color-text-muted)]" />
        )
      ) : (
        <span>{v}</span>
      )}
    </div>
  );
}

function PlanCard({
  title,
  price,
  note,
  rows,
  recommended,
}: {
  title: string;
  price: string;
  note?: string;
  rows: { label: string; value: string | boolean }[];
  recommended?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-6 ${
        recommended
          ? "border-[color:var(--color-green)] bg-[color:var(--color-mint)]"
          : "border-[color:var(--color-border)] bg-[color:var(--color-background)]"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="text-sm text-[color:var(--color-text-muted)]">{title}</div>
          <div className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>
            {price}
          </div>
          {note && <div className="text-xs text-[color:var(--color-text-secondary)]">{note}</div>}
        </div>
        {recommended && (
          <span className="rounded-full bg-[color:var(--color-green)] px-2 py-0.5 text-xs text-white">
            Recommended
          </span>
        )}
      </div>
      <ul className="mt-5 space-y-3 text-sm">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-4">
            <span className="text-[color:var(--color-text-secondary)]">{r.label}</span>
            <span className="text-right">
              {typeof r.value === "boolean" ? (
                r.value ? (
                  <Check size={16} className="text-[color:var(--color-green)]" />
                ) : (
                  <Minus size={16} className="text-[color:var(--color-text-muted)]" />
                )
              ) : (
                r.value
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* --------------------------------- FAQ --------------------------------- */

const faqs = [
  {
    q: "What is Jobly?",
    a: "Jobly is an email-first job discovery service for tech candidates. You fill out a short profile once and receive five ranked, AI-scored matches in your inbox — daily on Pro, weekly on Free.",
  },
  {
    q: "How does matching work?",
    a: "We score every open role against your profile across experience, skill overlap, industry fit, salary, and remote preferences. Each match ships with a transparent \"why it fits\" — no black box.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel in two steps, or pause everything for six months when you land a job. No hoops.",
  },
  {
    q: "Is my data safe?",
    a: "We only use your profile to score jobs for you. We never sell your data and we don't apply on your behalf.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="border-b border-[color:var(--color-border)]">
      <div className="mx-auto max-w-[820px] px-5 py-16 md:px-8 md:py-24">
        <h2 className="text-center text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          Frequently Asked Questions
        </h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]"
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-base">{f.q}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-[color:var(--color-text-muted)] transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[color:var(--color-border)] px-5 py-4 text-sm text-[color:var(--color-text-secondary)]">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <a href="#faq" className="text-sm text-[color:var(--color-green)] hover:underline">
            See all FAQ →
          </a>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Final CTA ------------------------------ */

function FinalCTA() {
  return (
    <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]">
      <div className="mx-auto max-w-[820px] px-5 py-20 text-center md:px-8">
        <h2 className="text-3xl md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          Ready to stop scrolling?
        </h2>
        <div className="mt-8 flex justify-center">
          <Link
            to="/quiz"
            className="inline-flex h-12 items-center rounded-lg bg-[color:var(--color-accent)] px-6 text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
          >
            Get my matches
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------- Footer ------------------------------- */

function Footer() {
  const cols: { title: string; items: string[] }[] = [
    { title: "Product", items: ["Features", "Pricing", "Integrations", "Roadmap"] },
    { title: "Company", items: ["About Us", "Careers", "Blog", "Press"] },
    { title: "Resources", items: ["Docs", "Candidate Guide", "FAQ", "Contact"] },
    { title: "Legal", items: ["Privacy Policy", "Terms of Service", "Information Security"] },
  ];
  return (
    <footer className="bg-[color:var(--color-background)]">
      <div className="mx-auto max-w-[1200px] px-5 py-14 md:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-sm text-[color:var(--color-text-secondary)]">
              Email-first job discovery platform for tech candidates.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-sm font-semibold">{c.title}</div>
              <ul className="mt-3 space-y-2 text-sm text-[color:var(--color-text-secondary)]">
                {c.items.map((i) => (
                  <li key={i}>
                    <a href="#" className="hover:text-[color:var(--color-foreground)]">
                      {i}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[color:var(--color-border)] pt-6 text-xs text-[color:var(--color-text-muted)] md:flex-row md:items-center">
          <span>© 2025 Jobly. All rights reserved.</span>
          <span>You can adjust or turn off daily match frequencies anytime via your settings link.</span>
        </div>
      </div>
    </footer>
  );
}
