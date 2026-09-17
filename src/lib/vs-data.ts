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
 *
 * Copy is published verbatim from the supplied documents. Every price — Jobly's and each
 * competitor's — was supplied pre-checked; do not re-derive, re-round or recalculate any
 * figure here, and do not import from src/config/pricing.ts to generate them.
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
  /** Used verbatim as the <title> when present (bypasses the "{title} — Jobly" pattern). */
  metaTitle?: string;
  /** Used verbatim as the meta description when present (otherwise the deck is used). */
  metaDescription?: string;
  deck: string;
  published: boolean;
  lastUpdated: string;
  /** Blocks rendered above the comparison table, preserving document order. */
  intro?: ContentBlock[];
  /** Heading above the comparison table; defaults to "Jobly vs {competitor} at a glance". */
  comparisonHeading?: string;
  body: ContentBlock[];
  faq: VsFaq[];
  comparison: VsComparisonRow[];
};

const LAST_UPDATED = "2026-09-17";

function placeholder(slug: string, competitorName: string): VsPage {
  return {
    slug,
    competitorName,
    footerLabel: `Jobly vs ${competitorName}`,
    title: `Jobly vs ${competitorName}`,
    deck: `Placeholder deck — the full Jobly vs ${competitorName} comparison is being written.`,
    published: false,
    lastUpdated: "2026-08-26",
    body: [],
    faq: [],
    comparison: [],
  };
}

const JOBLY_PRICING =
  "Pro: $16.99/month, or $10.99/month on the six-month plan. Watch (weekly digest) from $2.92/month";

const LINKEDIN: VsPage = {
  slug: "linkedin",
  competitorName: "LinkedIn",
  footerLabel: "Jobly vs LinkedIn",
  title: "Jobly vs. LinkedIn: Which One Should You Actually Use?",
  // Supplied meta title (51 chars) and meta description (155 chars) — used verbatim.
  metaTitle: "Jobly vs. LinkedIn: Which Finds Better Jobs? | Jobly",
  metaDescription:
    "LinkedIn is a network with a job board attached. Jobly emails five scored matches a day. Compared on matching, price, ghost-job filtering and delivery.",
  deck: "LinkedIn is a network with a job board attached. Jobly emails five scored matches a day. Compared on matching, price, ghost-job filtering and delivery.",
  published: false,
  lastUpdated: LAST_UPDATED,
  intro: [
    { type: "h2", text: "The real difference" },
    {
      type: "p",
      text: "LinkedIn is a professional network with a job board attached — Jobly is an email-first AI matcher with no network, no feed, and no profile to maintain. LinkedIn is built to be exhaustive and browsable, indexing an enormous number of postings and letting you filter by company, connection, and hiring status yourself. Jobly is built to be small and pre-filtered instead — a handful of scored matches a day, decided before you ever have to browse anything. Most people end up using both, just for different parts of the search: LinkedIn for visibility and referrals, Jobly for a low-effort daily shortlist that doesn't require logging in to check.",
    },
  ],
  comparisonHeading: "Jobly vs. LinkedIn at a glance",
  comparison: [
    {
      feature: "Platform",
      jobly: "Email digest of matched roles",
      competitor: "Professional network with a job board",
    },
    {
      feature: "Matching approach",
      jobly:
        "Per-role match score against your profile, split into experience, skill and industry fit, with written reasoning for each",
      competitor: "Recommendations from your profile and activity; job alerts by keyword and filter",
    },
    {
      feature: "Digest format",
      jobly: "One email a day, only curated matches",
      competitor: "A feed, plus alert emails from saved searches — volume varies, no ranking by fit",
    },
    {
      feature: "Ghost-job filtering",
      jobly: "Listings screened against activity in the employer's ATS feed before they reach you",
      competitor: "Verification badges on some postings; no filtering by whether a role is still active",
    },
    {
      feature: "Application tracker",
      jobly: "—",
      competitor: "— (no built-in status tracker; \u201cMy Jobs\u201d only saves listings)",
    },
    {
      feature: "Privacy from current employer",
      jobly: "\u2713 — your search activity isn't visible to anyone",
      competitor:
        "Partial — \u201cOpen to Work\u201d can be set to recruiters-only, but your profile, connections, and activity are otherwise visible by design",
    },
    {
      feature: "Where the work happens",
      jobly: "In your inbox — nothing to open",
      competitor: "On the platform — you open it, you scroll, you filter",
    },
    {
      feature: "Pricing",
      jobly: JOBLY_PRICING,
      competitor:
        "Free to browse and apply; Premium Career optional at ~$29.99–$39.99/mo (2026 list pricing, varies by billing cycle and account)",
    },
  ],
  body: [
    { type: "h2", text: "Who LinkedIn is better for" },
    {
      type: "p",
      text: "LinkedIn does something Jobly doesn't do at all, and for a lot of people that thing is the whole job search.",
    },
    {
      type: "p",
      text: "If your next role is going to come to you. Recruiters source on LinkedIn. If you're at a level or in a specialty where inbound is a real channel, your profile is the asset and keeping it current is the work. Jobly has no equivalent — we don't put you in front of recruiters, we put roles in front of you.",
    },
    {
      type: "p",
      text: "If you're searching through people rather than postings. Warm intros, alumni, former colleagues, someone who knows someone on the team. That path is often better than any application, and it runs entirely on LinkedIn's graph.",
    },
    {
      type: "p",
      text: "If you're researching companies as much as roles. Who works there, who left recently, what the team looks like, who you'd report to. Company research is genuinely LinkedIn's strength.",
    },
    {
      type: "p",
      text: "If you're not actively looking. A profile and the occasional alert cost nothing and require nothing. There's no reason to add a daily digest to a search you aren't running.",
    },
    {
      type: "p",
      text: "One thing worth being straight about: LinkedIn says Premium Career users are 2.6× more likely to be hired. That's their own figure and it's correlational — people who pay for a job-search subscription are people running a serious job search. It isn't evidence the product causes hires, and it isn't a reason to buy or skip Premium.",
    },
    { type: "h2", text: "Who Jobly is better for" },
    {
      type: "p",
      text: "If your problem is volume, not access. LinkedIn shows you what matches your filters, which in a broad tech search is more roles than anyone can evaluate. Jobly's daily digest is five, scored, with the reasoning attached — you can read the whole thing before your coffee cools and know why each one is there.",
    },
    {
      type: "p",
      text: "If you've stopped checking. This is the pattern that costs people the most. Searching on a platform works while your motivation holds and quietly stops when it doesn't, which is usually the fourth week, which is usually when it matters. An email arrives whether or not you had it in you that day.",
    },
    {
      type: "p",
      text: "If you want the stale listings gone before you see them. LinkedIn will show you a posting that's been sitting open for months, because from the outside it looks the same as one filled last week. Credible estimates put ghost jobs somewhere between one in seven and one in three of all listings. Jobly checks whether the role is still moving inside the employer's hiring system — a signal you can't read from a job page no matter how carefully you look.",
    },
    {
      type: "p",
      text: "If you want the score, not just the match. LinkedIn tells you a role matched your search. Jobly tells you an 82% and shows the split: strong on experience, gap on one part of the stack, adjacent industry. That's enough to decide in ten seconds whether it's an easy yes or a role you'd need to make a case for.",
    },
    {
      type: "p",
      text: "If you're in US or remote tech. Engineering, product, design and data are what Jobly is built and tuned for. LinkedIn covers everything, which is a real advantage if you're outside that and a real cost if you're inside it.",
    },
    { type: "h2", text: "If you're switching" },
    {
      type: "p",
      text: "You're probably not switching, and that's fine — almost nobody deletes LinkedIn. What usually changes is narrower than that.",
    },
    {
      type: "p",
      text: "Keep the profile. Recruiters search it, and Jobly doesn't put you in front of anyone. Leaving it stale costs you a channel that runs in the background.",
    },
    {
      type: "p",
      text: "Reconsider the alerts. If you have half a dozen saved searches firing email at you, that's the thing the digest replaces. Running both means two sources of job email, one ranked and one not, and the unranked one wins on volume every time. Turn the saved searches off for two weeks and see whether you miss them.",
    },
    {
      type: "p",
      text: "If you're paying for Premium, ask what for. InMails, profile-viewer data and Learning are real products that Jobly doesn't offer. But if you upgraded mainly for better job filters and applicant insights, that's the overlap — decide which one you'd keep if you could only keep one.",
    },
    {
      type: "p",
      text: "Expect the first week to feel thin. Five roles a day is a fraction of what a broad LinkedIn search shows, and that's the point. The useful comparison isn't how many roles you saw, it's how many you actually opened.",
    },
  ],
  faq: [
    {
      question: "Is Jobly cheaper than LinkedIn Premium?",
      answer:
        "Jobly Pro is $16.99 a month, or $10.99 a month on the six-month plan (Watch, the weekly digest, starts at $2.92 a month), against LinkedIn Premium Career at $39.99 a month (checked September 2026; see linkedin.com/premium/products for the current figure). LinkedIn has a free tier; Jobly has a 3-day free trial. The honest caveat: they aren't buying the same thing. Premium bundles InMails, profile-viewer data and LinkedIn Learning alongside its job features, so if you want those, price isn't really the comparison. If you're paying for Premium mainly to improve what you see in job search, that's the part a digest replaces.",
    },
    {
      question: "Can I use Jobly and LinkedIn together?",
      answer:
        "That's what most people do, and the tools don't overlap much. Keep the profile current so recruiters can find you and so you can research the companies Jobly surfaces. Let the digest handle the finding. If you're paying for Premium purely for job alerts, that's the part a digest replaces.",
    },
    {
      question: "Does Jobly work if I don't have a LinkedIn profile?",
      answer:
        "Yes. You build a Jobly profile directly — role, stack, seniority, location, salary range — and matching runs from that. Nothing is imported from LinkedIn and nothing is posted to it.",
    },
    {
      question: "Will Jobly show me roles LinkedIn doesn't?",
      answer:
        "Sometimes, though overlap is the norm — both draw on widely posted listings. The difference isn't coverage, it's what reaches you: five scored roles instead of everything that matched a filter, with dormant listings screened out first.",
    },
  ],
};

