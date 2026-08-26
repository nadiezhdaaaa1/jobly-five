import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { IconMenu2 as Menu, IconX as X, IconCheck as Check, IconMinus as Minus, IconChevronDown as ChevronDown, IconClipboardList as ClipboardList, IconNetwork as Network, IconDeviceMobile as Smartphone, IconRefresh as RefreshCw, IconVectorBezier2 as PenTool, IconDatabase as Database, IconPalette as Palette, IconFileText as FileText, IconTrendingUp as TrendingUp, IconChartBar as BarChart3, IconCode as Code2, IconCrown as Crown, IconShieldCheck as ShieldCheck, IconDeviceTablet as TabletSmartphone, type Icon as LucideIcon } from "@tabler/icons-react";

import heroAsset from "../assets/hero-2.webp.asset.json";
import t1Asset from "../assets/t1-2.png.asset.json";
import t2Asset from "../assets/t2-3.png.asset.json";
import t3Asset from "../assets/t3-2.png.asset.json";
import how1Asset from "../assets/how_1.png.asset.json";
import how2Asset from "../assets/how_2.png.asset.json";
import how3Asset from "../assets/how_3.png.asset.json";
import { HeroShaderBackground } from "../components/landing/HeroShaderBackground";
import { HeroMatchDeck } from "../components/landing/HeroMatchDeck";
import { ShaderBackground } from "../components/landing/ShaderBackground";

import { PRICING, TRIAL_DAYS, money, savings, total, usd } from "@/config/pricing";
import {
  AshbyLogo,
  GreenhouseLogo,
  JoobleLogo,
  LeverLogo,
  UsaJobsLogo,
} from "../components/landing/logos";
import { Header } from "../components/site/Header";
import { Footer } from "../components/site/Footer";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

const ORIGIN = "https://jobly-five.lovable.app";
const OG_IMAGE =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/35f965be-a71c-408c-88e4-7c07755b768b/id-preview-a2e56716--b6a571a3-355e-4f02-baa7-954b5019600e.lovable.app-1784218758072.png";

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
          "Email-first job discovery for tech candidates. Five ranked matches in your inbox daily — with an AI match score and why each fits.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${ORIGIN}/` },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: `${ORIGIN}/` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Jobly",
          url: ORIGIN,
          description:
            "Email-first job discovery for tech candidates. Five ranked matches in your inbox daily.",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Jobly",
          url: ORIGIN,
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Jobly",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: ORIGIN,
          offers: [
            {
              "@type": "Offer",
              name: "Free",
              price: "0",
              priceCurrency: "USD",
            },
            {
              "@type": "Offer",
              name: "Pro (monthly)",
              price: money(total(PRICING.monthly)),
              priceCurrency: "USD",
              category: "Monthly subscription",
            },
            {
              "@type": "Offer",
              name: "Pro (annual)",
              price: money(total(PRICING.annual)),
              priceCurrency: "USD",
              category: "Annual subscription",
            },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
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
        <TimeToOffer />
        <OfficialApis />
        <KeyNumbers />
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



/* ------------------------------- Hero ------------------------------- */

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
    <section className="relative isolate overflow-hidden lg:mx-12">
      <HeroShaderBackground />
      <div className="pointer-events-none absolute bottom-0 right-0 z-10 h-[300px] w-[332px] overflow-hidden sm:h-[360px] sm:w-[398px] md:h-[440px] md:w-[555px] lg:h-[520px] lg:w-[575px]">
        <img
          src={heroAsset.url}
          alt="A person checking Jobly matches on their phone"
          fetchPriority="high"
          decoding="async"
          className="absolute right-0 top-0 h-[300px] w-auto max-w-none sm:h-[360px] md:h-[560px] lg:h-[520px]"
        />
      </div>



      <div className="relative mx-auto grid max-w-[1200px] gap-12 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-2 lg:items-center">
        <div className="relative z-20 lg:mt-[-88px]">
          <div className="inline-flex items-center gap-2 text-sm text-white/80 md:text-base">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
            </span>
            Live · US tech openings{"\u00a0\n"}
            <span className="text-white tabular-nums">
              {count.toLocaleString("en-US")}
            </span>
          </div>
          <h1
            className="mt-6 text-[42px] leading-[1.05] text-white md:text-[56px] lg:text-[64px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Relevant jobs, first — scored to you
          </h1>
          <p className="mt-5 max-w-xl text-lg font-extralight text-white/85">
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
              className="inline-flex h-12 items-center rounded-button border border-white/30 px-6 text-white transition-colors hover:bg-white/10"
            >
              How it works
            </a>
          </div>
        </div>
        <div className="relative z-[5]">
          <HeroCard />
        </div>
      </div>
    </section>
  );
}


