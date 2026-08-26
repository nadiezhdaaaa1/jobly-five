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
    footerLabel: `Jobly and ${competitorName}`,
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