const INDEED: VsPage = {
  slug: "indeed",
  competitorName: "Indeed",
  footerLabel: "Jobly vs Indeed",
  title: "Jobly vs. Indeed: Which One Should You Actually Use?",
  // Supplied meta title (53 chars) and meta description (152 chars) — used verbatim.
  metaTitle: "Jobly vs. Indeed: Volume or a Shortlist? | Jobly",
  metaDescription:
    "Indeed aggregates almost every listing on the internet. Jobly sends five scored matches a day. Compared on matching, price, stale listings and delivery.",
  deck: "Indeed aggregates almost every listing on the internet. Jobly sends five scored matches a day. Compared on matching, price, stale listings and delivery.",
  published: false,
  lastUpdated: LAST_UPDATED,
  intro: [
    {
      type: "p",
      text: "Indeed is a job board built to index nearly everything — Jobly is an email-first AI matcher built to show you almost nothing, on purpose. Indeed aggregates listings from company sites, other boards, and direct employer postings, then leaves the filtering to you. Jobly filters first and sends what's left. Both are reasonable strategies; they just sit at opposite ends of the same tradeoff between coverage and curation.",
    },
  ],
  comparisonHeading: "Side by side",
  comparison: [
    {
      feature: "What it is",
      jobly: "Email digest of matched roles",
      competitor: "Job aggregator — pulls listings from company sites, boards and agencies",
    },
    {
      feature: "How it matches",
      jobly:
        "Match score against your profile, split into experience, skill and industry fit, with written reasoning",
      competitor: "Keyword relevance plus recommendations from your activity",
    },
    {
      feature: "What you get daily",
      jobly: "Five roles, ranked, scored. Fewer if fewer are worth sending",
      competitor:
        "Search results and saved-search alerts — as many as match, in no order of fit to you",
    },
    {
      feature: "Duplicates",
      jobly: "Deduplicated, and roles you've already seen don't come back",
      competitor: "Structural — the same role often appears several times from different sources",
    },
    {
      feature: "Stale listings",
      jobly: "Screened against activity in the employer's ATS feed before reaching you",
      competitor: "Also structural — an aggregator inherits whatever the source leaves up (why)",
    },
    {
      feature: "Where the work happens",
      jobly: "In your inbox",
      competitor: "On the site — you search, you filter, you sift",
    },
    {
      feature: "Free tier",
      jobly: "No free tier — 3-day free trial",
      competitor: "Everything, for job seekers — Indeed makes its money from employers",
    },
    {
      feature: "Paid",
      jobly: JOBLY_PRICING,
      competitor: "No standard job-seeker subscription",
    },
    {
      feature: "Coverage",
      jobly: "US and remote tech — engineering, product, design, data",
      competitor: "Global, every industry and wage level",
    },
  ],
  body: [
    { type: "h2", text: "Who Indeed is better for" },
    {
      type: "p",
      text: "Indeed's scale is real, and for a lot of searches it's the right tool with no close second.",
    },
    {
      type: "p",
      text: "If you're not in tech. Nursing, logistics, retail, trades, hospitality, administration, teaching — Indeed covers all of it. Jobly doesn't. If your search is outside engineering, product, design or data, this comparison ends here and the answer is Indeed.",
    },
    {
      type: "p",
      text: "If location matters more than fit. Searching everything within twenty miles of a specific place is exactly what an aggregator is built for. A matching service optimises for the wrong axis when the constraint is geographic.",
    },
    {
      type: "p",
      text: "If you want maximum coverage and you're willing to do the sifting. Indeed will show you more roles than anything else. If you'd rather see everything and decide yourself, that's a legitimate strategy, and it's free.",
    },
    {
      type: "p",
      text: "If you're hourly, contract or shift-based. These roles turn over fast and rarely have the kind of structured requirements a fit score can read. Volume and speed beat curation here.",
    },
    {
      type: "p",
      text: "And a straightforward point in Indeed's favour: it costs job seekers nothing, because employers pay. There's no upgrade path being dangled at you, which is more than most of this category can say.",
    },
    { type: "h2", text: "Who Jobly is better for" },
    {
      type: "p",
      text: "If your search returns more results than you can read. This is what a broad tech search on Indeed looks like: hundreds of matches, sorted by relevance to your keywords rather than fit to you, with the same role appearing three times from three sources. The daily digest is five roles with a score and the reasoning attached. You read the whole thing in two minutes.",
    },
    {
      type: "p",
      text: "If you keep meeting the same stale listing. An aggregator shows what its sources publish, and sources leave postings up. Credible estimates put ghost jobs between one in seven and one in three of all listings. Jobly checks whether the role is still moving in the employer's own hiring system — something you can't determine from a listing page however long you stare at it.",
    },
    {
      type: "p",
      text: "If keyword search keeps missing. \u201cSenior Backend Engineer\u201d and \u201cStaff Software Engineer, Platform\u201d can be the same job to a hiring manager and completely different strings to a search box. Scoring against your profile rather than your keywords catches roles a keyword search filters out, and drops roles that matched the words but not the job.",
    },
    {
      type: "p",
      text: "If you want to know why a role is there. Indeed tells you a listing matched. Jobly gives you an 82% and the split behind it: strong on experience, one gap in the stack, adjacent industry. That's enough to decide in ten seconds.",
    },
    {
      type: "p",
      text: "If you've stopped searching. Any tool that requires you to open it works while your motivation holds and quietly stops when it doesn't — usually around week four, usually when it matters most. The digest arrives regardless.",
    },
    { type: "h2", text: "If you're switching" },
    {
      type: "p",
      text: "Most people don't switch off Indeed so much as stop opening it daily. A few things worth knowing in the first fortnight.",
    },
    {
      type: "p",
      text: "Keep Indeed for targeted searches. When you have a specific company, a specific location or a specific job title in mind, an aggregator is the right tool and Jobly isn't. Searching \u201cproduct manager, Austin, hybrid\u201d is exactly what Indeed does well.",
    },
    {
      type: "p",
      text: "Turn off the saved-search alerts, at least temporarily. They're the piece the digest replaces, and running both means your inbox gets an unranked firehose alongside a ranked shortlist. The firehose wins on volume and loses on attention. Two weeks off is enough to tell whether you were reading them.",
    },
    {
      type: "p",
      text: "Expect to recognise some roles. Overlap is normal — both draw on widely posted listings. What changes is that you see each role once, scored, rather than three times, unranked, from three sources.",
    },
    {
      type: "p",
      text: "Judge it on opens, not impressions. Indeed's success metric is how many results it returned. That's the wrong measure here. Count how many of the five you actually opened, and how many were still live when you did.",
    },
  ],
  faq: [
    {
      question: "Is Jobly cheaper than Indeed?",
      answer:
        "Indeed is free to search. Jobly Pro is $16.99 a month, or $10.99 a month on the six-month plan (Watch, the weekly digest, starts at $2.92 a month), with a 3-day free trial. What you'd be paying for isn't access to listings, it's not having to sift them.",
    },
    {
      question: "Can I use Jobly and Indeed together?",
      answer:
        "Yes, and there's no conflict. Indeed is a good place to search when you have a specific company or location in mind. Jobly handles the daily discovery you'd otherwise do by habit. Some overlap in the roles is normal — both draw on widely posted listings.",
    },
    {
      question: "Does Jobly have as many jobs as Indeed?",
      answer:
        "No, and it isn't trying to. Indeed indexes millions of listings across every industry and wage level. Jobly covers US and remote tech roles and shows you five a day. If breadth of index is your criterion, Indeed wins it outright.",
    },
    {
      question: "Does Jobly cover non-tech roles?",
      answer:
        "No. Engineering, product, design and data in the US and remote market is the whole scope. If your search sits outside that, Indeed is the better tool and there's no version of this comparison where that changes.",
    },
    {
      question: "Why not just set up Indeed email alerts?",
      answer:
        "You can, and if the volume works for you, do. The difference is that an alert sends everything matching your saved search, unranked and unscreened, whereas the digest sends five roles ranked by fit with dormant listings already removed. One is a firehose with a schedule; the other is a shortlist.",
    },
  ],
};

