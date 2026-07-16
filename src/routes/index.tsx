import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  Check,
  Minus,
  ChevronDown,
  Ghost,
  ListFilter,
  ClipboardList,
  Sparkle,
  Bug,
  Server,
  Terminal,
  Network,
  UserSearch,
  Smartphone,
  RefreshCw,
  PenTool,
  Database,
  Palette,
  FileText,
  TrendingUp,
  BarChart3,
  Code2,
  Crown,
  ShieldCheck,
  TabletSmartphone,
  type LucideIcon,
} from "lucide-react";

import heroAsset from "../assets/hero-2.png.asset.json";
import t1Asset from "../assets/t1-2.png.asset.json";
import t2Asset from "../assets/t2-3.png.asset.json";
import t3Asset from "../assets/t3-2.png.asset.json";
import how1Asset from "../assets/how_1.png.asset.json";
import how2Asset from "../assets/how_2.png.asset.json";
import how3Asset from "../assets/how_3.png.asset.json";
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
      style={{ fontFamily: "'Stack Sans Notch', sans-serif", fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }}
    >
      jobly
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const nav = [
    { label: "Product", href: "#product" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Blog", href: "#blog" },
    { label: "About", href: "#about" },
  ];
  return (
    <header className="sticky top-0 z-[1100] border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-5 md:px-8">
        <div className="flex items-center gap-10">
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
        </div>
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#login"
            className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-foreground)]"
          >
            Log in
          </a>
          <Link
            to="/quiz"
            className="inline-flex h-10 items-center rounded-button bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-on-accent)] transition-colors hover:bg-[color:var(--color-accent-hover)]"
          >
            Get started
          </Link>
        </div>
        <button
          type="button"
          aria-label="Toggle menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-button border border-[color:var(--color-border)] md:hidden"
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
              className="mt-2 inline-flex h-11 items-center justify-center rounded-button bg-[color:var(--color-accent)] px-4 text-sm text-[color:var(--color-on-accent)]"
            >
              Get started
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

function useLiveNumber(target: number, durationMs = 1200) {
  const [n, setN] = useState(0);
  const currentRef = useRef(0);
  const animRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const deltas = [3, 3, -4, -1, 4];
    const start = performance.now();

    const animate = (from: number, to: number, animDuration: number) => {
      const animStart = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - animStart) / animDuration);
        const value = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
        setN(value);
        currentRef.current = value;
        if (p < 1) {
          animRef.current = requestAnimationFrame(step);
        }
      };
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(step);
    };

    const initialTick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const value = Math.round(target * (1 - Math.pow(1 - p, 3)));
      setN(value);
      currentRef.current = value;
      if (p < 1) {
        animRef.current = requestAnimationFrame(initialTick);
      } else {
        intervalRef.current = setInterval(() => {
          const prev = currentRef.current;
          let delta = deltas[Math.floor(Math.random() * deltas.length)];
          // Keep the live number within a band around the target.
          if (prev > target + 30) delta = -Math.abs(delta || 1);
          if (prev < target - 30) delta = Math.abs(delta || 1);
          animate(prev, prev + delta, 800);
        }, 2500);
      }
    };

    animRef.current = requestAnimationFrame(initialTick);
    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(intervalRef.current);
    };
  }, [target, durationMs]);

  return n;
}

