export type Source = "direct" | "aggregated";
export type CardState = "default" | "saved" | "applied" | "dismissed" | "reported";

export type MatchCriterion = { status: "full" | "partial"; text: string };
export type DescriptionSection = { heading: string; body?: string; bullets?: string[] };
export type JobDetails = {
  employmentType?: string;
  experienceLevel?: string;
  workplace?: string;
  postedDate?: string;
  jobId?: string;
};
export type JobSource = { name: string; role: "primary" | "secondary"; url?: string };

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  score: number;
  why: string;
  source: Source;
  postedDays: number;
  initialState?: CardState;
  employmentType?: string;
  postingUrl?: string;
  criteria?: MatchCriterion[];
  description?: DescriptionSection[];
  details?: JobDetails;
  sources?: JobSource[];
};

const fallbackCriteria: MatchCriterion[] = [
  { status: "full", text: "Stack: React, TypeScript — matches your profile" },
  { status: "full", text: "Level: senior — matches" },
  { status: "partial", text: "Salary near your $100–160K+ range" },
  { status: "full", text: "Workplace matches your preference" },
];

const fallbackDescription: DescriptionSection[] = [
  {
    heading: "About the role",
    body:
      "Join a small, senior-heavy web team building customer-facing product surfaces. You'll own features end-to-end, from ambiguous problem statements to shipped code and measured outcomes.",
  },
  {
    heading: "Requirements",
    bullets: [
      "5+ years of professional frontend experience",
      "Deep React and TypeScript proficiency",
      "Comfort with product ambiguity and cross-functional collaboration",
    ],
  },
];

function withDefaults(job: Job): Job {
  return {
    employmentType: "Full-time",
    postingUrl: "#",
    criteria: fallbackCriteria,
    description: fallbackDescription,
    details: {
      employmentType: "Full-time",
      experienceLevel: "Senior",
      workplace: job.location,
      postedDate: "Jul 17, 2026",
      jobId: job.id.toUpperCase(),
    },
    sources: [
      {
        name: job.source === "direct" ? "Greenhouse — company careers page" : "Adzuna — aggregated listing",
        role: "primary",
      },
    ],
    ...job,
  };
}