const JOBRIGHT: VsPage = {
  slug: "jobright",
  competitorName: "Jobright",
  footerLabel: "Jobly vs Jobright",
  title: "Jobly vs. Jobright: Which One Should You Actually Use?",
  // Supplied meta title (54 chars) and meta description (156 chars) — used verbatim.
  metaTitle: "Jobly vs. Jobright: Email Digest or Platform? | Jobly",
  metaDescription:
    "Jobright is an AI matching platform with autofill and an apply agent. Jobly emails five scored matches daily. Compared on matching, pricing and delivery.",
  deck: "Jobright is an AI matching platform with autofill and an apply agent. Jobly emails five scored matches daily. Compared on matching, pricing and delivery.",
  published: false,
  lastUpdated: LAST_UPDATED,
  intro: [
    {
      type: "p",
      text: "Jobright is an AI-powered apply engine — matching, resume tailoring, autofill, and an agent that can carry more of the application itself. Jobly is an email-first AI matcher with no autofill and no application step at all. Both use AI to score roles against your profile; they diverge sharply after that score is calculated, which makes them closer to complementary tools than direct competitors for the same job.",
    },
  ],
  comparisonHeading: "Side by side",
  comparison: [
    {
      feature: "What it is",
      jobly: "Email digest of matched roles",
      competitor: "AI matching platform with autofill and an apply agent (Orion)",
    },
    {
      feature: "How it matches",
      jobly: "Profile scored per role — experience, skill and industry fit, with written reasoning",
      competitor:
        "Resume scored against listings from a database of 8M+ roles, with a compatibility score",
    },
    {
      feature: "How you get results",
      jobly: "Five roles by email each morning. Nothing to open",
      competitor: "You open the platform; job alerts available",
    },
    {
      feature: "Applying",
      jobly: "You apply yourself. Deliberately — see below",
      competitor:
        "Chrome autofill extension (100k+ installs) plus an agent that can submit for you",
    },
    {
      feature: "Ghost-job filtering",
      jobly: "Listings screened against activity in the employer's ATS feed (why)",
      competitor: "Not a stated feature",
    },
    {
      feature: "Application tracking",
      jobly: "Tracker with statuses and follow-up reminders",
      competitor: "Within the platform",
    },
    {
      feature: "Free tier",
      jobly: "No free tier — 3-day free trial",
      competitor:
        "Functional, with daily credit caps — roughly one autofill a day, limited resume generation and insider emails",
    },
    {
      feature: "Paid",
      jobly: JOBLY_PRICING,
      competitor:
        "Turbo, reported at $39.99/month, $17.99/week, $89.99/quarter, ~$20/month billed annually (September 2026). Raised from $29.99 in early 2026",
    },
    {
      feature: "Pricing page",
      jobly: "Public",
      competitor: "None public — jobright.ai/pricing returns 404; prices appear in-app after signup",
    },
    {
      feature: "Coverage",
      jobly: "US and remote tech — engineering, product, design, data",
      competitor: "US tech",
    },
  ],
  body: [
    { type: "h2", text: "Who Jobright is better for" },
    { type: "p", text: "Jobright does two things well that Jobly doesn't do at all." },
    {
      type: "p",
      text: "If your bottleneck is applying, not finding. The Chrome autofill extension has over 100,000 installs and it removes the genuinely miserable part of the process — retyping the same work history into a Workday form for the ninth time. If you're sending twenty applications a week, that's hours back. Jobly has nothing equivalent.",
    },
    {
      type: "p",
      text: "If you want volume with assistance. Jobright's paid tier is built for a high-throughput search: unlimited autofill, resume tailoring per listing, insider-contact emails, and a live career coach session with a senior recruiter. If your strategy is to apply widely and fast, that bundle is coherent.",
    },
    {
      type: "p",
      text: "If you want to test the matching for free first. The free tier is a real trial rather than a locked demo — you can see how the compatibility score behaves on your own resume before deciding anything. That's a fair way to sell software.",
    },
    {
      type: "p",
      text: "Two things to know before you pay, stated as facts rather than opinions: Jobright has no public pricing page — jobright.ai/pricing returns a 404 and prices appear only in-app after you've created an account — and the Turbo monthly rate rose from $29.99 to $39.99 in early 2026. Reviewers also describe the apply agent as closer to assisted autofill than the autonomous applying the marketing suggests, and billing, cancellation and refund issues are the dominant theme in its one-star reviews despite a high overall rating. None of that makes the matching worse. It's just worth knowing what you're signing up to.",
    },
    { type: "h2", text: "Who Jobly is better for" },
    {
      type: "p",
      text: "If you don't want to open another platform. This is the whole difference. Jobright moved the filtering into software but kept the visit — the matches wait for you on a dashboard. Jobly's digest arrives in your inbox at the same time every morning, whether or not you had it in you to log in. A search that depends on your motivation stalls exactly when you need it not to.",
    },
    {
      type: "p",
      text: "If you want fewer, better roles rather than more of them. Five a day, ranked, with a written explanation of what matched and what didn't. Jobright is optimised for throughput; Jobly is optimised for the decision.",
    },
    {
      type: "p",
      text: "If you'd rather not have software applying in your name. Jobly doesn't auto-apply, and that's a design choice, not a missing feature. Applications submitted at volume on your behalf go out to the exact companies you care about most, with your name on them. Auto-apply tools trade your reputation for your time. We think the trade is bad, and we'd rather narrow the list so you don't need it.",
    },
    {
      type: "p",
      text: "If you want dormant listings removed before you see them. Jobright matches against an aggregated database of 8M+ listings. Aggregation inherits whatever the source leaves up, and credible estimates put ghost jobs between one in seven and one in three of all postings. Jobly checks whether a role is still moving inside the employer's hiring system first.",
    },
    { type: "p", text: "If you want to know the price before you sign up. Ours is on the pricing page." },
    { type: "h2", text: "If you're switching" },
    {
      type: "p",
      text: "This is the closest switch in the set, so the practical differences matter more than the positioning.",
    },
    {
      type: "p",
      text: "Profile setup works differently. Jobright starts from your resume. Jobly starts from a profile you fill in — role, stack, seniority, location, salary range — which takes a few minutes and gives you direct control over what's being matched. If your resume undersells part of your stack, that difference works in your favour.",
    },
    {
      type: "p",
      text: "Keep the autofill extension if you liked it. Nothing about using Jobly stops you installing Jobright's Chrome extension, and it's on the free tier. The digest decides what's worth applying to; the extension makes the form faster. That's a reasonable stack.",
    },
    {
      type: "p",
      text: "Volume drops on purpose. Jobright is built to increase throughput. Five roles a day is fewer than its dashboard will show you, and the adjustment period is real. The thing to watch isn't the count, it's whether the reasoning under each score tells you something you'd have had to work out yourself.",
    },
    {
      type: "p",
      text: "Check your billing before you leave. Jobright bills weekly, monthly or quarterly with no public pricing page, and cancellation and renewal issues are the dominant theme in its negative reviews. Cancel in-app and confirm you've got a confirmation, rather than assuming an uninstall ends the subscription.",
    },
  ],
  faq: [
    {
      question: "Is Jobly cheaper than Jobright?",
      answer:
        "Jobly Pro is $16.99 a month, or $10.99 a month on the six-month plan (Watch, the weekly digest, starts at $2.92 a month), against Jobright Turbo at a reported $39.99 a month (checked September 2026; see jobright.ai for the current figure). Jobright has a free tier; Jobly has a 3-day free trial. Both are worth trying before either paid plan. The larger difference is what you're buying: Jobright's paid tier is a volume-applying bundle, Jobly's is curation and delivery. If you want unlimited autofill and a career coach, price isn't the deciding factor.",
    },
    {
      question: "Can I use Jobly and Jobright together?",
      answer:
        "Yes, and the combination is coherent: let the digest decide what's worth applying to, and use Jobright's autofill extension to make the applications themselves faster. They sit at different stages.",
    },
    {
      question: "Does Jobly apply to jobs for me?",
      answer:
        "No. You get the shortlist and the reasoning; you decide and you submit. If hands-off applying is what you want, Jobright's agent is closer to it than anything Jobly will offer.",
    },
    {
      question: "Which one has better matching?",
      answer:
        "Honestly, we can't score that for you, and any comparison page claiming otherwise is guessing. Jobright's matching is well regarded. The difference we'd stand behind isn't accuracy, it's shape: five scored roles delivered to you, versus a ranked list on a dashboard you open. Try Jobright's free tier and Jobly's trial, and see which one you actually use.",
    },
  ],
};

const SIMPLIFY: VsPage = {
  slug: "simplify",
  competitorName: "Simplify",
  footerLabel: "Jobly vs Simplify",
  title: "Jobly vs. Simplify: Which One Should You Actually Use?",
  // Supplied meta title (55 chars) and meta description (154 chars) — used verbatim.
  metaTitle: "Jobly vs. Simplify: Find Roles or Apply Faster? | Jobly",
  metaDescription:
    "Simplify autofills applications you've already found. Jobly emails five scored matches a day. Different stages of the search — compared, and paired.",
  deck: "Simplify autofills applications you've already found. Jobly emails five scored matches a day. Different stages of the search — compared, and paired.",
  published: false,
  lastUpdated: LAST_UPDATED,
  intro: [
    {
      type: "p",
      text: "Simplify is an autofill and application-tracking assistant — it speeds up applications you've already decided to submit. Jobly is an email-first AI matcher that decides which roles are worth submitting an application to in the first place. Neither replaces the other; they sit at different points in the same process and solve almost entirely different problems, which makes them closer to complementary tools than direct competitors.",
    },
  ],
  comparisonHeading: "Side by side",
  comparison: [
    {
      feature: "What it is",
      jobly: "Email digest of matched roles",
      competitor: "Autofill extension with a matches board and application tracker",
    },
    {
      feature: "Core function",
      jobly: "Finds and scores roles, delivers five a day",
      competitor: "Fills application forms across ATS platforms in one click",
    },
    {
      feature: "Auto-apply?",
      jobly: "No, by design",
      competitor: "No — despite the AI-agent framing, you still click submit yourself",
    },
    {
      feature: "How it matches",
      jobly: "Match score per role — experience, skill and industry fit, with written reasoning",
      competitor: "A matches board inside the product, alongside the autofill workflow",
    },
    {
      feature: "Delivery",
      jobly: "Email, every morning",
      competitor: "In-browser; you open the board",
    },
    {
      feature: "Ghost-job filtering",
      jobly: "Listings screened against activity in the employer's ATS feed (why)",
      competitor: "Not a stated feature",
    },
    {
      feature: "Application tracking",
      jobly: "Yes, with statuses and follow-up reminders",
      competitor: "Yes, in the free tier",
    },
    {
      feature: "Free tier",
      jobly: "No free tier — 3-day free trial",
      competitor: "Genuinely free and uncapped: autofill, matches board, tracker. No card",
    },
    {
      feature: "Paid",
      jobly: JOBLY_PRICING,
      competitor:
        "Simplify+: $19.99/week, $39.99/month, $89.99/3 months (checked September 2026; no public pricing page, prices shown in-app; no free trial)",
    },
    {
      feature: "Paid adds",
      jobly:
        "Nothing is held back behind a higher tier: every plan includes the scored digest, ghost-job filtering and the tracker",
      competitor: "AI resume tailoring, AI cover letters, networking tools",
    },
    {
      feature: "Coverage",
      jobly: "US and remote tech",
      competitor: "Broad; autofill strongest on startup and tech ATS",
    },
  ],
  body: [
    { type: "h2", text: "Who Simplify is better for" },
    {
      type: "p",
      text: "Simplify solves a real problem and its free tier is one of the better deals in this category.",
    },
    {
      type: "p",
      text: "If you're applying at volume and the forms are the pain. Autofill accuracy is reported at roughly 85–90% on Greenhouse, Lever and Ashby — the systems most tech companies use. Across twenty applications a week, that's hours you get back. Jobly does nothing for this.",
    },
    {
      type: "p",
      text: "If you want a tracker without paying. The free tier includes the application tracker, uncapped, with no card required. That's unusually generous, and worth saying plainly.",
    },
    {
      type: "p",
      text: "If you already know where you're applying. If your list comes from your network, a specific set of target companies, or your own research, discovery isn't your bottleneck. Simplify speeds up what you were going to do anyway.",
    },
    {
      type: "p",
      text: "Worth knowing before upgrading, as facts: Simplify has no public pricing page — simplify.jobs/pricing returns a 404 and prices appear in-app — there's no free trial, and its terms since May 2026 state that once a subscription activates all payments are non-refundable, with dissatisfaction with AI output explicitly excluded from refunds. The $19.99 weekly plan annualises to over a thousand dollars. Also note that autofill accuracy drops sharply outside startup ATS: around 70% on Workday, lower on iCIMS and Taleo, and effectively unsupported on government forms.",
    },
    { type: "h2", text: "Who Jobly is better for" },
    {
      type: "p",
      text: "If your problem is the list, not the forms. Autofill makes each application cheaper. It doesn't tell you which applications are worth making, and when the list is long and unranked, cheaper applications mostly means more of them. The daily digest is five roles a morning with a score and the reasoning attached.",
    },
    {
      type: "p",
      text: "If you don't want to open anything. Simplify's board, like every board, waits for you to visit. The digest arrives at the same time every day whether or not you're in the mood for a job search. That difference matters most in the fourth week, which is also when it matters most.",
    },
    {
      type: "p",
      text: "If you want dormant listings gone before you see them. Filling in a form quickly for a role that was filled two months ago is fast, not useful. Ghost jobs run somewhere between one in seven and one in three of all postings by credible estimates. Jobly checks whether a role is still moving in the employer's hiring system before it reaches your inbox.",
    },
    {
      type: "p",
      text: "If the reasoning is what you're missing. Jobly gives you an 82% and the split behind it: strong on experience, one gap in the stack, adjacent industry. Enough to decide in ten seconds whether to spend an evening on it.",
    },
    {
      type: "p",
      text: "Honestly, though: these two stack. If you're going to run one of each, the pairing makes sense — Jobly decides what's worth applying to, Simplify makes applying to it faster. We'd rather say that than pretend you have to choose.",
    },
    { type: "h2", text: "If you're switching" },
    {
      type: "p",
      text: "You probably shouldn't switch. This is the one pairing in the set where running both is the obvious answer, so the practical question is how to run them without duplication.",
    },
    {
      type: "p",
      text: "Pick one tracker and commit. Both products have one. Two trackers means two sets of statuses drifting apart until neither is trustworthy, which is worse than having none. If you're already living in Simplify's, keep it. If you're starting fresh, Jobly's has follow-up reminders attached to the same profile that generates your matches.",
    },
    {
      type: "p",
      text: "Let each tool own its stage. Discovery is the digest. Forms are the extension. If you find yourself browsing Simplify's matches board as well as reading the digest, you've re-created the daily-check habit the digest exists to remove.",
    },
    {
      type: "p",
      text: "You may not need Simplify+. The autofill workflow — the part most people came for — is free and uncapped. The paid tier adds resume tailoring and cover letters. Given there's no free trial and payments are non-refundable once activated, that's a decision worth making slowly.",
    },
    {
      type: "p",
      text: "Watch where autofill breaks. Accuracy drops on Workday and falls further on iCIMS and Taleo. If your target companies run those, the time saving is smaller than the headline suggests, and the case for volume applying weakens with it.",
    },
  ],
  faq: [
    {
      question: "Is Jobly cheaper than Simplify?",
      answer:
        "Simplify's core product is free and uncapped, so on the free tier it's cheaper than anything. On paid, Jobly Pro is $16.99 a month, or $10.99 a month on the six-month plan (Watch, the weekly digest, starts at $2.92 a month), against Simplify+ at $39.99 a month (checked September 2026) — but they buy different things, so the comparison isn't very meaningful. Simplify+ adds resume and cover-letter generation on top of a free autofill workflow; Jobly's paid tier is about what reaches you in the first place.",
    },
    {
      question: "Can I use Jobly and Simplify together?",
      answer:
        "Yes, and it's the combination we'd suggest if you want both. The digest handles discovery, the extension handles the forms. No overlap to manage except the tracker — pick one and stick with it, or the statuses drift out of sync.",
    },
    {
      question: "Does Simplify apply to jobs for me?",
      answer:
        "No. Despite the AI-agent framing, Simplify fills the form and you press submit. Neither product auto-applies on your behalf.",
    },
    {
      question: "Does Jobly have a browser extension?",
      answer:
        "No. Jobly runs on a profile you set once and an email that arrives each morning — there's nothing to install and nothing to keep open in a tab. If you want autofill, that's Simplify's job and it does it well.",
    },
    {
      question: "Do I still need Simplify if I'm using Jobly?",
      answer:
        "If you're applying to a handful of carefully chosen roles a week, probably not — five forms is not the bottleneck. If you're applying at volume, the extension pays for itself in time, and it's free.",
    },
  ],
};