function Hero() {
  const count = useLiveNumber(537055);
  return (
    <section className="border-b border-[color:var(--color-border)]">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-2 lg:items-center">
        <div className="lg:mt-[-88px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-3 py-1.5 text-xs text-[color:var(--color-text-secondary)]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[color:var(--color-accent)] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--color-green)]" />
            </span>
            Live · US tech openings{"\u00a0\n"}
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
              className="inline-flex h-12 items-center rounded-button bg-[color:var(--color-accent)] px-6 text-[color:var(--color-on-accent)] transition-colors hover:bg-[color:var(--color-accent-hover)]"
            >
              Get my matches
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center rounded-button border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] px-6 hover:bg-[color:var(--color-surface-2)]"
            >
              How it works
            </a>
          </div>
        </div>
        <div>
          <HeroCard />
        </div>
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="relative">
      <div className="h-[344px] overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-mint)] md:h-[444px] lg:h-[544px]" />
      {/* Floating match reveal card + stack */}
      <div className="absolute left-5 top-5 z-10 w-[280px] md:w-[320px]">
        <div className="relative z-10 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-4">
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
        {/* Stacked cards behind the top match */}
        <div className="absolute left-1/2 top-[calc(100%-128px)] z-[-1] h-[140px] w-[250px] -translate-x-1/2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] md:w-[290px]" />
        <div className="absolute left-1/2 top-[calc(100%-76px)] z-[-2] h-[100px] w-[230px] -translate-x-1/2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface-2)] md:w-[270px]" />
      </div>
      <img
        src={heroAsset.url}
        alt="A person checking Jobly matches on their phone"
        className="absolute bottom-0 right-0 z-10 h-[320px] w-full rounded-xl object-cover object-right-top md:h-[420px] lg:h-[520px]"
      />
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
        <div className="flex flex-col gap-4 md:flex-row md:items-baseline md:justify-between">
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            From inbox to offer
          </h2>
          <h4 className="text-xl md:text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            <span className="text-[color:var(--color-foreground)]">12 days</span>{" "}
            <span className="text-[color:var(--color-text-secondary)]">average time to offer</span>
          </h4>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <article
              key={t.name}
              className="relative h-[520px] overflow-hidden rounded-xl bg-[color:var(--color-foreground)] text-[color:var(--color-background)]"
            >
              <img src={t.photo} alt={t.name} className="h-full w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-8">
                <h5 className="text-xl">"{t.quote}"</h5>
                <p className="body-medium mt-3 opacity-80">
                  {t.name} · {t.role}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
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
        <div className="mt-[72px] flex flex-wrap items-center gap-[76px]">
          {[JoobleLogo, GreenhouseLogo, LeverLogo, AshbyLogo, UsaJobsLogo].map((Logo, i) => (
            <Logo key={i} />
          ))}
        </div>
        <div className="mt-[72px] flex flex-wrap gap-20">
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
    <div className="flex flex-col gap-2">
      <h2 className="text-3xl md:text-4xl tabular-nums" style={{ fontFamily: "var(--font-display)" }}>
        {n.toLocaleString("en-US")}
      </h2>
      <div className="text-base text-[color:var(--color-text-secondary)]">{label}</div>
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
        <div
          className="relative overflow-hidden rounded-[12px] p-8 md:p-14 md:min-h-[580px]"
          style={{
            backgroundColor: "var(--color-surface-2)",
            border: "1px solid var(--color-alt-light-mist)",
          }}
        >
          <div className="relative grid h-full gap-10 md:grid-cols-[45%_55%]">
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                The job search is broken
              </h2>
              <p className="mt-3 text-[color:var(--color-text-secondary)]">
                Candidate experience is at an all-time low. Here is why your current routine feels like a second full-time job.
              </p>
              <div className="mt-10 space-y-8">
                {items.map((it) => (
                  <div key={it.title}>
                    <div className="flex items-center gap-3">
                      <it.icon size={20} className="text-[color:var(--color-text-secondary)]" />
                      <h3 className="text-lg md:text-xl" style={{ fontFamily: "var(--font-display)" }}>
                        {it.title}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-[color:var(--color-text-secondary)]">{it.body}</p>
                  </div>
                ))}
              </div>
            </div>
            <div aria-hidden className="hidden md:block" />
          </div>
          <ChipWall />

        </div>
      </div>
    </section>
  );
}

type ChipTag = "no match" | "ghost" | "irrelevant" | "outdated";
type ChipDef = { title: string; icon: LucideIcon; tag?: ChipTag };