function HeroCard() {
  return (
    <div className="relative">
      <div className="h-[344px] md:h-[444px] lg:h-[544px]" />
      <HeroMatchDeck />
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
    <section className="border-t border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]" id="offer">
      <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <h2
          className="text-3xl leading-10 md:text-4xl"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.36px" }}
        >
          From inbox to offer
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <article
              key={t.name}
              className="group relative z-0 h-[520px] overflow-hidden rounded-[8px] bg-[color:var(--color-foreground)] text-[color:var(--color-background)] transition-[transform,scale,border-radius] duration-[800ms] ease-[cubic-bezier(0.165,0.84,0.44,1)] [will-change:transform] hover:z-10 hover:scale-[1.036] hover:rounded-[7.722px] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:hover:rounded-[8px]"
            >
              <img
                src={t.photo}
                alt={t.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full scale-[1.036] object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.165,0.84,0.44,1)] [will-change:transform] group-hover:scale-100 motion-reduce:scale-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100"

              />
              <div
                className="testimonial-scrim-blur pointer-events-none absolute inset-x-0 bottom-0 h-[280px] backdrop-blur-[12px]"
                aria-hidden="true"
              />
              <div className="absolute inset-x-0 bottom-0 flex h-[280px] flex-col justify-end bg-gradient-to-t from-black/90 via-black/60 via-50% to-transparent p-6 md:p-10">
                <h5 className="text-[18px] font-light leading-[1.6]" style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.2px" }}>
                  "{t.quote}"
                </h5>
                <p className="mt-5 text-base leading-6 opacity-80">
                  {t.name} · {t.role}
                </p>
              </div>
            </article>
          ))}

        </div>
      </div>
      </div>
    </section>
  );
}

/* ------------------------- Time to offer CTA band ------------------------- */