const CAREERFLOW: VsPage = {
  slug: "careerflow",
  competitorName: "Careerflow",
  footerLabel: "Jobly vs Careerflow",
  title: "Jobly vs. Careerflow: Which One Should You Actually Use?",
  // Supplied meta title (53 chars) and meta description (153 chars) — used verbatim.
  metaTitle: "Jobly vs. Careerflow: Get Found or Get Matched? | Jobly",
  metaDescription:
    "Careerflow improves how you look to employers. Jobly decides which roles reach you. Compared on matching, tracking, pricing and what each is actually for.",
  deck: "Careerflow improves how you look to employers. Jobly decides which roles reach you. Compared on matching, tracking, pricing and what each is actually for.",
  published: false,
  lastUpdated: LAST_UPDATED,
  intro: [
    {
      type: "p",
      text: "Careerflow is a preparation-and-organization hub — LinkedIn profile scoring, a resume builder, a Kanban-style tracker. Jobly is an email-first AI matcher with none of that: no profile tools, no tracker, just a daily decision about what's worth applying to. They barely overlap, even though both get filed under \u201cjob search tools\u201d — one helps you present yourself and stay organized, the other narrows down what you're applying to in the first place.",
    },
  ],
  comparisonHeading: "Side by side",
  comparison: [
    {
      feature: "What it is",
      jobly: "Email digest of matched roles",
      competitor: "Job-search workspace: resume, LinkedIn, tracking, interview prep",
    },
    {
      feature: "Core function",
      jobly: "Find and score roles, deliver five a day",
      competitor: "Improve your materials and organise the search",
    },
    {
      feature: "Job discovery",
      jobly: "The whole product",
      competitor: "Not the core of the product",
    },
    {
      feature: "How it matches",
      jobly: "Match score per role: experience, skill and industry fit, with written reasoning",
      competitor: "—",
    },
    {
      feature: "Delivery",
      jobly: "Email, every morning",
      competitor: "In-app; you open the workspace",
    },
    {
      feature: "Ghost-job filtering",
      jobly: "Listings screened against activity in the employer's ATS feed (why)",
      competitor: "Not a stated feature",
    },
    {
      feature: "Application tracking",
      jobly: "Yes, with statuses and follow-up reminders",
      competitor: "Yes — capped at 10 tracked jobs on free",
    },
    {
      feature: "Resume tools",
      jobly: "None",
      competitor: "Builder, ATS scoring, one-click optimiser, cover letters",
    },
    {
      feature: "LinkedIn optimisation",
      jobly: "None",
      competitor: "Yes — a signature feature",
    },
    {
      feature: "Interview prep",
      jobly: "None",
      competitor: "AI mock interviews on Premium Plus",
    },
    {
      feature: "Free tier",
      jobly: "No free tier — 3-day free trial",
      competitor:
        "Real, no card: LinkedIn optimiser, basic resume builder with ATS scoring, autofill, 1 resume, 10 tracked jobs",
    },
    {
      feature: "Paid",
      jobly: JOBLY_PRICING,
      competitor:
        "Premium $23.99/month ($172.99/year); Premium Plus $44.99/month ($299.99/year). Auto-renews",
    },
    {
      feature: "Coverage",
      jobly: "US and remote tech",
      competitor: "Broad",
    },
  ],
  body: [
    { type: "h2", text: "Who Careerflow is better for" },
    {
      type: "p",
      text: "Careerflow covers ground Jobly doesn't touch, and for some searches that ground is the actual problem.",
    },
    {
      type: "p",
      text: "If you're getting matched but not getting replies. If roles are reaching you and applications aren't converting, the bottleneck is your materials, not your discovery. A better resume and a stronger LinkedIn profile will do more for that than a better shortlist. Jobly has nothing to offer here.",
    },
    {
      type: "p",
      text: "If your next role comes through recruiter inbound. LinkedIn profile optimisation exists because recruiters search LinkedIn. If that's a live channel for you, improving how you appear in it is direct work on the outcome.",
    },
    {
      type: "p",
      text: "If you want one place for everything. Resume, cover letters, tracker, interview practice, browser tools — Careerflow's breadth is the point. Jobly is deliberately one thing.",
    },
    {
      type: "p",
      text: "If you're preparing rather than searching. Between roles, tightening the materials before going out, or getting ready for interviews already booked — that's a preparation phase, and a daily digest of new roles isn't what it needs.",
    },
    {
      type: "p",
      text: "Two practical notes: Careerflow's free plan is real and needs no card, but it caps you at one resume and ten tracked jobs, so an active search hits the wall quickly. Paid plans auto-renew, and Careerflow's own pages have disagreed on the free resume limit — check the current terms at signup rather than trusting any third-party summary, including this one.",
    },
    { type: "h2", text: "Who Jobly is better for" },
    {
      type: "p",
      text: "If the problem is finding roles, not presenting yourself. A polished resume doesn't help if the roles you're sending it to were never a good fit — or were never real. The daily digest does the finding: five roles a morning, scored, with the reasoning attached.",
    },
    {
      type: "p",
      text: "If you want it to happen without you. Careerflow is a workspace, which means it works when you open it. The digest arrives whether you open anything or not. For discovery specifically, that difference compounds over a long search.",
    },
    {
      type: "p",
      text: "If you're tracking more than ten applications. Careerflow's free tracker caps at ten. Jobly's tracker is included with every plan and covers your applications with statuses and follow-up reminders. If tracking is most of what you want from Careerflow's free tier, that cap is the thing to check first.",
    },
    {
      type: "p",
      text: "If you want stale listings filtered out. Ghost jobs run somewhere between one in seven and one in three of all postings by credible estimates. Jobly checks whether a role is still moving in the employer's hiring system before it reaches you. A resume optimiser, however good, can't tell you the job isn't real.",
    },
    {
      type: "p",
      text: "If you're in US or remote tech. Engineering, product, design and data are what Jobly is tuned for. Careerflow is built to work for everyone, which is an advantage outside that set and a cost inside it.",
    },
    { type: "h2", text: "If you're switching" },
    {
      type: "p",
      text: "These solve different problems, so the honest framing isn't switching — it's sequencing. Most searches need both, just not at the same time.",
    },
    {
      type: "p",
      text: "Do the Careerflow work first, if your materials need it. A stronger resume and a tightened LinkedIn profile improve every application you send afterwards. Fixing discovery before fixing conversion means better roles hitting a weaker application.",
    },
    {
      type: "p",
      text: "Then let discovery run in the background. Once the materials are done, the ongoing work is finding roles, and that's the part that doesn't need a workspace open. The digest arrives; you read five things; you apply to the ones worth it.",
    },
    {
      type: "p",
      text: "Settle the tracker question. Careerflow's free plan caps at ten tracked jobs, which an active search passes in a fortnight. If you were about to upgrade to Premium mainly to lift that cap, check what Jobly's tracker covers first — it may be the cheaper answer to that specific problem.",
    },
    {
      type: "p",
      text: "Don't expect Jobly to touch your resume. It reads your profile to match you; it doesn't rewrite anything, score your ATS compatibility or tell you how you look to a recruiter. If those were the features you valued, keep Careerflow. Nothing here replaces them.",
    },
  ],
  faq: [
    {
      question: "Is Jobly cheaper than Careerflow?",
      answer:
        "Jobly Pro is $16.99 a month, or $10.99 a month on the six-month plan (Watch, the weekly digest, starts at $2.92 a month), against Careerflow Premium at $23.99 and Premium Plus at $44.99 (checked September 2026; see careerflow.ai/pricing for the current figure). Careerflow has a free plan; Jobly has a 3-day free trial. They aren't substitutes though — Careerflow's paid tiers buy resume and interview tooling, Jobly's buys discovery and delivery.",
    },
    {
      question: "Can I use Jobly and Careerflow together?",
      answer:
        "Yes, and they pair cleanly: Careerflow to sharpen your resume and LinkedIn profile, Jobly to decide which roles are worth sending them to. The one thing to settle is which tracker you'll actually update — running two guarantees neither stays accurate.",
    },
    {
      question: "Does Jobly optimise my resume or LinkedIn profile?",
      answer:
        "No. Jobly reads your profile to match you to roles; it doesn't rewrite anything or score how you look to recruiters. If that's your bottleneck, Careerflow is built for it and Jobly isn't.",
    },
    {
      question: "Which one should I start with?",
      answer:
        "Depends where the search is breaking. If roles are reaching you and applications aren't converting, start with Careerflow — that's a materials problem. If you're spending your evenings hunting for roles worth applying to at all, start with Jobly. Careerflow has a free plan and Jobly has a free trial, so the honest answer is to try the one matching your actual bottleneck and add the other only if you still need it.",
    },
    {
      question: "Does Careerflow send me job matches?",
      answer:
        "It's not the core of the product. Careerflow's centre of gravity is preparation and organisation — materials, optimisation, tracking. Discovery is what Jobly does.",
    },
  ],
};