const chipRows: ChipDef[][] = [
  [
    { title: "iOS Engineer", icon: Smartphone },
    { title: "Analytics Engineer", icon: BarChart3, tag: "no match" },
    { title: "Head of Design", icon: PenTool },
    { title: "VP Engineering", icon: Crown, tag: "outdated" },
    { title: "SEO Specialist", icon: TrendingUp },
  ],
  [
    { title: "Staff Engineer", icon: Code2 },
    { title: "Copywriter", icon: FileText, tag: "irrelevant" },
    { title: "Security Engineer", icon: ShieldCheck },
    { title: "BI Analyst", icon: Database, tag: "ghost" },
    { title: "Brand Designer", icon: Palette },
  ],
  [
    { title: "Frontend Engineer", icon: Code2 },
    { title: "Growth Marketing", icon: TrendingUp },
    { title: "Data Scientist", icon: BarChart3, tag: "no match" },
    { title: "Engineering Manager", icon: Network },
    { title: "CTO", icon: Crown },
  ],
  [
    { title: "Scrum Master", icon: RefreshCw, tag: "outdated" },
    { title: "Product Designer", icon: PenTool, tag: "irrelevant" },
    { title: "Mobile Developer", icon: TabletSmartphone },
    { title: "Technical Writer", icon: FileText, tag: "no match" },
    { title: "Product Manager", icon: ClipboardList, tag: "irrelevant" },
    { title: "Site Reliability Engineer", icon: ShieldCheck },
  ],
  [
    { title: "QA Engineer", icon: Bug, tag: "no match" },
    { title: "Senior Backend Engineer", icon: Server },
    { title: "DevOps Engineer", icon: Terminal },
    { title: "Solutions Architect", icon: Network, tag: "outdated" },
    { title: "UX Researcher", icon: UserSearch, tag: "ghost" },
    { title: "Android Developer", icon: Smartphone },
  ],
  [
    { title: "UI Designer", icon: Palette },
    { title: "Data Engineer", icon: Database, tag: "ghost" },
    { title: "Backend Engineer", icon: Server },
    { title: "iOS Developer", icon: Smartphone, tag: "outdated" },
    { title: "Marketing Lead", icon: TrendingUp },
  ],
  [
    { title: "Full Stack Engineer", icon: Code2, tag: "irrelevant" },
    { title: "Machine Learning Engineer", icon: BarChart3 },
    { title: "Support Engineer", icon: ShieldCheck, tag: "no match" },
    { title: "Product Designer", icon: PenTool },
    { title: "Platform Engineer", icon: Server, tag: "ghost" },
  ],
  [
    { title: "Content Designer", icon: FileText },
    { title: "Data Analyst", icon: BarChart3, tag: "outdated" },
    { title: "SRE", icon: ShieldCheck },
    { title: "Backend Developer", icon: Terminal, tag: "no match" },
    { title: "Growth PM", icon: TrendingUp },
  ],
  [
    { title: "Cloud Engineer", icon: Server },
    { title: "Motion Designer", icon: Palette, tag: "irrelevant" },
    { title: "Recruiter", icon: UserSearch },
    { title: "Sales Engineer", icon: TrendingUp, tag: "outdated" },
    { title: "iOS Developer", icon: Smartphone },
  ],
  [
    { title: "Firmware Engineer", icon: Terminal, tag: "no match" },
    { title: "Community Manager", icon: RefreshCw },
    { title: "Data PM", icon: ClipboardList, tag: "ghost" },
    { title: "Web Designer", icon: PenTool },
    { title: "IT Support", icon: ShieldCheck },
  ],
  [
    { title: "Systems Engineer", icon: Network },
    { title: "Illustrator", icon: PenTool, tag: "outdated" },
    { title: "Producer", icon: ClipboardList },
    { title: "Researcher", icon: UserSearch, tag: "irrelevant" },
    { title: "PR Lead", icon: TrendingUp },
  ],
];

