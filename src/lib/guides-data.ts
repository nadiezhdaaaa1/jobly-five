import type { ContentBlock } from "./blog-data";

/**
 * SEO "Guides" section data.
 *
 * IMPORTANT: `published` is the single switch that makes a page live.
 *   published: false → the route renders `<meta name="robots" content="noindex, follow">`
 *                      and emits NO canonical tag, and the page stays out of the sitemap.
 *   published: true  → the route emits its canonical tag, no robots meta, and the page
 *                      becomes eligible for indexing / sitemap inclusion.
 *
 * Body blocks reuse the blog's `ContentBlock` union (see src/lib/blog-data.ts).
 * FAQ sections and FAQPage JSON-LD light up automatically as soon as `faq` is non-empty.
 */

export type GuideFaq = { question: string; answer: string };

export type Guide = {
  slug: string;
  title: string;
  deck: string;
  /** Used verbatim as the <title> when present (bypasses the "{title} — Jobly" pattern). */
  metaTitle?: string;
  /** Used verbatim as the meta description when present (otherwise the deck is used). */
  metaDescription?: string;
  published: boolean;
  lastUpdated: string;
  body: ContentBlock[];
  faq: GuideFaq[];
};

export type GuideArticle = {
  guide: string;
  slug: string;
  title: string;
  deck: string;
  published: boolean;
  lastUpdated: string;
  date: string;
  readTime: string;
  body: ContentBlock[];
  faq: GuideFaq[];
};

export const GUIDES: Guide[] = [
  {
    slug: "ghost-jobs",
    title: "Ghost Jobs Guide",
    deck: "Placeholder deck — the full ghost jobs guide is being written.",
    published: false,
    lastUpdated: "2026-08-26",
    body: [],
    faq: [],
  },
  {
    slug: "ai-job-matching",
    title: "AI Job Matching Guide",
    deck: "Placeholder deck — the full AI job matching guide is being written.",
    published: false,
    lastUpdated: "2026-08-26",
    body: [],
    faq: [],
  },
  {
    slug: "job-alerts",
    title: "Job Alerts Guide",
    deck: "Placeholder deck — the full job alerts guide is being written.",
    published: false,
    lastUpdated: "2026-08-26",
    body: [],
    faq: [],
  },
];

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    guide: "ghost-jobs",
    slug: "how-to-spot-ghost-jobs",
    title: "How To Spot Ghost Jobs",
    deck: "Placeholder deck — copy for “How to spot ghost jobs” is being written.",
    published: false,
    lastUpdated: "2026-08-26",
    date: "2026-08-26",
    readTime: "5 min read",
    body: [],
    faq: [],
  },
  {
    guide: "ghost-jobs",
    slug: "why-companies-post-ghost-jobs",
    title: "Why Companies Post Ghost Jobs",
    deck: "Placeholder deck — copy for “Why companies post ghost jobs” is being written.",
    published: false,
    lastUpdated: "2026-08-26",
    date: "2026-08-26",
    readTime: "5 min read",
    body: [],
    faq: [],
  },
  {
    guide: "ai-job-matching",
    slug: "ai-match-score-explained",
    title: "AI Match Score Explained",
    deck: "Placeholder deck — copy for “AI match score explained” is being written.",
    published: false,
    lastUpdated: "2026-08-26",
    date: "2026-08-26",
    readTime: "5 min read",
    body: [],
    faq: [],
  },
  {
    guide: "ai-job-matching",
    slug: "ai-matching-vs-keyword-search",
    title: "AI Matching vs Keyword Search",
    deck: "Placeholder deck — copy for “AI matching vs keyword search” is being written.",
    published: false,
    lastUpdated: "2026-08-26",
    date: "2026-08-26",
    readTime: "5 min read",
    body: [],
    faq: [],
  },
  {
    guide: "job-alerts",
    slug: "set-up-job-alerts",
    title: "Set Up Job Alerts",
    deck: "Placeholder deck — copy for “Set up job alerts” is being written.",
    published: false,
    lastUpdated: "2026-08-26",
    date: "2026-08-26",
    readTime: "5 min read",
    body: [],
    faq: [],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getGuideArticle(guideSlug: string, articleSlug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((a) => a.guide === guideSlug && a.slug === articleSlug);
}

export function getArticlesForGuide(guideSlug: string): GuideArticle[] {
  return GUIDE_ARTICLES.filter((a) => a.guide === guideSlug);
}