const SONARA: VsPage = {
  slug: "sonara",
  competitorName: "Sonara",
  footerLabel: "Jobly vs Sonara",
  title: "Jobly vs. Sonara: Which One Should You Actually Use?",
  // Supplied meta title (52 chars) and meta description (157 chars) — used verbatim.
  metaTitle: "Jobly vs. Sonara: Auto-Apply or Curated Matches? | Jobly",
  metaDescription:
    "Sonara auto-applies to jobs for you. Jobly sends five scored matches a day and leaves the applying to you.",
  deck: "Sonara auto-applies to jobs for you. Jobly sends five scored matches a day and leaves the applying to you.",
  published: false,
  lastUpdated: LAST_UPDATED,
  intro: [
    {
      type: "p",
      text: "Sonara is an auto-apply agent — it finds matches and submits applications on your behalf, aiming for volume. Jobly is an email-first AI matcher that stops at the shortlist: it decides what's worth your attention and leaves the decision to apply, and the application itself, with you. Both use continuous AI matching; they diverge completely on what happens after a match is found, which makes the choice between them less about which finds better roles and more about how much control you want over what gets submitted under your name.",
    },
    {
      type: "p",
      text: "Sonara details as reported by third-party sources, September 2026 — no source we found could verify pricing at checkout.",
    },
  ],
  comparisonHeading: "Side by side",
  comparison: [
    {
      feature: "What it is",
      jobly: "Email digest of matched roles",
      competitor: "Auto-apply service — matches you to roles and submits applications for you",
    },
    { feature: "Who applies", jobly: "You", competitor: "The software, in your name" },
    {
      feature: "How it matches",
      jobly: "Match score per role: experience, skill and industry fit, with written reasoning",
      competitor: "Resume against listings aggregated from job boards",
    },
    {
      feature: "What you receive",
      jobly: "Five roles a morning, ranked, with the reasoning",
      competitor: "Applications submitted; volume is the goal",
    },
    {
      feature: "Ghost-job filtering",
      jobly: "Listings screened against activity in the employer's ATS feed (why)",
      competitor: "Not a stated feature",
    },
    {
      feature: "Application tracking",
      jobly: "Tracker with statuses and follow-up reminders",
      competitor: "In-platform",
    },
    {
      feature: "Free tier",
      jobly: "No free tier — 3-day free trial",
      competitor: "None reported",
    },
    {
      feature: "Paid",
      jobly: JOBLY_PRICING,
      competitor:
        "Reported $2.95 trial renewing to $23.95 every four weeks, or roughly $71.40 annually; other sources report $19.99–$79.99 tiers. Unverified at checkout",
    },
    { feature: "Ownership", jobly: "Independent", competitor: "BOLD, since 2024" },
    { feature: "Coverage", jobly: "US and remote tech", competitor: "Broad" },
  ],
  body: [
    { type: "h2", text: "Who Sonara is better for" },
    {
      type: "p",
      text: "There's a real case for auto-apply, and it isn't worth pretending otherwise.",
    },
    {
      type: "p",
      text: "If your search is a numbers game and you accept that. Some searches genuinely are — early-career roles, high-turnover categories, markets where response rates are so low that volume is the only lever you have. If you're sending a hundred applications because that's what it takes, doing it by hand is a poor use of a month.",
    },
    {
      type: "p",
      text: "If you have no time at all. Someone working full time with a commute and family obligations does not have ten hours a week for applications. Automated submission converts hours into money, which is a reasonable trade to want.",
    },
    {
      type: "p",
      text: "If you don't have specific target companies. Auto-apply costs you least when there's no shortlist of employers you'd be upset to burn.",
    },
    {
      type: "p",
      text: "That last point is the honest limit of the case. Applications submitted at volume in your name go to real companies, some of which you'll care about later. That's the trade, and only you can price it.",
    },
    { type: "h2", text: "Who Jobly is better for" },
    {
      type: "p",
      text: "If you'd rather not have software applying in your name. Jobly doesn't auto-apply, and it isn't a feature we've been slow to build. An automated application is still an application from you — badly targeted, formulaic, and permanently attached to your name at that company. Recruiters recognise the pattern. We'd rather cut the list down so hard that applying by hand is easy.",
    },
    {
      type: "p",
      text: "If your problem is targeting, not throughput. For a mid-level engineer, product manager or designer in the US market, sending more applications rarely fixes a search. Sending better ones does. The digest is five roles with a score and the reasoning, so you can tell in ten seconds which are worth an evening.",
    },
    {
      type: "p",
      text: "If you want the dead listings filtered out first. Auto-applying to a role that was filled two months ago is a fast way to do nothing. Ghost jobs run between one in seven and one in three of all postings by credible estimates. Jobly checks whether the role is still moving in the employer's hiring system before it reaches you.",
    },
    {
      type: "p",
      text: "If continuity matters to you. Your profile, matches and tracker history stay put. When you find a role, you pause the digest in one click and everything stays where it is — so if you're looking again in two years, you switch it back on rather than starting over.",
    },
    { type: "h2", text: "If you're switching" },
    {
      type: "p",
      text: "The adjustment here is mental more than technical, and it catches people out.",
    },
    {
      type: "p",
      text: "Your application count will collapse. From dozens a week to a handful. If you've been measuring progress by submissions, the first fortnight will feel like going backwards. The number to watch instead is replies per application — that's the ratio auto-apply suppresses and the one that determines whether a search ends.",
    },
    {
      type: "p",
      text: "You'll be writing applications again. Not many, but real ones. Five roles a day with the reasoning attached is a list you can act on deliberately; that only pays off if you actually tailor what you send.",
    },
    {
      type: "p",
      text: "Export anything you still have. If your Sonara account is live, pull your application history out now rather than later. The 2024 shutdown locked people out mid-search with no export path, and that's a lesson worth applying to any tool you depend on, ours included.",
    },
    {
      type: "p",
      text: "Set the profile carefully. Auto-apply tools work off a resume and a broad preference range because breadth is the strategy. Matching works the other way — a precise profile, including a salary range you'd actually accept, produces a better five than a wide one does.",
    },
  ],
  faq: [
    {
      question: "Is Jobly cheaper than Sonara?",
      answer:
        "Jobly Pro is $16.99 a month, or $10.99 a month on the six-month plan (Watch, the weekly digest, starts at $2.92 a month). Sonara's pricing is reported at a $2.95 trial renewing to $23.95 every four weeks, though no source we found could verify that at checkout and other trackers list different tiers. Check the current price yourself. Jobly has a 3-day free trial; Sonara has no reported free plan.",
    },
    {
      question: "Can I use Jobly and Sonara together?",
      answer:
        "Technically nothing stops you, but the strategies conflict. One narrows your list so each application can be deliberate; the other maximises submissions. Running both means auto-applying to the roles you were about to consider carefully.",
    },
    {
      question: "Does Jobly apply to jobs for me?",
      answer:
        "No, by design. You get five scored roles and the reasoning behind each. The decision and the submission stay yours.",
    },
    {
      question: "Doesn't applying to more jobs mean more interviews?",
      answer:
        "Up to a point, and then it stops. Generic applications submitted at volume convert far worse per application than targeted ones, and recruiters at the companies you most want to work for recognise the pattern. The maths only favours volume when your response rate is already near zero and every application is equally weak. If you're a mid-level engineer, PM or designer in the US market, that's usually not your situation.",
    },
  ],
};

