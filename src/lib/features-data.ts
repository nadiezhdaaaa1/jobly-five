import type { ContentBlock } from "./blog-data";

/**
 * SEO "Features" section data — product/feature landing pages.
 *
 * Same shape and conventions as `guides-data.ts` and `vs-data.ts`, so the three
 * SEO route families stay symmetrical.
 *
 * IMPORTANT: `published` is the single switch that makes a page live.
 *   published: false → the route renders `<meta name="robots" content="noindex, follow">`
 *                      and emits NO canonical tag, and the page stays out of the sitemap.
 *   published: true  → the route emits its canonical tag, no robots meta, and the page
 *                      becomes eligible for indexing / sitemap inclusion.
 *
 * Prose is published verbatim from the supplied documents — do not rewrite,
 * tighten, Americanise or reorder. Figures are supplied pre-checked; never
 * re-derive them from `src/config/pricing.ts`.
 */

export type FeatureFaq = { question: string; answer: string };

export type FeaturePage = {
  slug: string;
  /** H1 / on-page title. Also the footer link text — never hand-write labels. */
  title: string;
  deck: string;
  /** Used verbatim as the <title> when present (bypasses the "{title} — Jobly" pattern). */
  metaTitle?: string;
  /** Used verbatim as the meta description when present (otherwise the deck is used). */
  metaDescription?: string;
  /** Short footer label — the full title is too long for a footer column. */
  footerLabel: string;
  published: boolean;
  lastUpdated: string;
  /** Blocks above the first mid-page CTA. */
  intro: ContentBlock[];
  body: ContentBlock[];
  faq: FeatureFaq[];
  /** Closing CTA band copy, supplied with the document. */
  closingTitle: string;
  closingCta: string;
};

const LAST_UPDATED = "2026-09-17";

