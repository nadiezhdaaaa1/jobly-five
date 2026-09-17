import type { ContentBlock } from "./blog-data";

/**
 * SEO "Compare" (vs) section data.
 *
 * IMPORTANT: `published` is the single switch that makes a page live.
 *   published: false → the route renders `<meta name="robots" content="noindex, follow">`
 *                      and emits NO canonical tag, and the page stays out of the sitemap.
 *   published: true  → the route emits its canonical tag, no robots meta, and the page
 *                      becomes eligible for indexing / sitemap inclusion.
 *
 * Body blocks reuse the blog's `ContentBlock` union (see src/lib/blog-data.ts).
 * FAQ sections + FAQPage JSON-LD, and the comparison <table>, light up automatically
 * as soon as `faq` / `comparison` are non-empty.
 */

export type VsFaq = { question: string; answer: string };

export type VsComparisonRow = {
  feature: string;
  jobly: string;
  competitor: string;
};

export type VsPage = {
  slug: string;
  competitorName: string;
  footerLabel: string;
  title: string;
  deck: string;
  published: boolean;
  lastUpdated: string;
  body: ContentBlock[];
  faq: VsFaq[];
  comparison: VsComparisonRow[];
};

const LAST_UPDATED = "2026-08-26";

function placeholder(
  slug: string,
  competitorName: string,
): VsPage {
  return {
    slug,
    competitorName,
    footerLabel: `Jobly vs ${competitorName}`,
    title: `Jobly vs ${competitorName}`,
    deck: `Placeholder deck — the full Jobly vs ${competitorName} comparison is being written.`,
    published: false,
    lastUpdated: LAST_UPDATED,
    body: [],
    faq: [],
    comparison: [],
  };
}

export const VS_PAGES: VsPage[] = [
  placeholder("linkedin", "LinkedIn"),
  placeholder("indeed", "Indeed"),
  placeholder("glassdoor", "Glassdoor"),
  placeholder("teal", "Teal"),
  placeholder("welcome-to-the-jungle", "Welcome to the Jungle"),
  placeholder("injobs", "inJobs"),
  placeholder("scarlett-ai", "Scarlett AI"),
  placeholder("jobright", "Jobright"),
  placeholder("sonara", "Sonara"),
];

export function getVsPage(slug: string): VsPage | undefined {
  return VS_PAGES.find((p) => p.slug === slug);
}

/**
 * Copy for the /vs index page. Same `published` semantics as the pages themselves:
 * false → noindex, follow + no canonical + excluded from the sitemap.
 * Prose is published verbatim — do not rewrite, tighten or reorder.
 */
export const VS_INDEX = {
  published: false,
  // Supplied meta title (54 chars) and meta description (151 chars) — used verbatim.
  metaTitle: "Jobly vs. Other Job Search Tools — Compared | Jobly",
  metaDescription:
    "Job search tools compared: how Jobly's daily match digest differs from LinkedIn, Indeed, ZipRecruiter, Jobright and the autofill tools people use with it.",
  h1: "Job search tools compared",
  intro: [
    "Most job search tools cover one stage: finding roles, applying faster, or looking better to recruiters. They overlap less than the category name suggests, which is why most people run two or three at once rather than picking a winner.",
    "Jobly covers the first stage. You set a profile once, and matched roles arrive by email each morning with a score and the reasoning behind it — no platform to open, no feed to scroll. What follows is where each of the tools people ask about sits relative to that, so you can tell which ones stack with Jobly and which ones replace it.",
  ],
  gridHeading: "Jobly vs",
  items: [
    {
      slug: "linkedin",
      label: "Jobly vs. LinkedIn",
      blurb:
        "LinkedIn is a professional network with a job board attached — Jobly is a curated daily shortlist with no feed to scroll or network to maintain.",
    },
    {
      slug: "indeed",
      label: "Jobly vs. Indeed",
      blurb:
        "Indeed aggregates nearly every listing on the internet, including the stale and duplicate ones — Jobly filters that volume down to a handful of matches worth your time.",
    },
    {
      slug: "jobright",
      label: "Jobly vs. Jobright",
      blurb:
        "Jobright is built around AI-assisted applying — resume tailoring, autofill, an agent that can submit applications for you — while Jobly focuses on curating what to apply to in the first place.",
    },
    {
      slug: "simplify",
      label: "Jobly vs. Simplify",
      blurb:
        "Simplify speeds up the applications you've already found, with autofill and automatic tracking — Jobly works upstream of that, deciding which roles land in front of you at all.",
    },
    {
      slug: "careerflow",
      label: "Jobly vs. Careerflow",
      blurb:
        "Careerflow is a prep-and-organize hub: LinkedIn profile scoring, resume building, a tracker board. Jobly starts a step earlier — which roles reach you — and tracks the ones you apply to.",
    },
    {
      slug: "sonara",
      label: "Jobly vs. Sonara",
      blurb:
        "Sonara auto-applies to jobs on your behalf, aiming for volume — Jobly gives you a small daily shortlist and leaves the decision to apply with you.",
    },
  ],
  closing:
    "Pick whichever one you're already using. Each comparison covers where the two overlap and where they don't — an autofill extension and a matching tool aren't competing for the same job.",
} as const;