const GLASSDOOR: VsPage = {
  slug: "glassdoor",
  competitorName: "Glassdoor",
  footerLabel: "Jobly vs Glassdoor",
  title: "Jobly vs. Glassdoor: Research or Find Roles?",
  // Supplied meta title (52 chars) and meta description (153 chars) — used verbatim.
  metaTitle: "Jobly vs. Glassdoor: Research or Find Roles? | Jobly",
  metaDescription:
    "Glassdoor is where you research a company before applying. Jobly finds the roles and emails five a day. What each one is actually for, compared honestly.",
  deck: "Glassdoor is where you research a company before applying. Jobly finds the roles and emails five a day. What each one is actually for, compared honestly.",
  published: false,
  lastUpdated: LAST_UPDATED,
  intro: [
    {
      type: "p",
      text: "Glassdoor is a research tool that also lists jobs. Jobly is a matching service that sends you five roles a morning. Most people who compare them aren't really choosing — they use Glassdoor to decide whether a company is worth working for, and something else to find the roles in the first place.",
    },
    { type: "p", text: "That's the honest shape of it, and it's worth saying plainly before the table." },
  ],
  comparisonHeading: "Side by side",
  comparison: [
    {
      feature: "What it is",
      competitor: "Company reviews, salary data and interview reports, with a job board attached",
      jobly: "Email digest of matched roles",
    },
    {
      feature: "Primary use",
      competitor: "Researching a company you're already considering",
      jobly: "Finding roles worth considering",
    },
    {
      feature: "How it matches",
      competitor: "Search and recommendations; no candidate-side fit score",
      jobly:
        "Match score per role — experience, skill and industry fit — with written reasoning",
    },
    {
      feature: "What it knows that Jobly doesn't",
      competitor: "Employee reviews, reported salaries, interview questions, ratings by department",
      jobly: "—",
    },
    {
      feature: "Delivery",
      competitor: "You visit the site; email alerts by saved search",
      jobly: "Five roles by email each morning",
    },
    {
      feature: "Ghost-job filtering",
      competitor: "Not a stated feature",
      jobly: "Listings screened against activity in the employer's ATS feed (why)",
    },
    {
      feature: "Cost to job seekers",
      competitor: "Free — employers pay",
      jobly: `${JOBLY_PRICING}. No free tier — 3-day free trial`,
    },
    {
      feature: "Coverage",
      competitor: "Global, every industry",
      jobly: "US and remote tech",
    },
  ],
  body: [
    { type: "h2", text: "Who Glassdoor is better for" },
    {
      type: "p",
      text: "Glassdoor holds a dataset nobody else has at that scale, and it answers questions Jobly can't touch.",
    },
    {
      type: "p",
      text: "If you want to know what it's like inside. Reviews from people who worked there, broken down by team and tenure, are the closest thing to a straight answer about management, workload and culture that you'll get before an offer. No match score measures any of that — a point worth remembering when a role scores 90% and still isn't right.",
    },
    {
      type: "p",
      text: "If you're negotiating. Reported salary ranges by title, level and location give you a number to anchor against. That's the single most valuable free thing on the site.",
    },
    {
      type: "p",
      text: "If you're preparing for an interview. Interview reports from candidates who went through the same process are practical prep material — often including the actual questions, the format and how many rounds to expect, which is information the company itself rarely publishes.",
    },
    {
      type: "p",
      text: "If you're researching one specific company. When you already know where you want to work, Glassdoor is the tool and Jobly isn't — Jobly sends you roles, not dossiers.",
    },
    {
      type: "p",
      text: "The usual caveat about reviews applies and it isn't Glassdoor's fault: people write reviews when something goes very well or very badly, so the middle is underrepresented. Read the volume and the pattern rather than the extremes, and check the dates — a company two years and one management change ago may not be the company you'd be joining.",
    },
    { type: "h2", text: "Who Jobly is better for" },
    {
      type: "p",
      text: "If your problem is finding roles, not vetting them. Glassdoor is where you go once you have a name. It doesn't help you get the names. The digest does exactly that: five roles a morning, scored, with the reasoning attached.",
    },
    {
      type: "p",
      text: "If you want to know why a role fits you. Glassdoor tells you what other people think of the company. Jobly tells you how the role lines up with your experience, your stack and your industry background. Those are different questions, and you need both — but only one of them narrows a search.",
    },
    {
      type: "p",
      text: "If you keep opening dead listings. Ghost jobs run somewhere between one in seven and one in three of all postings by credible estimates. Glassdoor's board carries what employers publish. Jobly checks whether the role is still moving inside the employer's hiring system before it reaches your inbox.",
    },
    {
      type: "p",
      text: "If you're in US or remote tech. Engineering, product, design and data is Jobly's whole scope. Glassdoor covers everything, which is a genuine advantage outside that set.",
    },
    {
      type: "p",
      text: "One asymmetry worth naming. Glassdoor's data comes from people who already worked somewhere, which makes it retrospective by nature — excellent for evaluating a company, useless for finding one you'd never heard of. Discovery and diligence are separate jobs, and no product does both well.",
    },
    { type: "h2", text: "If you're switching" },
    {
      type: "p",
      text: "You almost certainly shouldn't. These are complements, and the sensible workflow uses both in sequence.",
    },
    {
      type: "p",
      text: "Keep Glassdoor for the second step. A role arrives in your digest with an 84% and a reason. Before you spend an evening on the application, look the company up — reviews, salary range, interview reports. That's twenty minutes that saves a bad process.",
    },
    {
      type: "p",
      text: "Reconsider the job alerts. If you have saved searches emailing you listings, that's the piece a digest replaces. Two sources of unranked and ranked job email in the same inbox means the unranked one wins on volume and loses on attention.",
    },
    {
      type: "p",
      text: "Use the salary data on your Jobly profile. Jobly filters on the range you set. If your number is guesswork, Glassdoor's reported ranges for your title and location are the best free way to set it accurately — and an accurate range materially improves what reaches you.",
    },
    {
      type: "p",
      text: "Don't let a score override a review. If a role matches beautifully and everyone who worked there says the same specific bad thing, believe the reviews. A match score reads a job description; it can't read a management culture.",
    },
  ],
  faq: [
    {
      question: "Is Jobly cheaper than Glassdoor?",
      answer:
        "Glassdoor is free for job seekers — employers pay for it — so on price it wins outright. Jobly Pro is $16.99 a month, or $10.99 a month on the six-month plan (Watch, the weekly digest, starts at $2.92 a month), with a 3-day free trial. What the paid plan buys isn't access to listings, it's the filtering and the delivery.",
    },
    {
      question: "Can I use Jobly and Glassdoor together?",
      answer:
        "That's the intended combination. Jobly surfaces the roles, Glassdoor tells you whether the company behind one is worth your time. Neither replaces the other.",
    },
    {
      question: "Does Jobly show company reviews or salary data?",
      answer:
        "No. Jobly matches roles to your profile and shows you why each one fits. Reviews, ratings and reported salaries aren't something it collects, and Glassdoor's dataset there is not something a matching tool can substitute for.",
    },
    {
      question: "Does Glassdoor match jobs to my profile?",
      answer:
        "It offers search and recommendations, but not a candidate-side fit score explaining how a specific role lines up with your experience. The job board is a secondary product on a site whose centre of gravity is research.",
    },
    {
      question: "Does Jobly check the companies it sends me?",
      answer:
        "It checks the listing, not the company. Jobly screens for whether a role is still active in the employer's hiring system — it doesn't assess culture, management or whether people there are happy. That's the part Glassdoor answers, and it's why the two belong in the same workflow rather than in competition.",
    },
    {
      question: "Should I trust Glassdoor reviews?",
      answer:
        "Read them as a pattern rather than a verdict. Reviews skew toward strong feelings at both ends, so weigh recurring specifics — the same complaint about the same team, repeatedly — more heavily than any single review, and check how recent they are.",
    },
  ],
};

const TEAL: VsPage = {
  slug: "teal",
  competitorName: "Teal",
  footerLabel: "Jobly vs Teal",
  title: "Jobly vs. Teal: Track Applications or Find Them?",
  // Supplied meta title (50 chars) and meta description (154 chars) — used verbatim.
  metaTitle: "Jobly vs. Teal: Track Applications or Find Them?",
  metaDescription:
    "Teal is a job tracker and resume builder with a paywalled match score. Jobly emails five scored matches daily. Compared on matching, pricing and delivery.",
  deck: "Teal is a job tracker and resume builder with a paywalled match score. Jobly emails five scored matches daily. Compared on matching, pricing and delivery.",
  published: false,
  lastUpdated: LAST_UPDATED,
  intro: [
    {
      type: "p",
      text: "Teal is a job tracker with a resume builder attached. You find the roles yourself, clip them into the tracker with a browser extension, tailor a resume against each one, and manage the pipeline from there. Jobly finds the roles and emails you five a morning with a score and the reasoning.",
    },
    {
      type: "p",
      text: "The overlap is narrower than it looks. Teal's centre of gravity is what happens after you've found something worth applying to. Jobly's is the finding.",
    },
  ],
  comparisonHeading: "Side by side",
  comparison: [
    {
      feature: "What it is",
      competitor: "Job tracker, resume builder and Chrome clipper",
      jobly: "Email digest of matched roles",
    },
    {
      feature: "Who finds the roles",
      competitor: "You, browsing job boards",
      jobly: "Jobly, scored against your profile",
    },
    {
      feature: "Match score",
      competitor:
        "Yes — resume against a job description, but the numeric score sits behind Teal+",
      jobly:
        "Yes, on every match, free tier included, split into experience, skill and industry fit",
    },
    { feature: "Delivery", competitor: "You open the app", jobly: "Email, every morning" },
    {
      feature: "Ghost-job filtering",
      competitor: "Not a stated feature",
      jobly: "Listings screened against activity in the employer's ATS feed",
    },
    {
      feature: "Resume tools",
      competitor: "Builder, unlimited versions, AI bullet rewrites, cover letters",
      jobly: "None",
    },
    {
      feature: "Application tracking",
      competitor: "Unlimited on free — one of the most generous free trackers in the category",
      jobly: "Yes, with statuses and follow-up reminders",
    },
    {
      feature: "Free tier",
      competitor:
        "Unlimited resumes, unlimited tracking, Chrome extension across 40+ boards, contact manager",
      jobly: "No free tier — 3-day free trial",
    },
    {
      feature: "Paid",
      competitor: "Teal+ reported at $13/week, $29/month, $79/quarter. No annual plan",
      jobly: JOBLY_PRICING,
    },
    { feature: "Coverage", competitor: "Broad", jobly: "US and remote tech" },
  ],
  body: [
    { type: "h2", text: "Who Teal is better for" },
    {
      type: "p",
      text: "Teal's free tier is one of the genuinely good deals in this category, and that's worth saying before anything else.",
    },
    {
      type: "p",
      text: "If you're managing a lot of applications at once. Unlimited tracking, notes, contacts and follow-up timing, all free, all in one board. If you're running thirty live applications and losing track of who you spoke to when, that's the problem Teal was built for and it solves it well.",
    },
    {
      type: "p",
      text: "If your resume needs work per role. Teal's tailoring workflow — comparing your resume against a specific job description and flagging what's missing — is one of the cleaner implementations around. Jobly does nothing here.",
    },
    {
      type: "p",
      text: "If you clip roles from everywhere. The Chrome extension saves listings from across dozens of boards into one place. If your sources are scattered and you want them consolidated, that's real value at no cost.",
    },
    {
      type: "p",
      text: "Two things to know. The numeric match score — the feature closest to what Jobly does — is behind Teal+, so the free tier gives you the organiser without the optimiser. And Teal bills weekly, monthly or quarterly with no annual plan; reported at $13 a week, that annualises to roughly $676 if a search runs long and you forget to cancel. Prices have been reported inconsistently across review sites through 2026, so check tealhq.com rather than trusting any summary, this one included.",
    },
    { type: "h2", text: "Who Jobly is better for" },
    {
      type: "p",
      text: "If finding roles is the part that's eating your evenings. Teal assumes you've already got a list. If you're the one browsing LinkedIn and Indeed to build that list, the tracker organises work you'd rather not be doing at all. The digestdoes the finding — five roles, ranked, with reasoning.",
    },
    {
      type: "p",
      text: "If you want the score without paying for it. Teal's match score is a Teal+ feature. Jobly's comes with every match, broken into experience, skill and industry fit rather than a single number. If scoring is what drew you to Teal, that's worth comparing directly.",
    },
    {
      type: "p",
      text: "If you'd rather not open another app. Teal is a workspace — it works when you're in it. The digest arrives whether or not you were planning to job-search that day, which matters most in the weeks when you weren't.",
    },
    {
      type: "p",
      text: "If you want stale listings filtered out. Clipping a role into a tracker doesn't tell you whether anyone's hiring behind it. Jobly checks whether the role is still moving in the employer's ATS feed before it reaches you. Teal will happily track a posting that's been dead for two months.",
    },
    {
      type: "p",
      text: "The clipping habit is the tell. If most of your Teal usage is the Chrome extension — saving roles you found somewhere else — then discovery, not organisation, is where your time is actually going. Teal makes that time tidier. It doesn't make it shorter.",
    },
    { type: "h2", text: "If you're switching" },
    {
      type: "p",
      text: "Mostly you wouldn't — these sit at different stages, and running both is coherent.",
    },
    {
      type: "p",
      text: "Decide which tracker you'll actually update. Both have one, and two trackers means neither stays accurate. Teal's is unlimited and free with contacts and notes; Jobly's is tied to the same profile that generates your matches and carries follow-up reminders. Pick on which one you'll open, not which has more fields.",
    },
    {
      type: "p",
      text: "If you were about to buy Teal+ for the match score, pause. That's the overlap. Compare Jobly's free scoring against Teal+'s paid scoring before committing to a weekly subscription.",
    },
    {
      type: "p",
      text: "Keep the resume tooling. Jobly won't rewrite a bullet or generate a cover letter. If that's why you're on Teal, nothing here replaces it.",
    },
    {
      type: "p",
      text: "Expect the clipping habit to fade. If the digest is doing the discovery, the Chrome extension gets used less. That's the intended outcome, not a loss.",
    },
  ],
  faq: [
    {
      question: "Is Jobly cheaper than Teal?",
      answer:
        "Jobly Pro is $16.99 a month, or $10.99 a month on the six-month plan (Watch, the weekly digest, starts at $2.92 a month), with a 3-day free trial, against Teal+ at a reported $29 a month or $13 a week (checked September 2026; see tealhq.com for the current figure). Teal has a free tier and Jobly has a free trial. The sharper comparison is what each one gives you: Teal's free tier covers tracking and resume storage but not the match score, while every Jobly match carries a score with the reasoning attached.",
    },
    {
      question: "Can I use Jobly and Teal together?",
      answer:
        "Yes. Let the digest handle discovery and Teal handle resume tailoring. The only thing to settle is the tracker — running two guarantees both drift.",
    },
    {
      question: "Does Teal send me job matches?",
      answer:
        "Not as a digest. Teal scores roles you've already saved against your resume; it doesn't go out and find new ones for you. That's the structural difference between the two products.",
    },
    {
      question: "Does Jobly build or review my resume?",
      answer:
        "No. It reads your profile to match you to roles and doesn't rewrite anything. If resume work is your bottleneck, Teal is built for it and Jobly isn't.",
    },
    {
      question: "Do I need both if I'm only applying to a few roles a week?",
      answer:
        "Probably not. Teal's tracker earns its place when you're juggling twenty or thirty live applications and losing track of follow-ups; at five a week a notes app would do. Jobly's value doesn't scale the same way — the discovery problem exists whether you're applying to three roles a week or thirty, because you still have to find those three.",
    },
    {
      question: "Which one has a better match score?",
      answer:
        "They measure slightly different things. Teal compares your resume against one job description you chose. Jobly scores roles you haven't seen yet against a profile you maintain, and splits the result into experience, skill and industry fit — more on how that works. Teal answers \u201cshould I apply to this?\u201d Jobly answers \u201cwhich five should I look at today?\u201d",
    },
  ],
};

