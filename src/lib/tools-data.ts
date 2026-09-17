/**
 * SEO "Tools" section data — interactive utility pages.
 *
 * IMPORTANT: `published` is the single switch that makes a page live.
 *   published: false → the route renders `<meta name="robots" content="noindex, follow">`
 *                      and emits NO canonical tag, and the page stays out of the sitemap.
 *   published: true  → the route emits its canonical tag, no robots meta, and the page
 *                      becomes eligible for indexing / sitemap inclusion.
 *
 * Prose is published verbatim from the supplied documents.
 *
 * `status` is a second, independent switch describing the tool's backend:
 *   "awaiting-backend" → the whole front end is live (field, helper, button and
 *                        its working state, all three result states styled), but
 *                        submitting resolves into `pendingResult` instead of a
 *                        verdict. No scoring logic exists client-side, by design.
 *   "live"             → submit calls the real backend check.
 *
 * DEV HANDOVER NOTES (the checker itself is being built server-side against
 * third-party APIs by the dev team):
 *  1. Signals. The three advertised signals are post age, repost pattern and
 *     description detail. Nothing in this app can compute the first two today:
 *     `public.jobs` carries one static `posted_days_ago` integer, with no
 *     first-seen timestamp, no posting URL and no listing history table, and a
 *     pasted description cannot be matched back to a row. Post age and repost
 *     pattern have to come from the third-party source, not from our schema.
 *  2. SSRF — applies to the URL branch of this input. The field accepts a link,
 *     so whoever wires the fetch inherits a server-side request forgery surface.
 *     Required on that path: allowlist only the hiring-system domains we already
 *     sync (Greenhouse, Lever, Ashby, Workable) plus known job boards; resolve
 *     DNS and reject private, loopback, link-local and metadata ranges
 *     (169.254.169.254 included) after resolution, not before; refuse redirects
 *     rather than following them; cap response size and time; and run the fetch
 *     on a separate egress path from the app's own outbound calls. Never echo
 *     the fetched body back to the client.
 *  3. Abuse. This is an unauthenticated public endpoint. Today only quiz-draft
 *     save is rate-limited (429 per IP) and cron hooks use a shared secret.
 *     The checker needs per-IP limits on a short window plus a payload cap at
 *     minimum; add a captcha only if abuse actually appears.
 */

export type ToolFaq = { question: string; answer: string };

export type ToolPage = {
  slug: string;
  /** H1 / on-page title. Also the source of the footer link text. */
  title: string;
  deck: string;
  metaTitle?: string;
  metaDescription?: string;
  /** Short footer label — the full title is too long for a footer column. */
  footerLabel: string;
  published: boolean;
  status: "live" | "awaiting-backend";
  lastUpdated: string;
  intro: string;
  input: {
    label: string;
    placeholder: string;
    helper: string;
    button: string;
    buttonWorking: string;
  };
  /**
   * Where a submit lands while `status` is "awaiting-backend": an explicitly
   * marked placeholder, never a fabricated low/medium/high verdict.
   */
  pendingResult: { title: string; body: string };
  /** Supplied verdict copy. Styled and reachable via the sample-result switcher. */
  resultStates: { level: "low" | "medium" | "high"; label: string; body: string }[];
  /** Supplied post-result bridge copy, shown with each result state. */
  postResultCta: { afterLow: string; afterMediumOrHigh: string; button: string };
  faq: ToolFaq[];
};

const GHOST_JOB_CHECKER: ToolPage = {
  slug: "ghost-job-checker",
  title: "Is This Job Posting Real? Check for Ghost Job Red Flags",
  footerLabel: "Ghost job checker",
  // Supplied meta title (52 chars) and meta description (149 chars) — used verbatim.
  // The description advertises all three signals, including the two the backend
  // team will source from third-party APIs. Shipped as written.
  metaTitle: "Ghost Job Checker — Is This Job Posting Real? | Jobly",
  metaDescription:
    "Free ghost job checker. Paste a listing and see which ghost job red flags it trips — post age, repost pattern, description detail. Results in seconds.",
  deck: "Paste a listing and see which ghost job red flags it trips.",
  published: false,
  status: "awaiting-backend",
  lastUpdated: "2026-09-17",
  intro:
    "Paste a listing into the ghost job checker and we'll run it against the patterns that usually give away a stalled or abandoned posting. This won't tell you a company's real hiring plans — only what's visible on the page itself. That's still more than most people check before spending an evening on an application.",
  input: {
    label: "Paste the listing",
    placeholder: "Link to the posting, or paste the description directly",
    helper: "Pasted text works best — many company career pages block automated reading.",
    button: "Run the check",
    buttonWorking: "Checking the listing\u2026",
  },
  pendingResult: {
    title: "Not yet available",
    body: "Your listing came through, but the check itself isn't running yet — it's being built, and we'd rather show you nothing than a risk level we made up. Nothing has been scored, and nothing here is a verdict on this posting. Until it's live, the seven signals in our ghost jobs guide are the same ones the checker will use, and you can read them in about two minutes.",
  },
  resultStates: [
    {
      level: "low",
      label: "Low risk",
      body: "Nothing here trips our flags. That's a good sign rather than a guarantee — we can only read the posting, not the company's intent. Apply while it's fresh.",
    },
    {
      level: "medium",
      label: "Medium risk",
      body: "Something's off — an aging post date, thin detail on the actual responsibilities. Worth two minutes on the company's own careers page before you commit an evening to the application.",
    },
    {
      level: "high",
      label: "High risk",
      body: "Several markers line up at once, and that combination is common in postings that sit open without a hire behind them. Verify directly with the company before you invest time.",
    },
  ],
  postResultCta: {
    afterLow: "Good one. Now get five like it every morning, without doing the checking yourself.",
    afterMediumOrHigh:
      "That's the check you just ran by hand, on one listing. Jobly runs it on every listing before it reaches you — plus one you can't run from a job page: whether the role is still moving inside the employer's hiring system.",
    button: "Get ghost-job-free matches",
  },
  faq: [
    {
      question: "What counts as a ghost job?",
      answer:
        "A posting left up with no active plan behind it — sometimes to keep r\u00E9sum\u00E9s flowing in, sometimes just forgotten after the role closed. More on why companies do it in our ghost jobs guide.",
    },
    {
      question: "How accurate is this ghost job checker?",
      answer:
        "It reads the posting itself for known patterns: how long it's been live, how specific the description is, whether it's been reposted repeatedly. It can't see inside the company, so treat the result as a prompt to dig further, not a verdict.",
    },
    {
      question: "What do I do if a listing is flagged?",
      answer:
        "Look up the role on the company's own careers page and check when it was actually posted there. A flag here is a reason to verify, not a reason to rule the job out.",
    },
  ],
};

export const TOOL_PAGES: ToolPage[] = [GHOST_JOB_CHECKER];

export function getToolPage(slug: string): ToolPage | undefined {
  return TOOL_PAGES.find((p) => p.slug === slug);
}
