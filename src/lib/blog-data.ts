import heroAsset from "../assets/hero-2.png.asset.json";
import how1 from "../assets/how_1.png.asset.json";
import how2 from "../assets/how_2.png.asset.json";
import how3 from "../assets/how_3.png.asset.json";
import t1 from "../assets/t1.png.asset.json";
import t2 from "../assets/t2.png.asset.json";
import t3 from "../assets/t3.png.asset.json";
import t12 from "../assets/t1-2.png.asset.json";
import t22 from "../assets/t2-3.png.asset.json";
import t32 from "../assets/t3-2.png.asset.json";

export const BLOG_CATEGORIES = [
  "Job market data",
  "LinkedIn vs reality",
  "Ghost jobs",
  "Success stories",
  "Career tips",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export type ContentBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; title?: string; text: string };

export type BlogPost = {
  slug: string;
  title: string;
  deck: string;
  category: BlogCategory;
  coverImage: string;
  coverAlt: string;
  author: string;
  date: string; // ISO
  readTime: string;
  body: ContentBlock[];
};

const covers = [heroAsset.url, how1.url, how2.url, how3.url, t1.url, t2.url, t3.url, t12.url, t22.url, t32.url];

function sampleBody(topic: string): ContentBlock[] {
  return [
    { type: "p", text: `We looked at what's actually happening in ${topic.toLowerCase()} across the tech job market — cutting through the noise so you can act on real signal, not vibes.` },
    { type: "h2", text: "The short version" },
    { type: "p", text: "Here is what we found after reviewing tens of thousands of listings, candidate submissions, and public disclosures over the past 90 days." },
    { type: "ul", items: ["Roles are shifting faster than titles suggest", "Compensation bands widened at the senior end", "Remote-friendly listings compressed but did not disappear"] },
    { type: "callout", title: "Tip", text: "Bookmark this piece and re-read it after you set up your Jobly matches — the patterns below inform what your digest surfaces first." },
    { type: "h2", text: "What the numbers say" },
    { type: "p", text: "Public job boards over-report open roles because a live listing is cheap to keep up. We cross-reference official ATS feeds (Greenhouse, Ashby, Lever) to filter for postings with recent activity." },
    { type: "image", src: covers[1], alt: "Chart showing listing volume vs actual hires", caption: "Listing volume is a lagging, noisy signal — hire velocity is not." },
    { type: "h3", text: "How to read the trend" },
    { type: "p", text: "Focus on 30-day rolling activity, not raw counts. A team with 12 open reqs and no movement in 60 days is not really hiring — it is signalling." },
    { type: "quote", text: "The listing is the least reliable part of the hiring process. Movement inside the pipeline is what actually predicts outcomes.", cite: "Ex-recruiting lead at a Series C" },
    { type: "h2", text: "What to do about it" },
    { type: "ul", items: ["Apply within 72 hours of a posting going live", "Match your resume language to the job's ATS keywords, not to trends on LinkedIn", "Prioritise companies whose engineering blog updates in the last quarter"] },
    { type: "table", headers: ["Signal", "Weight", "Where to check"], rows: [
      ["Recent commits from team leads", "High", "GitHub"],
      ["Recent product launches", "High", "Company blog / Product Hunt"],
      ["Active recruiter engagement", "Medium", "LinkedIn recruiter response time"],
      ["Long-open req (>90 days)", "Negative", "ATS timestamp"],
    ] },
    { type: "h2", text: "Bottom line" },
    { type: "p", text: "Signal beats volume. A candidate applying to five well-targeted roles with tailored context beats one carpet-bombing 200 postings — every time, across every seniority band we studied." },
  ];
}