const WELCOME_TO_THE_JUNGLE: VsPage = {
  slug: "welcome-to-the-jungle",
  competitorName: "Welcome to the Jungle",
  footerLabel: "Jobly vs Welcome to the Jungle",
  title: "Jobly vs. Welcome to the Jungle (Otta) Compared",
  // Supplied meta title (55 chars) and meta description (156 chars) — used verbatim.
  metaTitle: "Jobly vs. Welcome to the Jungle (Otta) Compared | Jobly",
  metaDescription:
    "Welcome to the Jungle, formerly Otta, curates tech roles on a platform you browse. Jobly emails five scored matches daily. Compared on matching and delivery.",
  deck: "Welcome to the Jungle, formerly Otta, curates tech roles on a platform you browse. Jobly emails five scored matches daily. Compared on matching and delivery.",
  published: false,
  lastUpdated: LAST_UPDATED,
  intro: [
    { type: "h2", text: "The real difference" },
    {
      type: "p",
      text: "Welcome to the Jungle is a curated matching platform built around rich company profiles — culture, funding stage, salary transparency, team size — mostly focused on tech and startup roles. Jobly is an email-first AI matcher with no company-culture content and no industry focus at all. Both aim to reduce browsing rather than add to it, but they differ sharply on format and scope: one is an app built around a specific segment of the market, the other is a single daily email that isn't tied to any industry.",
    },
  ],
  comparisonHeading: "Side by side",
  comparison: [
    {
      feature: "What it is",
      competitor: "Curated tech job platform (formerly Otta)",
      jobly: "Email digest of matched roles",
    },
    {
      feature: "How it matches",
      competitor:
        "Preferences you set — role, location, salary, company stage, values — refined by your activity",
      jobly: "Match score per role: experience, skill and industry fit, with written reasoning",
    },
    {
      feature: "Score shown",
      competitor: "No numeric fit score with a breakdown",
      jobly: "Yes, on every match",
    },
    {
      feature: "Delivery",
      competitor: "Web and mobile app you open; no daily shortlist by email",
      jobly: "Five roles by email each morning",
    },
    {
      feature: "Company depth",
      competitor:
        "Substantial — team size, funding stage, salary transparency, photos, video, editorial profiles",
      jobly: "None",
    },
    {
      feature: "Curation",
      competitor: "Companies vetted by their team; won't show the same job twice",
      jobly: "Roles screened for ATS activity; roles you've seen don't return",
    },
    {
      feature: "Ghost-job filtering",
      competitor: "Claims no outdated or duplicate listings; method not published",
      jobly: "Screened against activity in the employer's ATS feed",
    },
    {
      feature: "Application tracking",
      competitor: "Saved and applied lists",
      jobly: "Tracker with statuses and follow-up reminders",
    },
    {
      feature: "Cost",
      competitor: "Free for job seekers",
      jobly: `${JOBLY_PRICING}. No free tier — 3-day free trial`,
    },
    {
      feature: "Coverage",
      competitor: "Tech and startups across US, UK and Europe, plus remote",
      jobly: "US and remote tech",
    },
  ],
  body: [
    { type: "h2", text: "Who Welcome to the Jungle is better for" },
    { type: "p", text: "It's a good product and pretending otherwise would be obvious." },
    {
      type: "p",
      text: "If you're job-searching in Europe or the UK. This is the decisive one. Welcome to the Jungle came out of France, absorbed a British company, and covers London, Berlin, Paris and the rest properly. Jobly is US and remote. If your search is European, the comparison ends here.",
    },
    {
      type: "p",
      text: "If you want to see the company before the job. Rich profiles with photos, video and editorial coverage tell you what a place looks like from the inside before you apply. Jobly has nothing equivalent — a match card is a match card.",
    },
    {
      type: "p",
      text: "If you filter on company traits. Stage, size, values, funding — being able to say \u201cSeries A or earlier, under 200 people\u201d and have that respected is a genuinely different way to search, and it's built in.",
    },
    {
      type: "p",
      text: "If browsing is the part you enjoy. Some people like exploring. The card-based feed is well made for it, and it's free.",
    },
    {
      type: "p",
      text: "Two honest observations. The platform leans hard on employer branding since the acquisition, which is excellent for research and slower if you just want to apply and move on. And mobile app reviews through 2025 and 2026 include recurring complaints about bugs and login problems after updates — worth knowing if the app is how you'd use it.",
    },
    { type: "h2", text: "Who Jobly is better for" },
    {
      type: "p",
      text: "If you don't want to open anything. This is the whole difference. Welcome to the Jungle curated the list, then put it somewhere you have to go. The digest arrives whether you were planning to job-search that day or not — which matters most in the fourth week, when you weren't.",
    },
    {
      type: "p",
      text: "If you want a score and a reason, not just a curated feed. Preference filtering answers \u201cdoes this match what I asked for.\u201d Scoring answers \u201cdoes my actual experience fit this role,\u201d which is a harder question and a more useful one. Jobly gives you the number and the split behind it — how that works.",
    },
    {
      type: "p",
      text: "If five is the right number. A curated feed is still a feed: better than a job board, but you decide when to stop scrolling. Five roles a morning has a defined end.",
    },
    {
      type: "p",
      text: "If you want listing activity checked, not asserted. Welcome to the Jungle says it doesn't show outdated listings, and their vetting is real. But the method isn't published, so you're taking it on trust. Jobly's check is specific and stateable: whether the role is still moving in the employer's ATS feed.",
    },
    {
      type: "p",
      text: "One thing both products agree on. Neither shows you everything. Both decided that filtering is the product's job rather than yours, which puts them on the same side of the argument against LinkedIn and Indeed. What's left to disagree about is how short the list should be and where it should land.",
    },
    { type: "h2", text: "If you're switching" },
    {
      type: "p",
      text: "Check the geography first. If you're searching in Europe or the UK, don't switch. Jobly doesn't cover it and no amount of matching quality compensates for the wrong market.",
    },
    {
      type: "p",
      text: "Expect less company context. If you'd got used to reading a full company profile before applying, Jobly won't give you that. Look the company up separately — the twenty minutes is still worth spending, it just happens somewhere else now.",
    },
    {
      type: "p",
      text: "Set the salary range honestly. Both products filter on it. Welcome to the Jungle trained you to state a minimum; Jobly uses it the same way, and a vague range produces a vague five.",
    },
    {
      type: "p",
      text: "Keep the account. It's free. If your search runs long, there's no cost to letting it sit there for the weeks you want to browse.",
    },
  ],
  faq: [
    {
      question: "Is Jobly cheaper than Welcome to the Jungle?",
      answer:
        "Welcome to the Jungle is free for job seekers, so no. Jobly Pro is $16.99 a month, or $10.99 a month on the six-month plan (Watch, the weekly digest, starts at $2.92 a month), with a 3-day free trial. The paid tier buys scoring, ghost-job filtering and email delivery rather than access to listings.",
    },
    {
      question: "Is Welcome to the Jungle the same as Otta?",
      answer:
        "It's what Otta became. Welcome to the Jungle acquired Otta in 2024 and folded the brand in. The preference-based matching carried over; the surrounding product now emphasises company profiles and employer branding more than Otta did.",
    },
    {
      question: "Can I use both?",
      answer:
        "Yes, and there's a clean split: let the digest handle daily discovery, and use Welcome to the Jungle when you want to research a company properly or browse by company traits Jobly doesn't filter on.",
    },
    {
      question: "Does Welcome to the Jungle email me matches?",
      answer:
        "It has alerts, but not a scored daily shortlist — the product is built around browsing a curated feed on web or mobile. That's the structural difference.",
    },
    {
      question: "Which one is closer to what Otta used to be?",
      answer:
        "Fairly asked, and there isn't a clean answer. Otta's appeal was a curated shortlist of tech roles with no noise and no recruiters — Welcome to the Jungle inherited the matching engine and the vetted company list directly, but wrapped it in a heavier employer-branding layer than Otta had. Jobly inherited nothing, but arrives at a similar place from a different direction: a short list, no feed, no scrolling. If what you missed was the curation, Welcome to the Jungle still has it. If what you missed was how little time it took, that's closer to the digest.",
    },
    {
      question: "Does Jobly cover Europe?",
      answer:
        "No. US and remote tech roles only. If your search is in London, Berlin or Paris, Welcome to the Jungle is the better tool and this comparison doesn't change that.",
    },
  ],
};

