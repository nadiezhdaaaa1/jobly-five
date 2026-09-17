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
    title: "What Is AI Job Matching, and How Does It Work?",
    // Supplied meta title (56 chars) and meta description (157 chars) — used verbatim.
    metaTitle: "What Is AI Job Matching and How Does It Work? | Jobly",
    metaDescription:
      "How AI job matching works, how it differs from keyword search, what a match score actually measures, and how to tell a real matching app from a marketing label.",
    deck: "How AI job matching works, how it differs from keyword search, what a match score actually measures, and how to tell a real matching app from a marketing label.",
    published: false,
    lastUpdated: "2026-09-17",
    body: [
      {
        type: "p",
        text: "AI job matching is the use of machine learning models — typically natural language processing, and increasingly models that read context rather than vocabulary — to compare a job seeker's profile against open roles and rank them by fit, rather than by whether the same keywords appear on both sides. Instead of asking \u201cdoes this resume contain the word Python,\u201d an AI matching system asks something closer to \u201cdoes this person's experience suggest they can do what this role needs,\u201d weighing skills, experience level and role context together rather than checking boxes one at a time.",
      },
      {
        type: "p",
        text: "The term covers a fairly wide range of products. Job boards that show a match score next to a listing, browser extensions that rank your saved jobs against your resume, and dedicated AI job matching apps that curate a shortlist and send it to you all use broadly similar techniques, even though what they do with the result differs enormously.",
      },
      { type: "h2", text: "How AI matching differs from keyword search" },
      {
        type: "p",
        text: "Keyword search — still the backbone of most traditional job boards — checks for exact or near-exact word matches between a resume and a job description. It's fast, transparent and easy to audit. What it misses is genuine matches described in different words. A resume saying \u201cled cross-functional product launches\u201d and a listing asking for \u201cproduct management experience\u201d describe similar work, but the vocabulary barely overlaps, so a strict keyword system may never connect them.",
      },
      {
        type: "p",
        text: "That failure mode is well documented from the employer's side. Harvard Business School's Hidden Workers: Untapped Talent — a 2021 study by Joseph Fuller and Manjari Raman with Accenture, surveying roughly 8,000 workers and 2,250 executives across the US, UK and Germany — found that 88% of employers agreed qualified high-skill candidates were filtered out of their hiring processes because they didn't match the exact criteria written into the job description. For middle-skill roles, the figure was 94%. The study estimated 27 million people in the US alone sit in that gap.",
      },
      {
        type: "p",
        text: "Employers built the filters, so it's fair to read that as a criticism of how the criteria were written rather than of the software. But the mechanism is the same one a job seeker runs into from the other direction: when matching depends on shared vocabulary, people who describe their work differently disappear.",
      },
      {
        type: "p",
        text: "AI matching addresses that in two stages, and most serious systems use both.",
      },
      {
        type: "p",
        text: "Retrieval. Each document — a resume, a job description — is converted into a numerical representation that captures meaning rather than wording, so texts with similar meaning end up numerically close even when the words differ. This is what makes it possible to scan a very large pool of listings quickly and pull out a few hundred plausible ones.",
      },
      {
        type: "p",
        text: "Reranking. The shortlist is then scored more carefully by a language model reading both documents together and reasoning about how well one fits the other, the way a recruiter reads past exact phrasing. This is slower and more expensive per comparison, which is why it runs on the shortlist rather than the whole pool.",
      },
      {
        type: "p",
        text: "These are stages of one pipeline, not competing approaches — a point worth being precise about, because tools that skip the second stage tend to produce scores that look confident and explain nothing.",
      },
      {
        type: "p",
        text: "On how well it works: there is no independent public benchmark for job-seeker-side matching accuracy. Vendors publish their own figures, and industry write-ups repeat them, but the numbers circulating in 2025 and 2026 mostly resolve to vendor or vendor-adjacent research rather than anything you can check. The direction is not seriously disputed — semantic approaches find relevant matches that keyword search misses. Any specific percentage should be treated as marketing until someone produces a methodology.",
      },
      {
        type: "p",
        text: "What that means practically: an AI matching tool is more likely to surface a role you're a real fit for even when your resume doesn't share the listing's vocabulary, and more likely to skip a role that contains matching keywords but doesn't fit your background.",
      },
      { type: "h2", text: "What a good match score actually measures" },
      {
        type: "p",
        text: "A match score sounds like one number, but a well-built one is a composite of separate comparisons combined at the end. Three show up consistently.",
      },
      {
        type: "p",
        text: "Experience fit. Whether your seniority, years and career trajectory line up with what the role asks — not just a count of years but the kind of experience. A model doing this well can distinguish five years of individual-contributor work from five years that included two years of people management, because those qualify you for different roles.",
      },
      {
        type: "p",
        text: "Skill overlap. The specific skills, tools and competencies in your background against what the role requires, including skills your resume implies without stating. Someone who's built dashboards in a BI tool has skills adjacent to a data analyst role even if the phrase \u201cdata analysis\u201d never appears.",
      },
      {
        type: "p",
        text: "Industry or domain relevance. Whether your background sits in a similar domain to the role, since skills often don't transfer cleanly across industries even when the title is identical. A marketing manager role at a healthcare company and one at a consumer app company share a title and require meaningfully different context.",
      },
      {
        type: "p",
        text: "A transparent tool breaks the score into components rather than showing one unexplained percentage. That's partly because a single number invites the question \u201cwhy,\u201d and partly because the breakdown is simply more useful: you can see that a role is a stretch on experience but a strong skill fit, or the reverse, and weigh the tradeoff yourself.",
      },
      {
        type: "p",
        text: "The limits are worth stating plainly. None of these components can measure what most determines whether a job works out — team dynamics, a manager's style, whether the day-to-day resembles the posting, or compensation expectations nobody wrote down. A high score is a reason to look closer. It isn't a prediction.",
      },
      { type: "h2", text: "What to look for in an AI job matching tool" },
      {
        type: "p",
        text: "The label isn't regulated. \u201cAI-powered\u201d gets applied to everything from a genuine machine learning pipeline to a keyword filter with a percentage bolted on for marketing. A few questions are worth asking of any tool, including ones not mentioned on this page.",
      },
      {
        type: "p",
        text: "Does it explain the score or just show one? A tool that tells you which factors contributed is more useful and easier to sanity-check. An unexplained number can be wrong for a long time before you notice.",
      },
      {
        type: "p",
        text: "Does it separate skill and experience, or give one vague relevance figure? Separated factors let you judge tradeoffs. A single blended number asks you to trust its internal weighting, which you can't see.",
      },
      {
        type: "p",
        text: "Does it filter for listing quality, not just relevance? A role can be a strong match on every dimension and still be a stale posting that's been open for months with nobody hiring behind it. Relevance and listing quality are different problems, and a tool that solves only the first can still send you somewhere that wastes a week.",
      },
      {
        type: "p",
        text: "What data is it matching on? A resume you uploaded, a profile you filled in, or something pulled from another platform — these differ a lot in how current and accurate the comparison is. A profile you maintain deliberately usually beats a resume you last edited eight months ago.",
      },
      {
        type: "p",
        text: "Does better matching mean fewer results, or the same volume with scores attached? These are different design philosophies. Some tools rank a large list without shrinking it; others narrow a large pool to a small one. Neither is inherently better, but it determines how much filtering is still left to you, which is usually the thing you were trying to avoid.",
      },
    ],
    faq: [
      {
        question: "Is AI job matching accurate?",
        answer:
          "It depends on the system, and there's no independent benchmark that would let you compare tools directly. Semantic and transformer-based matching clearly outperform keyword search at finding relevant results — that much isn't disputed. The specific accuracy figures circulating in 2025 and 2026 mostly come from vendor or vendor-adjacent research, so treat any percentage as directional. Accuracy also depends on things outside the model: how specific the job description is, and how well your profile actually reflects your experience.",
      },
      {
        question: "Does AI job matching replace applying manually?",
        answer:
          "No. Matching decides what you see or how it's ranked, not what happens next. Every matching tool still requires a human decision about whether to apply and, in most cases, a human-written or human-reviewed application. What tools differ on is how much of the mechanical part — autofill, tailoring, submission — they layer on top.",
      },
      {
        question: "Can AI job matching be biased?",
        answer:
          "Yes, and it's a documented, actively regulated risk. Models trained on historical hiring data can reproduce patterns in that data, including patterns reflecting past bias rather than job-relevant differences. New York City's Local Law 144 requires annual independent bias audits of automated employment decision tools used in hiring there, and the EU AI Act classifies employment-related AI as high-risk with corresponding obligations. Both regulate tools employers use to screen candidates — not the tool a job seeker uses to find roles, which generally sits outside that scope. Mitigation techniques exist, but no current approach eliminates the risk, and job seekers have limited visibility into how any specific tool handles it.",
      },
      {
        question: "How is AI matching different from what a recruiter does?",
        answer:
          "A recruiter reading a resume is also matching, informed by judgment and context no algorithm has — team fit, a hiring manager's unwritten preferences. AI can process far more listings than a person and apply the same criteria consistently to all of them, but it lacks that contextual judgment in any individual case. Most well-designed processes use matching to narrow volume and leave the final call to a person.",
      },
      {
        question: "Do I need to change my resume to work with AI matching?",
        answer:
          "Not dramatically. Semantic matching reads for meaning, so a clear, specific resume works without formatting tricks. What does hurt is vagueness — \u201cresponsible for various tasks\u201d gives a model almost nothing, while \u201cmanaged a $2M budget across 3 product lines\u201d gives it a great deal. Clarity helps more than keyword-stuffing, which semantic systems are specifically designed to see through.",
      },
    ],
  },
  {
    slug: "job-alerts",
    title: "Job Alerts: How to Set Them Up So They Actually Work",
    // Supplied meta title (54 chars) and meta description (156 chars) — used verbatim.
    metaTitle: "Job Alerts: How to Set Them Up So They Actually Work",
    metaDescription:
      "How to set up job alerts that surface real matches instead of noise — how many to run, how to scope them, why they go irrelevant, and what alerts can't do.",
    deck: "How to set up job alerts that surface real matches instead of noise — how many to run, how to scope them, why they go irrelevant, and what alerts can't do.",
    published: false,
    lastUpdated: "2026-09-17",
    body: [
      {
        type: "p",
        text: "A job alert is a saved search that emails or notifies you when new listings match it. You set the keywords, location and filters once; the platform sends you whatever comes in matching them. Almost every job board offers them free, and they're the default way most people avoid checking job sites manually.",
      },
      {
        type: "p",
        text: "They also go wrong in predictable ways — too much noise, then too little, then silence. Most of that is fixable with how you scope them. Some of it isn't, and it's worth knowing which is which before you spend an evening tuning filters.",
      },
      { type: "h2", text: "What alerts do and don't do" },
      { type: "p", text: "Alerts forward. They don't rank, score, or vet." },
      {
        type: "p",
        text: "An alert sends everything matching your filters, in the order it arrived, with no judgment about whether a role suits your actual background. If your filters are broad, you get volume. If they're narrow, you get silence. There's no middle setting that produces \u201cthe good ones,\u201d because the system has no concept of good — only matched and unmatched.",
      },
      {
        type: "p",
        text: "They also don't check whether a listing is real. A posting that's been open four months with nobody hiring behind it looks identical, to a keyword filter, to one posted this morning. Ghost jobs run somewhere between one in seven and one in three of all postings by credible estimates, and alerts forward them like anything else.",
      },
      {
        type: "p",
        text: "That's the honest ceiling. Alerts move the searching off your calendar and into your inbox. The sorting is still yours.",
      },
      { type: "h2", text: "Job board alerts vs. an AI-matched digest" },
      {
        type: "p",
        text: "Worth laying out plainly, because they're often described as the same thing.",
      },
      {
        type: "table",
        headers: ["", "Job board alerts", "AI-matched digest"],
        rows: [
          ["How it selects", "Keyword and filter match", "Scores your profile against the role"],
          ["Ranking", "None — arrival order", "Ranked by fit"],
          ["Volume", "However many matched", "A fixed short list"],
          ["Explanation", "None", "Why each role fits, and where it doesn't"],
          ["Listing quality", "Not checked", "Screened for active hiring"],
          ["Cost", "Free on most boards", "Free tier plus paid plans"],
          ["Setup effort", "Several alerts, tuned over time", "One profile"],
        ],
      },
      {
        type: "p",
        text: "The trade is real in both directions. Alerts are free, available everywhere, and you control the filters exactly. A digest does the ranking and screening for you but asks you to trust its judgment about what made the cut.",
      },
      {
        type: "p",
        text: "If you're running a broad search in a crowded field and drowning in volume, ranking is what you're missing. If you're searching something narrow and specific — one city, one niche technology — well-scoped alerts may genuinely be enough, and there's no reason to pay for more.",
      },
      { type: "h2", text: "How to set up job alerts that work" },
      {
        type: "p",
        text: "(Steps below feed HowTo schema. Keep each step's name short and the text a single instruction — nested sub-steps break the markup.)",
      },
      {
        type: "p",
        text: "Step 1 — Write down what you're actually looking for. Before touching any settings: target titles, seniority, locations, remote or not, minimum salary. Alerts inherit the vagueness of whatever you type, and most bad alerts come from someone configuring before deciding.",
      },
      {
        type: "p",
        text: "Step 2 — Make one alert per title variant, not one broad alert. This is the single highest-value move. \u201cSenior Backend Engineer\u201d and \u201cStaff Software Engineer, Platform\u201d can be the same job to a hiring manager and completely different strings to a search box. Three narrow alerts beat one broad one, because broadening a single alert adds volume without adding relevance.",
      },
      {
        type: "p",
        text: "Step 3 — Set the location radius deliberately. The most common source of both noise and silence. Too wide and you get roles you'd never commute to; too narrow and you miss a company one town over. If you're open to remote, run remote as its own alert rather than a checkbox on a local one — the results behave differently.",
      },
      {
        type: "p",
        text: "Step 4 — Choose daily, not weekly. Well-matched roles move fast; a weekly alert can reach you after the shortlist has closed. Daily costs you nothing extra and is the difference between seeing a role on day one and day five.",
      },
      {
        type: "p",
        text: "Step 5 — Send them to email, not in-app notifications. Notification-only alerts look active in your settings while sending you nothing you'll actually read. Check the delivery setting on each alert individually — it's usually per-alert, not global.",
      },
      {
        type: "p",
        text: "Step 6 — Make sure they reach your inbox. Alert emails are bulk mail and routinely land in promotions or spam. After setting one up, find the first email and mark it important or add the sender to contacts. An alert filed in a folder you never open is worse than no alert, because you think it's working.",
      },
      {
        type: "p",
        text: "Step 7 — Review after two weeks and cut. Look at what each alert actually sent. Any alert producing nothing you opened gets deleted or rescoped — not left running. Most people accumulate alerts and never prune, which is how inboxes become unreadable and alerts get abandoned wholesale.",
      },
      {
        type: "p",
        text: "Step 8 — Tune one filter at a time. If an alert returns nothing, widen a single constraint and wait. Changing three at once tells you nothing about which one was the problem.",
      },
      { type: "h2", text: "Job alerts by role" },
      {
        type: "p",
        text: "Different roles need different alert setups — title variants differ, the useful filters differ, and what counts as a reasonable volume differs a lot between a generalist title and a specialised one.",
      },
    ],
    faq: [
      {
        question: "How many job alerts should I set up?",
        answer:
          "Somewhere between three and six for most searches. Fewer than three and you're relying on one phrasing to catch everything. More than six and the daily volume stops being readable, which is when people stop opening them entirely. The right number is the most you'll actually read every day, which is lower than you think.",
      },
      {
        question: "Why am I getting irrelevant alerts?",
        answer:
          "Usually a filter that's too broad, or keyword matching doing what keyword matching does. An alert for \u201cproduct manager\u201d catches \u201cproduct marketing manager,\u201d \u201ctechnical product manager\u201d and \u201cproduct manager, logistics\u201d equally, because the words match even when the jobs don't. Narrowing the title and adding a seniority filter helps more than adding negative keywords.",
      },
      {
        question: "Why did my alerts stop arriving?",
        answer:
          "Most often a delivery setting, an unsubscribe that switched off more than intended, or emails routing to promotions. If it's LinkedIn specifically, this covers the usual causes.",
      },
      {
        question: "Are job alerts worth it if I'm not actively looking?",
        answer:
          "Yes — this is arguably where they're best. One or two narrow alerts for roles you'd genuinely move for cost nothing and require nothing. The volume problems come from broad alerts during an active search, not from passive monitoring.",
      },
      {
        question: "Do alerts show me jobs before other people see them?",
        answer:
          "Marginally. A daily alert gets you there before someone checking weekly, which matters when well-matched roles fill in days. But everyone with a similar alert gets the same email at the same time, so it's not an advantage over other alert users — just over people searching manually.",
      },
    ],
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
