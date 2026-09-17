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
    title: "Ghost Jobs: What They Are, Why Companies Post Them, and How to Avoid Wasting Time",
    // Supplied meta title (57 chars) and meta description (154 chars) — used verbatim, do not rewrite.
    metaTitle: "Ghost Jobs: What They Are and How to Spot Them in 2026",
    metaDescription:
      "Between 1 in 7 and 1 in 3 job postings may be ghost jobs. What the real data says, why companies post them, and seven signals to check before you apply.",
    deck: "Between 1 in 7 and 1 in 3 job postings may be ghost jobs. What the real data says, why companies post them, and seven signals to check before you apply.",
    published: false,
    lastUpdated: "2026-09-17",
    body: [
      {
        type: "p",
        text: "A ghost job is a job posting for a position that doesn't exist, has already been filled, or that the employer has no immediate plan to fill. The U.S. Congressional Research Service, in an April 2025 brief, defines \u201cghost\u201d job postings as online listings for positions that do not exist or that employers aren't planning to fill immediately — and notes plainly that no government agency tracks how many of them there are. The Bureau of Labor Statistics counts job openings through its JOLTS survey, but that survey has no way to tell a real opening from a listing that's been sitting there for six months collecting résumés.",
      },
      {
        type: "p",
        text: "That gap — real postings on one side, no official count of fake ones on the other — is why every statistic you'll see below comes from a private survey or a research firm's own dataset, not a government number.",
      },
      {
        type: "p",
        text: "The short version: credible estimates put ghost jobs somewhere between 14% and 33% of postings, depending on who's measuring and what they're measuring. Government, education, and tech postings show the widest gaps. Senior and executive roles are hit hardest. Nothing about the practice is illegal in most of the U.S. yet, though that's starting to change at the state level. The seven signals further down are what to check before you spend an evening on an application.",
      },
      { type: "h2", text: "Ghost job statistics: how common are they?" },
      {
        type: "p",
        text: "Estimates vary widely because researchers measure different things — and it's worth being upfront about that spread rather than picking the biggest scary number.",
      },
      {
        type: "ul",
        items: [
          "Greenhouse (platform data, 2024): the hiring platform analyzed postings and hiring outcomes across its own customer base and found that between 18% and 22% of jobs advertised during the year were ghost jobs — roughly one in five. This is the most conservative credible figure, because it's drawn from how postings actually behaved inside an applicant tracking system rather than from what anyone said about them in a survey.",
          "MyPerfectResume, analyzing June 2025 BLS data (reported by Forbes, November 2025): roughly 30% of U.S. job postings showed no matching hire. In June 2025, employers reported 7.4 million openings but made 5.2 million hires — a gap of 2.2 million. The gap has held between 28% and 38% for several years, peaking in the post-pandemic hiring surge of 2021–2022.",
          "Clarify Capital (listing analysis, 2026, reported by Forbes April 2026): an analysis of more than 175,000 U.S. listings found about 1 in 7 — roughly 14% — were ghost jobs.",
          "Clarify Capital (employer survey, 1,045 hiring managers): a separate study by the same firm, this one asking employers directly, found nearly one in three admitted to posting roles with no current intent to hire. Self-reporting produces a much higher number than listing analysis, because it captures intent rather than outcome.",
          "Ashby (ATS data): an analysis of over 22,000 real applicant-tracking-system postings put the figure at 18%.",
        ],
      },
      {
        type: "p",
        text: "Put together, most credible estimates sit somewhere between 1 in 7 and 1 in 3 postings, depending on the industry and the measurement method. The honest summary: nobody — including Congress's own research arm — has a single trustworthy number, so treat any specific percentage as a snapshot from one dataset, not a settled fact.",
      },
      { type: "h2", text: "Ghost jobs by industry" },
      {
        type: "p",
        text: "Rates also vary sharply by sector, though it's worth being precise about what the sector numbers measure. The industry figures below come from the gap between posted openings and completed hires — a proxy for ghost jobs, not a direct count of them. A slow-filling but entirely real role widens the gap too.",
      },
      {
        type: "p",
        text: "With that caveat: the November 2025 analysis of June 2025 BLS data found government job postings had the widest gap, at around 60%, followed by education and health services (about 50%) and the information sector, which includes tech, at roughly 48%. Finance came in around 44%. At the other end, leisure and hospitality showed almost no gap — about 2% — and construction actually had more hires than open postings, meaning companies there were filling roles faster than they were advertising them.",
      },
      {
        type: "p",
        text: "Clarify Capital's 2026 listing analysis, using a different method, ranked wholesale (51%), mining (48%), and biotechnology (43%) as the highest-rate sectors — a reminder that industry rankings shift depending on who's measuring.",
      },
      { type: "h2", text: "Who encounters them most" },
      {
        type: "p",
        text: "The people most affected aren't evenly distributed either. Clarify Capital's research found the rate climbed to roughly 21% for senior-level postings and about 17% for C-suite roles, against an overall rate near 14%. The more specialized and senior the search, the more likely a listing sits open for months without a real hire behind it.",
      },
      { type: "h2", text: "Why companies post ghost jobs" },
      {
        type: "p",
        text: "The Congressional Research Service and multiple industry surveys point to a handful of recurring reasons, and none of them require malice — most are ordinary corporate incentives working exactly as designed:",
      },
      {
        type: "ul",
        items: [
          "Building a talent pipeline. Keeping a role open lets recruiters collect résumés for a position they expect to need later, without committing to hire now.",
          "Signaling growth. An active-looking careers page can matter to investors, competitors, or the board, independent of whether any of those roles get filled this quarter.",
          "Making current employees feel replaceable. Some surveys report employers use open postings as quiet pressure — a reminder that a role could be filled externally.",
          "Compliance and internal process. Some companies are required to post a role publicly even when an internal candidate has effectively already been chosen.",
          "Market and salary research. An open posting generates applications that tell a company what similar roles are paying elsewhere, without any hiring decision attached.",
          "Simple neglect. Not every ghost job is intentional — some listings just never get taken down after the role is filled or the search is shelved.",
        ],
      },
      { type: "h2", text: "Is any of this illegal?" },
      {
        type: "p",
        text: "Not under current U.S. federal law. The FTC's Section 5 authority over deceptive practices could in theory apply to clearly fraudulent listings, but enforcement here has been minimal so far.",
      },
      {
        type: "p",
        text: "That's starting to change at the state level. New York's Senate Bill S8877 passed the Senate in April 2026 and the Assembly on June 2, 2026. It would require employers with 100 or more employees, plus third-party job posting platforms, to state in bold capital letters whether a listing is a current vacancy to be filled within 90 days, a future opening with a later date, or simply résumé collection for roles that may never open. It would also require postings to come down within two weeks of a role being filled, with fines starting at $2,500 per non-compliant posting per platform and escalating if the listing isn't corrected. As of September 2026 the bill is still awaiting Governor Hochul's signature and is not law. Pennsylvania, New Jersey, California, and Kentucky have introduced comparable bills.",
      },
      {
        type: "p",
        text: "Outside the U.S., Ontario has already gone further. Since January 1, 2026, amendments to Ontario's Employment Standards Act (via the Working for Workers legislation and O. Reg. 476/24) have required employers with 25 or more employees to state in every publicly advertised posting whether it is for an existing vacancy — alongside pay disclosure, AI-use disclosure, and a 45-day rule for telling interviewed candidates whether a decision has been made.",
      },
      {
        type: "p",
        text: "None of this is settled law in most of the U.S. yet, so for now, posting a ghost job is legal almost everywhere — it's just increasingly viewed as bad practice, and increasingly regulated at the edges.",
      },
      { type: "h2", text: "What ghost jobs cost job seekers" },
      {
        type: "p",
        text: "The damage isn't just wasted time reading a listing. Enhancv's 2026 \u201cPhantom Market\u201d survey found that 37% of candidates who encountered a ghost job reported direct out-of-pocket losses chasing it. The most common expense was travel and gas (17.8%), largely from attending in-person interviews for positions that weren't real, followed by paid test assignments and certifications bought specifically for an application (9.9%) and childcare or eldercare arranged to attend those interviews (8.1%).",
      },
      {
        type: "p",
        text: "The cost lands unevenly. Among candidates in the lowest income bracket, 63% reported meaningful financial loss — the people least able to absorb it are the ones absorbing the most of it.",
      },
      {
        type: "p",
        text: "None of that shows up in official unemployment or job-openings data, which is part of why the Congressional Research Service brief flagged ghost jobs as a labor-market distortion worth watching, not just a job-seeker annoyance.",
      },
      { type: "h2", text: "How to avoid ghost job postings: seven signals to check" },
      {
        type: "p",
        text: "No single signal proves a listing is fake, but these are the patterns worth checking before you invest time in an application:",
      },
      {
        type: "p",
        text: "1. The posting has been live a long time. Postings open for 30+ days with no changes are worth a second look — most real hiring moves faster than that.",
      },
      {
        type: "p",
        text: "2. It's been reposted repeatedly. A listing that disappears and reappears every few weeks, sometimes with a new posting date but identical text, is a common ghost-job pattern.",
      },
      {
        type: "p",
        text: "3. The description is vague or generic. Real openings usually name a team, a manager, or a specific project. Listings that could apply to almost any company in the industry are a weaker signal of a real, budgeted role.",
      },
      {
        type: "p",
        text: "4. No response after applying. A genuine opening with an active recruiter typically generates at least an automated acknowledgment. Total silence for weeks, especially on a well-matched application, is a common complaint in job-seeker surveys.",
      },
      {
        type: "p",
        text: "5. The role never appears on the company's own careers page, only on third-party boards. Some listings exist purely to generate traffic or applicant data for the board itself.",
      },
      {
        type: "p",
        text: "6. The industry has a known pattern. Rates vary sharply by sector — tech, wholesale, and government show up repeatedly as higher-risk categories, while construction and hospitality tend to track much closer to actual hiring.",
      },
      {
        type: "p",
        text: "7. Salary or requirements are unusually broad, as if the listing is designed to catch the widest possible pool of résumés rather than filter for a specific role.",
      },
      {
        type: "p",
        text: "None of these signals is proof on its own — a slow-moving but real hiring process can look a lot like a ghost job from the outside. Two or three of them together is a stronger reason to verify before applying. You can run a single listing through the Ghost Job Checker to see which of these flags it trips.",
      },
      { type: "h2", text: "How Jobly filters them out automatically" },
      {
        type: "p",
        text: "Most of the signals above are things you can only check from the outside, one listing at a time. Jobly checks something you can't see at all: whether the role is still moving inside the employer's own applicant tracking system.",
      },
      {
        type: "p",
        text: "Before a listing reaches your daily digest, Jobly reads the activity in the ATS feed behind it. A posting attached to a live, active requisition looks different in that feed from one that's been sitting untouched while the job board keeps showing it. Roles that look dormant don't make the digest. That's a check no amount of manual inspection on the listing page can replicate — and it's the one job boards have no incentive to run, since a stale posting still counts as inventory.",
      },
      {
        type: "p",
        text: "You still get the \u201cwhy this fits\u201d reasoning behind every match, so you can judge the rest yourself. The filtering just means you're not the one doing the thirty-day-old-listing math by hand.",
      },
    ],
    faq: [
      {
        question: "What percentage of job postings are ghost jobs?",
        answer:
          "There's no single agreed number. Estimates from major studies range from about 14% to roughly 1 in 3, depending on the data source and method — Greenhouse's platform data puts it at 18–22%, Clarify Capital's listing analysis at about 14%, and employer self-reporting at nearly 33%. The Congressional Research Service has confirmed there's no official government statistic on this.",
      },
      {
        question: "Is it illegal to post a ghost job?",
        answer:
          "Not under current U.S. federal law. The FTC could theoretically pursue clearly deceptive postings under its Section 5 authority, but enforcement has been rare. New York's S8877 passed both chambers in 2026 and is awaiting the governor's signature as of September 2026, and several other states have similar bills in progress — but as of now, most ghost job postings aren't against the law anywhere in the U.S. Ontario, Canada already requires vacancy-status disclosure.",
      },
      {
        question: "How long do ghost jobs usually stay up?",
        answer:
          "There's no fixed answer, but multiple studies flag postings open 30 days or longer, with no changes to the listing, as a common pattern worth checking. In Clarify Capital's employer survey, one in ten hiring managers admitted keeping a listing live for more than six months.",
      },
      {
        question: "Why don't companies just take down old postings?",
        answer:
          "Sometimes it's intentional — ongoing pipeline building or signaling growth. Other times it's simple neglect: the role got filled or the search got shelved, and nobody removed the listing.",
      },
      {
        question: "Can a ghost job checker guarantee a listing is real?",
        answer:
          "No tool can confirm a company's actual hiring intent from the outside — checkers, including Jobly's, can only flag known patterns like posting age and repost frequency. Treat a clean result as a good sign, not a guarantee, and verify anything that matters before investing real time.",
      },
    ],
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