const INJOBS: VsPage = {
  slug: "injobs",
  competitorName: "inJobs",
  footerLabel: "Jobly vs inJobs",
  title: "Jobly vs. inJobs: Auto-Apply or Curated Matches?",
  // Supplied meta title (49 chars) and meta description (152 chars) — used verbatim.
  metaTitle: "Jobly vs. inJobs: Auto-Apply or Curated Matches?",
  metaDescription:
    "inJobs scores roles and can submit applications for you. Jobly emails five scored matches daily and leaves the applying to you. An honest comparison.",
  deck: "inJobs scores roles and can submit applications for you. Jobly emails five scored matches daily and leaves the applying to you. An honest comparison.",
  published: false,
  lastUpdated: LAST_UPDATED,
  intro: [
    {
      type: "p",
      text: "inJobs — the product also listed as InJob.AI — builds a profile from your resume and an interactive questionnaire, scans job boards and company career pages, scores what it finds against your profile, writes tailored cover letters and can submit applications on your behalf. Jobly scores roles against a profile you set and emails you five a morning, with the applying left to you.",
    },
    { type: "p", text: "Both score. Only one submits. That's the decision." },
    { type: "h2", text: "A note on sources" },
    {
      type: "p",
      text: "There's very little independent information about inJobs. Its G2 profile carries no reviews, no public pricing page was findable, and it doesn't appear in the 2026 AI job tool roundups we checked. Everything in the table below comes from the company's own product description, which means it reflects what inJobs says it does rather than what anyone has verified it does.",
    },
    {
      type: "p",
      text: "We're saying that rather than presenting it as established fact, and the same standard should apply to us: check anything that matters before paying for either product.",
    },
    {
      type: "p",
      text: "inJobs details from the company's own product description, September 2026. Not independently verified.",
    },
  ],
  comparisonHeading: "Side by side",
  comparison: [
    {
      feature: "What it is",
      competitor: "AI job search and application automation",
      jobly: "Email digest of matched roles",
    },
    {
      feature: "Profile setup",
      competitor: "Resume analysis plus an interactive dialogue",
      jobly: "A profile you fill in: role, stack, seniority, location, salary range",
    },
    {
      feature: "How it matches",
      competitor: "Compatibility scores against listings from boards and career pages",
      jobly: "Match score per role: experience, skill and industry fit, with written reasoning",
    },
    { feature: "Cover letters", competitor: "Generated per application", jobly: "Not offered" },
    {
      feature: "Who applies",
      competitor: "The software, on your behalf, for high-scoring roles",
      jobly: "You",
    },
    { feature: "Delivery", competitor: "Dashboard", jobly: "Email, every morning" },
    {
      feature: "Ghost-job filtering",
      competitor: "Not a stated feature",
      jobly: "Screened against activity in the employer's ATS feed (why)",
    },
    {
      feature: "Tracking",
      competitor: "Application dashboard with statuses and employer responses",
      jobly: "Tracker with statuses and follow-up reminders",
    },
    {
      feature: "Pricing",
      competitor: "Not publicly listed",
      jobly: `${JOBLY_PRICING}. No free tier — 3-day free trial`,
    },
    { feature: "Independent reviews", competitor: "None found", jobly: "—" },
    { feature: "Coverage", competitor: "Not stated", jobly: "US and remote tech" },
  ],
  body: [
    { type: "h2", text: "Who inJobs is better for" },
    {
      type: "p",
      text: "If you want the whole process handled. inJobs covers more of the pipeline than Jobly does — discovery, scoring, cover letter, submission, tracking. If what you want is to hand over a resume and check a dashboard, that's a coherent product and Jobly isn't trying to be it.",
    },
    {
      type: "p",
      text: "If writing cover letters is your bottleneck. Per-application letter generation is real work removed. Jobly doesn't write anything.",
    },
    {
      type: "p",
      text: "If your search is high-volume by necessity. Some searches are a numbers game — early-career roles, saturated categories, markets where response rates are low enough that volume is the only lever. Submitting by hand in that situation is a poor use of a month.",
    },
    {
      type: "p",
      text: "If the interactive profile-building appeals. Building a profile through dialogue rather than a form is a genuinely different approach, and for someone whose resume undersells them it may capture more.",
    },
    {
      type: "p",
      text: "The honest limit: with no independent reviews and no public pricing, you'd be evaluating it entirely on the company's own description. That's not a criticism of the product — every product starts somewhere — but it's a real difference in what you can know before committing a job search to it.",
    },
    { type: "h2", text: "Who Jobly is better for" },
    {
      type: "p",
      text: "If you'd rather software didn't apply in your name. Jobly doesn't auto-apply, by design rather than by omission. Applications submitted at volume go to real companies with your name attached, including the ones you'll care about later. Recruiters recognise generated cover letters. We'd rather cut the list short enough that applying by hand is easy.",
    },
    {
      type: "p",
      text: "If your problem is targeting, not throughput. For a mid-level engineer, PM or designer in the US market, sending more applications rarely fixes a search — sending better ones does. The digest is five roles with a score and the reasoning, so you can tell in ten seconds which deserve an evening.",
    },
    {
      type: "p",
      text: "If you want dead listings filtered first. Auto-applying to a role filled two months ago is a fast way to do nothing. Ghost jobs run between one in seven and one in three of all postings by credible estimates. Jobly checks whether the role is still moving in the employer's hiring system before it reaches you.",
    },
    { type: "p", text: "If you want to know the price before you sign up. Ours is on the pricing page." },
    { type: "h2", text: "How to evaluate a tool you can't find reviews for" },
    {
      type: "p",
      text: "This applies to inJobs and to plenty of others in this category, including products that turn out to be good.",
    },
    {
      type: "p",
      text: "Check whether pricing is public. Not because hidden pricing means a bad product, but because it tells you what the sales model is. A price behind a signup wall means you'll be evaluating the product after handing over your details.",
    },
    {
      type: "p",
      text: "Find the cancellation path before you subscribe. Billing and cancellation complaints dominate the negative reviews of nearly every paid tool in this space. Locate the cancel flow while you're still deciding, not when you want out.",
    },
    {
      type: "p",
      text: "Ask what happens to your data if it shuts down. Job searches run for months. Sonara shut down in 2024 and locked users out of their application queues mid-search with no export path. Whatever a tool holds — applications, history, contacts — assume you'll need to get it out one day.",
    },
    {
      type: "p",
      text: "Test on a search you don't care about first. Especially for anything that applies on your behalf. Auto-submitted applications can't be recalled, and the companies you most want to work for are the worst place to discover a tool's quality.",
    },
    { type: "h2", text: "If you're switching" },
    {
      type: "p",
      text: "Your application count will drop sharply. From whatever volume automation was producing to a handful a week. If you've been measuring progress by submissions, that feels like going backwards. The number that matters is replies per application — the ratio automation suppresses.",
    },
    {
      type: "p",
      text: "Export your application history first. Whatever's in the dashboard, pull it out before you stop paying. This is standard advice for any tool holding months of your job search, and it applies to us too.",
    },
    {
      type: "p",
      text: "Expect to write again. Five roles a day with reasoning attached is a list you can act on deliberately, but that only pays off if you tailor what you send.",
    },
    {
      type: "p",
      text: "Set the profile precisely. Automation tools work off broad preferences because breadth is the strategy. Matching works the other way — a precise profile, including a salary range you'd actually accept, produces a better five than a wide one.",
    },
  ],
  faq: [
    {
      question: "Is Jobly cheaper than inJobs?",
      answer:
        "Unknown — inJobs doesn't publish pricing publicly, so there's nothing to compare against. Jobly Pro is $16.99 a month, or $10.99 a month on the six-month plan (Watch, the weekly digest, starts at $2.92 a month), with a 3-day free trial, all listed on the pricing page.",
    },
    {
      question: "Can I use Jobly and inJobs together?",
      answer:
        "Technically yes, but the strategies conflict. One narrows your list so each application can be deliberate; the other maximises submissions. Running both means auto-applying to roles you were about to consider carefully.",
    },
    {
      question: "Does Jobly write cover letters?",
      answer:
        "No. It matches roles to your profile and explains why each one fits. The writing stays yours, which is the point — a generated letter is recognisable and it's attached to your name.",
    },
    {
      question: "Is inJobs legitimate?",
      answer:
        "We've no reason to think otherwise; it's simply that there's very little independent information about it. Zero reviews isn't a red flag by itself — it's an absence of evidence. Do your own checks before paying, as you would with any tool you're handing a job search to.",
    },
  ],
};

export const VS_PAGES: VsPage[] = [
  LINKEDIN,
  INDEED,
  JOBRIGHT,
  SIMPLIFY,
  CAREERFLOW,
  SONARA,
  GLASSDOOR,
  TEAL,
  WELCOME_TO_THE_JUNGLE,
  INJOBS,
  placeholder("scarlett-ai", "Scarlett AI"),
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