function ChipWall() {
  const tagColor = (t: ChipTag) =>
    t === "no match" ? "#E17100" : "#D00D01";
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-0 hidden md:block"
      style={{
        top: "-34%",
        right: "-28%",
        bottom: "-34%",
        width: "78%",
        maskImage:
          "linear-gradient(to top right, rgba(0,0,0,1) 62%, rgba(0,0,0,0.35) 88%, rgba(0,0,0,0) 100%)",
        WebkitMaskImage:
          "linear-gradient(to top right, rgba(0,0,0,1) 62%, rgba(0,0,0,0.35) 88%, rgba(0,0,0,0) 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10"
        style={{
          width: "280px",
          background:
            "linear-gradient(to right, var(--color-surface-2) 0%, var(--color-surface-2) 35%, transparent 100%)",
        }}
      />
      <div
        className="absolute top-1/2 flex flex-col gap-3"

        style={{
          right: "-10%",
          transform: "translateX(120px) translateY(-50%) rotate(-32deg)",
          transformOrigin: "center center",
          width: "max-content",
        }}
      >

        {chipRows.map((row, i) => (
          <div
            key={i}
            className="flex gap-3"
            style={{ marginLeft: `${(i % 2) * 40}px` }}
          >
            {row.map((chip, j) => (
              <span
                key={`${i}-${j}-${chip.title}`}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] px-3 py-2 text-[13px]"
                style={{
                  backgroundColor: "var(--color-surface-1)",
                  border: "0.5px solid var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              >
                <chip.icon size={14} className="text-[color:var(--color-text-secondary)]" />
                <span>{chip.title}</span>
                {chip.tag ? (
                  <span style={{ color: tagColor(chip.tag) }}>{chip.tag}</span>
                ) : null}
              </span>
            ))}
          </div>
        ))}
      </div>

    </div>
  );
}

/* ---------------------------- How it works ---------------------------- */

function HowItWorks() {
  return (
    <section id="how-it-works" className="border-b border-[color:var(--color-border)]">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
            How Jobly works
          </h2>
          <p className="mt-3 text-[color:var(--color-text-secondary)]">
            We flipped the script. Instead of searching, you receive matching digests directly in your inbox.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <HowCard step={1} title="Start with anything" body="2-minute quiz about role, stack, level, location and salary">
            <QuizPreview />
          </HowCard>
          <HowCard step={2} title="AI matching" body="We score every job against your profile — no black box">
            <MatchPreview />
          </HowCard>
          <HowCard step={3} title="Daily digest" body="5 best-fit jobs in your inbox each morning">
            <InboxPreview />
          </HowCard>
        </div>
      </div>
    </section>
  );
}

function HowCard({
  step,
  title,
  body,
  children,
}: {
  step: number;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="@container grid h-full grid-rows-[1fr_auto] overflow-hidden rounded-[8px]"
      style={{ border: "1px solid var(--color-alt-light-mist)", backgroundColor: "var(--color-surface-2)" }}
    >
      <div className="pt-6 pr-6 pl-6 pb-0 md:pt-8 md:pr-8 md:pl-8">
        <div className="how-card-title-row">
          <span
            className="inline-flex items-center rounded-[4px] px-3 py-1 text-[13px] font-medium text-white"
            style={{ backgroundColor: "var(--color-green)" }}
          >
            Step {step}
          </span>
          <h3 className="text-xl md:text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            {title}
          </h3>
        </div>
        <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">{body}</p>
      </div>
      <div className="relative self-end">
        {children}
      </div>
    </div>
  );
}

function QuizChip({ label }: { label: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg bg-[color:var(--color-surface-1)] px-3 py-2"
      style={{ border: "0.5px solid var(--color-border)" }}
    >
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded"
        style={{ backgroundColor: "var(--color-green)" }}
      >
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </span>
      <span className="truncate text-[13px] text-[color:var(--color-foreground)]">{label}</span>
    </div>
  );
}

function QuizPreview() {
  return (
    <img src={how1Asset.url} alt="Quiz preview" className="block w-full h-auto" />
  );
}

function MatchPreview() {
  return (
    <img src={how2Asset.url} alt="Match preview" className="block w-full h-auto" />
  );
}

function InboxPreview() {
  return (
    <img src={how3Asset.url} alt="Inbox preview" className="block w-full h-auto" />
  );
}

function InboxRow({
  sender,
  preview,
  bold,
  starred,
}: {
  sender: string;
  preview: string;
  bold?: boolean;
  starred?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5"
      style={{ borderTop: "0.5px solid var(--color-border)" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 shrink-0 rounded-sm"
        style={{ border: "1px solid var(--color-border-strong)" }}
      />
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 shrink-0"
        fill={starred ? "#f5b400" : "none"}
        stroke={starred ? "#f5b400" : "var(--color-text-muted)"}
        strokeWidth="2"
      >
        <polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9" />
      </svg>
      <span
        className={`min-w-0 truncate text-[12px] ${bold ? "font-semibold" : ""}`}
        style={{ color: "var(--color-foreground)" }}
      >
        {sender}
      </span>
      {preview && (
        <span className="ml-auto truncate text-[12px] text-[color:var(--color-text-muted)]">{preview}</span>
      )}
    </div>
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
            className="inline-flex h-12 items-center rounded-button bg-[color:var(--color-accent)] px-6 text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
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
    <section className="border-b border-[color:var(--color-green)] bg-[color:var(--color-green)]">
      <div className="mx-auto max-w-[820px] px-5 py-20 text-center md:px-8">
        <h2 className="text-3xl text-white md:text-5xl" style={{ fontFamily: "var(--font-display)" }}>
          Ready to stop scrolling?
        </h2>
        <div className="mt-8 flex justify-center">
          <Link
            to="/quiz"
            className="inline-flex h-12 items-center rounded-button bg-[color:var(--color-accent)] px-6 text-[color:var(--color-on-accent)] hover:bg-[color:var(--color-accent-hover)]"
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