function TimeToOffer() {
  return (
    <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
      <div className="relative overflow-hidden border-[color:var(--color-border)] bg-[color:var(--color-deep-teal)] lg:mx-12 lg:border-l lg:border-r">
        {/* Right-side shader, fading into the panel colour toward the centre. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-[calc(50%+14px)] h-[358px] -translate-y-1/2"
        >
          <ShaderBackground className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-deep-teal)] to-transparent to-50%" />
        </div>

        <div className="relative mx-auto flex max-w-[1200px] flex-col gap-6 px-5 py-12 md:flex-row md:items-center md:gap-4 md:px-8 md:py-20">
          <p
            className="flex-1 text-[28px] font-light leading-[1.2] text-[color:var(--color-surface-1)] md:text-[36px]"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.36px" }}
          >
            12 days <span className="text-[color:var(--color-border)]">average time to offer</span>
          </p>
          <Link
            to="/quiz"
            className="inline-flex h-12 shrink-0 items-center self-start rounded-button bg-[color:var(--color-accent)] px-6 text-[color:var(--color-on-accent)] transition-colors hover:bg-[color:var(--color-accent-hover)] md:self-auto"
          >
            Start your search
          </Link>
        </div>
      </div>
    </section>
  );
}



/* ---------------------------- Official APIs ---------------------------- */

const PARTNER_LOGOS = [JoobleLogo, GreenhouseLogo, LeverLogo, AshbyLogo, UsaJobsLogo];

function OfficialApis() {
  return (
    <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
      <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
          <h2
            className="text-center text-3xl font-light leading-10 md:text-4xl"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.36px" }}
          >
            Official APIs and ATS — not scraping. Ghost jobs filtered
          </h2>
          <p className="mt-[18px] text-center leading-6 text-[color:var(--color-text-secondary)] md:text-[18px]">
            Verified integrations with leading hiring platforms
          </p>

          <div className="relative mt-[72px] overflow-hidden">
            <div className="logo-marquee flex w-max items-center">
              {[0, 1, 2].map((copy) => (
                <div
                  key={copy}
                  className="flex shrink-0 items-center gap-[76px] pr-[76px]"
                  aria-hidden={copy !== 0}

                >
                  {PARTNER_LOGOS.map((Logo, i) => (
                    <Logo key={i} />
                  ))}
                </div>
              ))}
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-[120px] bg-gradient-to-r from-[color:var(--color-background)] to-transparent"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-[120px] bg-gradient-to-l from-[color:var(--color-background)] to-transparent"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function KeyNumbers() {
  return (
    <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]">
      <div className="border-[color:var(--color-border)] lg:mx-12 lg:border-l lg:border-r">
        <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-20">
          <div className="flex flex-col items-center gap-12 md:flex-row md:justify-between md:gap-4">
            <Counter label="Jobs analysed today" value={14230} />
            <Counter label="New in 24h" value={892} />
            <Counter label="Ghost jobs filtered" value={2100} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Counter({ label, value }: { label: string; value: number }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);

  useEffect(() => {
    if (reduced) {
      setN(value);
      return;
    }
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const DURATION = 1600;
        let start = 0;
        const tick = (t: number) => {
          if (!start) start = t;
          const p = Math.min(1, (t - start) / DURATION);
          setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, reduced]);

  return (
    <div ref={ref} className="flex flex-col items-center justify-center gap-3 md:w-[320px]">
      <p
        className="text-[40px] font-extralight leading-[1.4] tabular-nums text-[color:var(--color-foreground)] md:text-[52px]"
        style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.36px" }}
      >
        {n.toLocaleString("en-US")}
      </p>
      <p className="text-[18px] font-light leading-[1.2] text-[color:var(--color-text-secondary)] md:text-[20px]">
        {label}
      </p>
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
    <section className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]" id="problem">
      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-8 md:py-24">
        <div
          className="relative overflow-hidden rounded-[12px] p-8 md:p-14 md:min-h-[580px]"
          style={{
            backgroundColor: "var(--color-background)",
            border: "1px solid var(--color-border)",
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
            "linear-gradient(to right, var(--color-background) 0%, var(--color-background) 35%, transparent 100%)",
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
      style={{ border: "1px solid var(--color-border)", backgroundColor: "var(--color-surface-2)" }}
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
    <img src={how1Asset.url} alt="Quiz preview" loading="lazy" decoding="async" className="block w-full h-auto" />
  );
}

function MatchPreview() {
  return (
    <img src={how2Asset.url} alt="Match preview" loading="lazy" decoding="async" className="block w-full h-auto" />
  );
}

function InboxPreview() {
  return (
    <img src={how3Asset.url} alt="Inbox preview" loading="lazy" decoding="async" className="block w-full h-auto" />
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
      <div className="mx-auto grid max-w-[1200px] gap-6 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
        <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-6 md:p-8">
          <h3 className="text-2xl" style={{ fontFamily: "var(--font-display)" }}>
            Match score and why it fits
          </h3>
          <p className="mt-2 max-w-md text-sm text-[color:var(--color-text-secondary)]">
            Every job is evaluated down to details like framework alignment, commute tolerance, and historical compensation ranges.
          </p>
          <div className="mt-6 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)] p-5">
            <div className="flex items-center justify-between">

              <span className="text-sm">Senior Frontend Engineer</span>
              <span className="rounded-md bg-[color:var(--color-mint)] px-2 py-0.5 text-xs text-[color:var(--color-green)]">
                94%
              </span>
            </div>
            <div className="mt-4 space-y-3">
              <ScoreBar label="React and TypeScript" value={96} />
              <ScoreBar label="Remote / US" value={100} />
              <ScoreBar label="Salary band" value={88} />
              <ScoreBar label="Company size" value={82} />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-background)] p-6 md:p-8">
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
                className={`rounded-lg p-3 ${c.tone === "accent" ? "" : "border border-[color:var(--color-border)]"}`}
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
                  <div className="h-2 w-3/4 rounded bg-black/10" />
                  <div className="h-2 w-5/6 rounded bg-black/10" />
                  <div className="h-2 w-2/3 rounded bg-black/10" />
                  <div className="h-2 w-4/5 rounded bg-black/10" />
                  <div className="h-2 w-3/5 rounded bg-black/10" />
                  <div className="h-2 w-3/4 rounded bg-black/10" />
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
        <div className="mt-12 flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-center">
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex h-10 w-10 items-center justify-center rounded-[4px]"
                  style={{ backgroundColor: "var(--color-green)" }}
                >
                  <Check size={20} className="text-[color:var(--color-accent-hover)]" />
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold text-[color:var(--color-green)]">
              5 matched (focused, high likelihood)
            </p>
          </div>
          <div className="text-sm font-medium uppercase tracking-widest text-[color:var(--color-text-muted)]">
            VS
          </div>
          <div className="flex flex-col items-center">
            <div className="grid grid-cols-[repeat(20,minmax(0,1fr))] gap-[2px]">
              {Array.from({ length: 100 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-[1px]"
                  style={{ backgroundColor: "var(--color-alt-light-mist)" }}
                />
              ))}
            </div>
            <p className="mt-3 text-sm text-[color:var(--color-text-secondary)]">
              100 random (low reply rate, exhausting)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ Pricing ------------------------------ */

function Pricing() {
  const [period, setPeriod] = useState<"monthly" | "annual">("annual");
  const tabsRef = useRef<HTMLDivElement>(null);
  const periods: Array<"monthly" | "annual"> = ["annual", "monthly"];
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const measure = () => {
      const idx = periods.indexOf(period);
      const btn = btnRefs.current[idx];
      const container = tabsRef.current;
      if (!btn || !container) return;
      setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [period]);

  const paid =
    period === "monthly"
      ? { name: "Monthly", struck: "", price: usd(PRICING.monthly.perMonth), suffix: "per month", pill: "" }
      : {
          name: "Annual",
          struck: usd(PRICING.monthly.perMonth),
          price: usd(PRICING.annual.perMonth),
          suffix: "per month",
          pill: `Save ${usd(savings(PRICING.annual))}`,
        };

  const features: { label: (plan: "free" | "paid") => string; freeIncluded: boolean }[] = [
    { label: () => "Matches per digest — Top 5", freeIncluded: true },
    {
      label: (plan) => (plan === "free" ? "Digest frequency — Weekly" : "Digest frequency — Daily"),
      freeIncluded: true,
    },
    { label: () => 'AI match score and "why it fits"', freeIncluded: false },
    { label: () => "Application tracker", freeIncluded: false },
    { label: () => "Follow-up reminders", freeIncluded: false },
    { label: () => '"Found a job" pause', freeIncluded: false },
  ];

  function onTabKey(e: React.KeyboardEvent<HTMLButtonElement>, idx: number) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? (idx + 1) % periods.length : (idx - 1 + periods.length) % periods.length;
    setPeriod(periods[next]);
    const btns = tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    btns?.[next]?.focus();
  }

  const CheckDot = ({ bg, stroke }: { bg: string; stroke: string }) => (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ width: 16, height: 16, background: bg }}
    >
      <Check size={11} strokeWidth={2.5} style={{ color: stroke }} />
    </span>
  );

  const DashBox = () => (
    <span
      className="inline-flex shrink-0 items-center justify-center"
      style={{ width: 16, height: 16 }}
      aria-hidden="true"
    >
      <span style={{ width: 8, height: 1.5, background: "#D0D6D8", borderRadius: 1 }} />
    </span>
  );

  const FeatureList = ({ plan }: { plan: "free" | "paid" }) => (
    <ul className="flex flex-col" style={{ gap: 12, padding: "8px 0" }}>
      {features.map((f, i) => {
        const included = plan === "paid" ? true : f.freeIncluded;
        const labelColor = plan === "paid" ? "#090B0C" : "#4B585B";
        return (
          <li key={i} className="flex items-center" style={{ gap: 8 }}>
            {plan === "paid" ? (
              <CheckDot bg="#00F1A9" stroke="#090B0C" />
            ) : included ? (
              <CheckDot bg="#E3E7E8" stroke="#67787C" />
            ) : (
              <DashBox />
            )}
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 300,
                fontSize: 13,
                lineHeight: "19.5px",
                color: labelColor,
              }}
            >
              {f.label(plan)}
            </span>
          </li>
        );
      })}
    </ul>
  );

  return (
    <section
      id="pricing"
      className="border-b border-[color:var(--color-border)]"
      style={{ background: "#FFFFFF" }}
    >
      <div
        className="mx-auto flex w-full flex-col items-center"
        style={{ maxWidth: 1200, padding: "80px 24px", gap: 40 }}
      >
        {/* Header */}
        <div className="text-center" style={{ maxWidth: 672 }}>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 300,
              fontSize: 36,
              lineHeight: "40px",
              letterSpacing: "-0.36px",
              color: "#090B0C",
            }}
            className="max-md:!text-[28px] max-md:!leading-[1.15]"
          >
            Simple pricing
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 200,
              fontSize: 16,
              lineHeight: "24px",
              color: "#4B585B",
              paddingTop: 12,
            }}
            className="max-md:!text-[14px]"
          >
            Choose the tier that fits your pacing. Cancel or pause anytime.
          </p>
        </div>

        {/* Billing toggle */}
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Billing period"
          className="inline-flex items-center relative"
          style={{ gap: 8, background: "#F1F3F3", borderRadius: 12, padding: 8 }}
        >
          {/* Sliding indicator */}
          <span
            aria-hidden
            className="absolute pointer-events-none"
            style={{
              top: 8,
              bottom: 8,
              left: indicator.left,
              width: indicator.width,
              background: "#FFFFFF",
              border: "1px solid #E3E7E8",
              borderRadius: 8,
              boxShadow: "0 1px 2px rgba(12,12,13,0.05)",
              transition: "left 280ms cubic-bezier(0.4, 0, 0.2, 1), width 280ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
          {periods.map((p, idx) => {
            const active = period === p;
            const label = p === "monthly" ? "Monthly" : "Annual";
            return (
              <button
                key={p}
                ref={(el) => { btnRefs.current[idx] = el; }}
                type="button"
                role="tab"
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setPeriod(p)}
                onKeyDown={(e) => onTabKey(e, idx)}
                className="inline-flex items-center group relative"
                style={{
                  gap: 8,
                  borderRadius: 8,
                  padding: p === "annual" ? "9px 9px 9px 13px" : "9px 13px",
                  background: "transparent",
                  border: "1px solid transparent",
                  cursor: "pointer",
                  transition: "background 200ms ease",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.5)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: "20px",
                    color: active ? "#090B0C" : "#4B585B",
                    transition: "color 200ms ease",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  {label}
                </span>
                {p === "annual" ? (
                  <span
                    style={{
                      background: "var(--mint, #D8FBEF)",
                      borderRadius: 4,
                      padding: "2px 4px",
                      fontFamily: "var(--font-sans)",
                      fontWeight: 300,
                      fontSize: 12,
                      lineHeight: 1.3,
                      color: "var(--green, #0E735A)",
                      position: "relative",
                      zIndex: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Best value
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Bento */}
        <div
          className="flex w-full items-stretch max-lg:!flex-col"
          style={{ maxWidth: 800, gap: 20 }}
        >
          {/* Free shell */}
          <div
            className="flex-1 max-lg:order-2"
            style={{ background: "#F1F3F3", borderRadius: 20, padding: 16 }}
          >
            <div
              className="flex h-full flex-col"
              style={{
                background: "#F9FBFB",
                border: "1px solid #FFFFFF",
                borderRadius: 12,
                padding: 21,
                gap: 16,
                boxShadow: "0 1px 2px rgba(12,12,13,0.05)",
              }}
            >
              <div className="relative flex flex-col" style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    fontSize: 16,
                    lineHeight: "24px",
                    color: "#090B0C",
                  }}
                >
                  Free
                </div>
                <div
                  className="mt-auto flex flex-col"
                  style={{ gap: 4, justifyContent: "flex-end" }}
                >
                  <div style={{ height: 20 }} aria-hidden="true" />
                  <div className="flex items-baseline" style={{ gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 400,
                        fontSize: 32,
                        lineHeight: 1.05,
                        color: "#090B0C",
                      }}
                    >
                      $0
                    </span>
                  </div>
                </div>
              </div>
              <FeatureList plan="free" />
              <Link
                to="/quiz"
                className="inline-flex w-full items-center justify-center"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E3E7E8",
                  borderRadius: 4,
                  padding: "13px 17px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: "20px",
                  color: "#090B0C",
                }}
              >
                Get started free
              </Link>
            </div>
          </div>

          {/* Paid shell */}
          <div
            className="flex-1 max-lg:order-1"
            style={{ background: "#F1F3F3", borderRadius: 20, padding: 16 }}
          >
            <div
              className="relative flex h-full flex-col"
              style={{
                background: "rgba(255,255,255,0.8)",
                border: "1px solid #FFFFFF",
                borderRadius: 12,
                padding: 21,
                gap: 16,
                boxShadow: "0 1px 4px rgba(12,12,13,0.05)",
                overflow: "hidden",
                isolation: "isolate",
              }}
            >
              {/* Glow */}
              <span
                aria-hidden="true"
                className="pricing-paid-glow"
                style={{
                  position: "absolute",
                  top: -120,
                  right: -120,
                  width: 360,
                  height: 360,
                  background:
                    "radial-gradient(circle, #00F1A9 0%, rgba(0,241,169,0) 70%)",
                  filter: "blur(60px)",
                  opacity: 0.55,
                  zIndex: 1,
                  pointerEvents: "none",
                }}
              />
              <div className="relative flex flex-col" style={{ flex: 1, zIndex: 2 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 400,
                    fontSize: 16,
                    lineHeight: "24px",
                    color: "#090B0C",
                  }}
                >
                  {paid.name}
                </div>
                {paid.pill ? (
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      background: "#0E735A",
                      borderRadius: 24,
                      padding: "4px 8px",
                      fontFamily: "var(--font-sans)",
                      fontWeight: 400,
                      fontSize: 12,
                      lineHeight: "16px",
                      color: "#FFFFFF",
                    }}
                  >
                    {paid.pill}
                  </span>
                ) : null}
                <div
                  className="mt-auto flex flex-col"
                  style={{ gap: 4, justifyContent: "flex-end" }}
                >
                  <div
                    style={{
                      height: 20,
                      fontFamily: "var(--font-sans)",
                      fontWeight: 300,
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: "#67787C",
                      textDecoration: paid.struck ? "line-through" : "none",
                    }}
                  >
                    {paid.struck || "\u00A0"}
                  </div>
                  <div className="flex items-baseline" style={{ gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 400,
                        fontSize: 32,
                        lineHeight: 1.05,
                        color: "#090B0C",
                      }}
                    >
                      {paid.price}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-sans)",
                        fontWeight: 300,
                        fontSize: 14,
                        lineHeight: 1.5,
                        color: "#67787C",
                      }}
                    >
                      {paid.suffix}
                    </span>
                  </div>
                </div>
              </div>
              <div style={{ position: "relative", zIndex: 2 }}>
                <FeatureList plan="paid" />
              </div>
              <Link
                to="/quiz"
                className="inline-flex w-full items-center justify-center"
                style={{
                  background: "#00F1A9",
                  border: "1px solid #00F1A9",
                  borderRadius: 4,
                  padding: "13px 17px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: 400,
                  fontSize: 14,
                  lineHeight: "20px",
                  color: "#090B0C",
                  position: "relative",
                  zIndex: 2,
                }}
              >
                Start {TRIAL_DAYS}-day free trial
              </Link>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 767px) {
          #pricing > div { padding: 48px 24px !important; }
          #pricing .pricing-paid-glow { width: 140px !important; height: 140px !important; }
        }
      `}</style>
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
                className="overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface-1)]"
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