const RAW: Array<Omit<BlogPost, "body" | "coverImage" | "coverAlt"> & { coverIdx?: number }> = [
  { slug: "tech-job-market-q3-2026", title: "The tech job market in Q3 2026: what the data actually shows", deck: "Volume is down, quality is up. Here is what changed and where the real openings are.", category: "Job market data", author: "Ana Rios", date: "2026-07-10", readTime: "7 min read" },
  { slug: "linkedin-open-to-work-lie", title: "The LinkedIn 'open to work' halo is doing you no favours", deck: "We audited 4,200 profiles. The green ring hurts more than it helps in tech hiring.", category: "LinkedIn vs reality", author: "Marcus Vale", date: "2026-07-04", readTime: "6 min read" },
  { slug: "ghost-jobs-2026", title: "Ghost jobs are back — how to spot them in 30 seconds", deck: "Fake, evergreen, and pipeline-only postings are still eating your time. Here is a quick test.", category: "Ghost jobs", author: "Priya Shah", date: "2026-06-27", readTime: "5 min read" },
  { slug: "from-bootcamp-to-staff", title: "From bootcamp to Staff Engineer in 6 years: Lea's playbook", deck: "A first-hand account of how one Jobly user compounded small right moves into a Staff role.", category: "Success stories", author: "Editorial", date: "2026-06-20", readTime: "8 min read" },
  { slug: "resume-that-passes-ats", title: "The resume rewrite that doubled my callback rate", deck: "One page, three sections, zero fluff. The exact structure that ATS filters actually respect.", category: "Career tips", author: "Jonas Miller", date: "2026-06-14", readTime: "6 min read" },
  { slug: "salary-bands-2026", title: "Salary bands for tech roles in 2026 — what stayed, what moved", deck: "Fresh data on compensation from 12,000 offers across the US, EU, and UK.", category: "Job market data", author: "Ana Rios", date: "2026-06-07", readTime: "9 min read" },
  { slug: "linkedin-recruiters-message", title: "Why your LinkedIn recruiter messages get 3% response rates", deck: "The average recruiter opens 87 profiles a day. Your DM is not the problem — your positioning is.", category: "LinkedIn vs reality", author: "Marcus Vale", date: "2026-05-30", readTime: "5 min read" },
  { slug: "ghost-jobs-red-flags", title: "The 5 red flags that mean a job posting is fake", deck: "Compensation ranges wider than $80k, 'urgent' but 90+ days old, and three more.", category: "Ghost jobs", author: "Priya Shah", date: "2026-05-23", readTime: "4 min read" },
  { slug: "career-switch-devops", title: "How Juno switched from frontend to devops in 5 months", deck: "The certifications, projects, and cover-letter angle that opened doors nobody expected.", category: "Success stories", author: "Editorial", date: "2026-05-16", readTime: "7 min read" },
  { slug: "cover-letter-2026", title: "The cover letter is dead. This 4-sentence email replaces it.", deck: "Hiring managers admitted it: nobody reads cover letters. Here is what they do read.", category: "Career tips", author: "Jonas Miller", date: "2026-05-09", readTime: "4 min read" },
  { slug: "layoffs-vs-hiring", title: "Layoff headlines vs actual hiring: the gap explained", deck: "Big tech is cutting and hiring at the same time. Here is which teams are which.", category: "Job market data", author: "Ana Rios", date: "2026-05-02", readTime: "8 min read" },
  { slug: "networking-real-talk", title: "'Networking' is broken. Do this instead.", deck: "Coffee chats do not scale. Contribution and specificity do.", category: "Career tips", author: "Editorial", date: "2026-04-25", readTime: "6 min read" },
];

export const BLOG_POSTS: BlogPost[] = RAW.map((r, i) => ({
  ...r,
  coverImage: covers[i % covers.length]!,
  coverAlt: `${r.title} — cover image`,
  body: sampleBody(r.category),
}));

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelated(post: BlogPost, count = 3): BlogPost[] {
  const same = BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category === post.category);
  const others = BLOG_POSTS.filter((p) => p.slug !== post.slug && p.category !== post.category);
  return [...same, ...others].slice(0, count);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function slugifyHeading(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}