const DAILY_DIGEST: FeaturePage = {
  slug: "daily-job-digest-email",
  title: "Your Daily Job Digest Email, Curated by AI",
  footerLabel: "Daily job digest email",
  // Supplied meta title and meta description — used verbatim. Description replaced 2026-09-17
  // (measured 164 chars, over the ~160 render limit) with this measured 158-char string.
  metaTitle: "Daily Job Digest Email — AI-Curated Matches | Jobly",
  metaDescription:
    "Five matched tech roles in your inbox every morning, scored against your profile, with dormant listings filtered out. No job-board checking. 3-day free trial.",
  deck: "Roles that fit, first — with a match score. Five of them, in your inbox, every morning.",
  published: true,
  lastUpdated: LAST_UPDATED,
  intro: [
    {
      type: "p",
      text: "Your daily job digest email is a single message that arrives each morning with the five roles Jobly matched to your profile that day. You set the profile once — role, stack, seniority, location, salary range — and the matching runs from there. Each role comes with a match score and the reasoning behind it, so you can tell in seconds whether it's worth opening. Dormant listings are screened out before the email is built.",
    },
    {
      type: "p",
      text: "No feed. No daily check-in. No thirty minutes a day on LinkedIn to find out nothing new came up.",
    },
  ],
  body: [
    { type: "h2", text: "What's inside your digest" },
    { type: "p", text: "Five matches, ranked. Each one carries a score and the breakdown behind it." },
    {
      type: "p",
      text: "The match score. One number for overall fit, built from three components you can see separately:",
    },
    {
      type: "ul",
      items: [
        "Experience fit — how your level and years line up with what the role actually requires, not what the listing padded into the requirements section.",
        "Skill fit — which parts of your stack the role calls for, and which ones it wants that you don't have yet.",
        "Industry fit — how close the company's sector is to where you've worked, and whether that jump is one hiring managers in the space actually make.",
      ],
    },
    {
      type: "p",
      text: "Location and salary range work as filters rather than score components: roles outside them don't reach the digest at all.",
    },
    {
      type: "p",
      text: "The \u201Cwhy this fits\u201D reasoning. Under each score, a short explanation in plain language — what matched, what didn't, what would be the stretch. It's the part that tells you whether an 82% is an easy yes or a role you'd need to make a case for.",
    },
    {
      type: "p",
      text: "Nothing else. No sponsored listings, no \u201Cyou might also like\u201D filler, no roles added to round the list up to five. If a day produces three matches worth sending, you get three.",
    },
    { type: "h2", text: "Why email instead of another app to check" },
    { type: "p", text: "Two reasons, and the first one is speed." },
    {
      type: "p",
      text: "Good roles don't sit. A well-matched opening at a company people want to work at is typically gone within days — not because it was filled that fast, but because the shortlist is full and everything after it is noise. Seeing a role on day one and seeing it on day four are different searches. A digest that arrives every morning puts you in the first group without you doing anything.",
    },
    {
      type: "p",
      text: "The second reason is that a search which depends on your motivation stalls exactly when you need it most. Job boards are built to be visited: you scroll, you evaluate more listings than anyone reasonably can, and the good ones sit among the ones that paid to be visible. Other AI matching tools moved the filtering to software but kept the visit — you still open a platform and check a feed.",
    },
    {
      type: "p",
      text: "Email removes the visit. It arrives whether or not you had the energy that day. Five items, two minutes, somewhere you already look — no new habit to build.",
    },
    { type: "h2", text: "How your digest is built" },
    { type: "p", text: "Three steps, running before your alarm goes off." },
    {
      type: "ul",
      items: [
        "1. Collect. Jobly pulls fresh listings from the sources it monitors and drops anything you've already been shown.",
        "2. Screen for dormant roles. Each listing is checked against the activity in the employer's ATS feed. A posting attached to a live requisition behaves differently there from one left up while the job board keeps serving it. Ghost jobs run somewhere between 1 in 7 and 1 in 3 of all postings by credible estimates, and this check is the part you can't do yourself from a listing page.",
        "3. Score and rank. What's left is scored against your profile on experience, skill and industry fit. The top five go into the email with their reasoning. The rest wait for tomorrow.",
      ],
    },
    { type: "h2", text: "After you apply" },
    {
      type: "p",
      text: "The digest gets you to the right roles. The application tracker keeps what comes next in order — every application with its status, plus reminders when a thread goes quiet. Same login, no spreadsheet.",
    },
  ],
  faq: [
    {
      question: "How often does the daily job digest email arrive?",
      answer: "Once a day, every morning. One email — not a notification per listing.",
    },
    {
      question: "Can I change what roles I get matched to?",
      answer:
        "Yes. Update your target roles, stack, seniority, location, remote preference or salary range any time, and the next morning's digest reflects it.",
    },
    {
      question: "Is the digest free?",
      answer:
        "There's a 3-day free trial, so you can see a few mornings of it before you decide. After that, Pro is $16.99 a month, or $10.99 a month on the six-month plan. Watch — a weekly digest rather than a daily one — starts at $2.92 a month.",
    },
    {
      question: "Do you apply to jobs for me?",
      answer:
        "No, and that's deliberate. Auto-apply tools send applications in your name at volume, which burns your reputation with exactly the companies you care about. Jobly finds the roles and shows you why they fit. You decide what to send.",
    },
    {
      question: "What happens when I find a job?",
      answer:
        "You pause the digest in one click — it stops, your profile and tracker history stay. When you're looking again, in a year or in five, you switch it back on instead of starting over.",
    },
    {
      question: "Does it really filter out ghost jobs?",
      answer:
        "It filters listings whose ATS feed shows no sign of an active requisition. No tool can confirm a company's hiring intent from the outside, so treat it as a strong filter, not a guarantee. You can run any individual listing through the Ghost Job Checker yourself.",
    },
  ],
  closingTitle: "New roles that fit. Tomorrow morning.",
  closingCta: "Get my matches",
};

export const FEATURE_PAGES: FeaturePage[] = [DAILY_DIGEST];

export function getFeaturePage(slug: string): FeaturePage | undefined {
  return FEATURE_PAGES.find((p) => p.slug === slug);
}