export const TODAY_JOBS: Job[] = [
  withDefaults({
    id: "t1",
    title: "Lead UI Developer",
    company: "Nimbus Corp",
    location: "Remote (US)",
    salary: "$160–200K",
    score: 95,
    why: "Expert in Vue.js + JavaScript, leadership role, competitive salary",
    source: "direct",
    postedDays: 3,
    initialState: "saved",
    employmentType: "Full-time",
    criteria: [
      { status: "full", text: "Stack: Vue.js, JavaScript — matches your profile" },
      { status: "full", text: "Level: senior — matches" },
      { status: "full", text: "Salary: $160–200K — inside your $100–160K+ range" },
      { status: "full", text: "Location: remote (US) — matches your preference" },
      { status: "partial", text: "Leadership focus — adjacent to your experience" },
    ],
    description: [
      {
        heading: "About the role",
        body:
          "Nimbus Corp is hiring a Lead UI Developer to shape the frontend architecture of our analytics suite. You'll partner with design and product to define the component system, coach two mid-level engineers, and set the technical direction for the next major release.",
      },
      {
        heading: "What you'll do",
        bullets: [
          "Lead the migration of our dashboard from Options API to Vue 3 Composition API",
          "Own the design-to-code pipeline with our design team",
          "Set testing, accessibility, and performance standards across the frontend",
          "Mentor two mid-level engineers through code review and pairing",
        ],
      },
      {
        heading: "Requirements",
        bullets: [
          "6+ years of professional frontend experience",
          "Deep expertise with Vue 3, TypeScript, and modern build tooling",
          "Track record leading a small team or major feature area",
          "Comfort operating in a remote-first, senior-heavy environment",
        ],
      },
    ],
    details: {
      employmentType: "Full-time",
      experienceLevel: "Senior / Lead",
      workplace: "Remote (US)",
      postedDate: "Jul 17, 2026",
      jobId: "NIMBUS-2026-114",
    },
    sources: [
      { name: "Greenhouse — company careers page", role: "primary", url: "#" },
      { name: "Adzuna", role: "secondary" },
    ],
  }),
  withDefaults({
    id: "t2",
    title: "Principal Frontend Developer",
    company: "Orion Tech",
    location: "Hybrid, Los Angeles",
    salary: "$150–190K",
    score: 86,
    why: "Proficient in Angular + TypeScript, senior position, salary fits your expectations",
    source: "aggregated",
    postedDays: 1,
    criteria: [
      { status: "full", text: "Stack: TypeScript, Angular — matches your profile" },
      { status: "full", text: "Level: principal — above senior, matches your trajectory" },
      { status: "full", text: "Salary: $150–190K — inside your range" },
      { status: "partial", text: "Hybrid Los Angeles — adjacent to your remote preference" },
    ],
    description: [
      {
        heading: "About the role",
        body:
          "Orion Tech is looking for a Principal Frontend Developer to anchor the web platform team. You'll define architectural patterns, review high-impact PRs, and drive multi-quarter initiatives across a codebase used by a million weekly users.",
      },
      {
        heading: "Requirements",
        bullets: [
          "8+ years shipping production frontend at scale",
          "Angular 15+ and TypeScript proficiency",
          "Experience influencing platform-level decisions",
        ],
      },
    ],
    details: {
      employmentType: "Full-time",
      experienceLevel: "Principal",
      workplace: "Hybrid, Los Angeles",
      postedDate: "Jul 19, 2026",
      jobId: "ORION-2026-403",
    },
    sources: [{ name: "LinkedIn — aggregated listing", role: "primary" }],
  }),
  withDefaults({
    id: "t3",
    title: "Senior React Engineer",
    company: "Vertex Solutions",
    location: "Remote (US)",
    salary: "$165–205K",
    score: 74,
    why: "Strong React + Redux skills, senior level, salary aligned with your range",
    source: "aggregated",
    postedDays: 4,
    criteria: [
      { status: "full", text: "Stack: React, Redux, TypeScript — matches your profile" },
      { status: "full", text: "Level: senior — matches" },
      { status: "partial", text: "Salary: $165–205K — near the top of your range" },
      { status: "full", text: "Location: remote (US) — matches your preference" },
    ],
    description: [
      {
        heading: "About the role",
        body:
          "Vertex Solutions is growing the web platform team behind our fintech dashboards. You'll partner with product and design to ship measurable improvements to a Redux-powered React app with hundreds of thousands of daily users.",
      },
      {
        heading: "Requirements",
        bullets: [
          "5+ years with React and modern TypeScript",
          "Strong Redux and state modeling instincts",
          "Experience owning features end-to-end in a remote team",
        ],
      },
    ],
    details: {
      employmentType: "Full-time",
      experienceLevel: "Senior",
      workplace: "Remote (US)",
      postedDate: "Jul 16, 2026",
      jobId: "VERTEX-2026-217",
    },
    sources: [{ name: "Adzuna — aggregated listing", role: "primary" }],
  }),
  withDefaults({ id: "t4", title: "Frontend Architect", company: "Helix Innovations", location: "Remote (US)", salary: "$180–220K", score: 71, why: "Expertise in Svelte + TypeScript, senior role, salary within your range", source: "direct", postedDays: 6, initialState: "applied" }),
  withDefaults({ id: "t5", title: "UI Engineer Lead", company: "Quantum Leap", location: "Remote (US)", salary: "$175–215K", score: 70, why: "Strong React + GraphQL experience, senior level, salary matches your expectations", source: "direct", postedDays: 8, initialState: "dismissed" }),
];

export const YESTERDAY_JOBS: Job[] = [
  withDefaults({ id: "y1", title: "Staff Frontend Engineer", company: "Vercel", location: "Remote (US)", salary: "$190–230K", score: 79, why: "Next.js + React expert, staff-level scope, salary above your target", source: "direct", postedDays: 2 }),
  withDefaults({ id: "y2", title: "Senior Software Engineer, Web", company: "Figma", location: "Hybrid, San Francisco", salary: "$175–215K", score: 68, why: "TypeScript + React fit, senior IC track, salary in range", source: "direct", postedDays: 2 }),
  withDefaults({ id: "y3", title: "Senior Frontend Engineer", company: "Linear", location: "Remote (US)", salary: "$170–210K", score: 76, why: "React + TypeScript match, senior role, competitive comp", source: "direct", postedDays: 3 }),
  withDefaults({ id: "y4", title: "Senior Product Engineer", company: "Notion", location: "Hybrid, New York", salary: "$180–220K", score: 72, why: "Full-stack React fit, senior scope, salary aligned", source: "aggregated", postedDays: 3 }),
  withDefaults({ id: "y5", title: "Senior Frontend Developer", company: "Ramp", location: "Hybrid, New York", salary: "$175–210K", score: 70, why: "React + TS strong match, senior level, salary within range", source: "direct", postedDays: 4 }),
];