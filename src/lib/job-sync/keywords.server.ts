// Server-only keyword extraction: derive stack/tools/hard_skills/roles from title + description.

const STACK = [
  "React","Next.js","Vue","Svelte","Angular","TypeScript","JavaScript","Node.js","Node",
  "Python","Django","Flask","FastAPI","Ruby","Rails","Go","Golang","Rust","Java","Kotlin",
  "Scala","Swift","Elixir","PHP","Laravel","C++","C#",".NET","GraphQL","REST",
  "PostgreSQL","MySQL","MongoDB","Redis","Kafka","Elasticsearch","Snowflake","BigQuery",
  "Spark","Airflow","dbt","Kubernetes","Docker","Terraform","AWS","GCP","Azure",
] as const;

const TOOLS = [
  "Figma","Jira","Linear","Notion","Slack","GitHub","GitLab","Bitbucket","Datadog",
  "Sentry","Segment","Amplitude","Mixpanel","Looker","Tableau","Power BI","Salesforce",
  "HubSpot","Zendesk","Intercom","Stripe","Twilio","Cloudflare","Vercel","Netlify",
  "Storybook","Cypress","Playwright","Jest","Vitest","Webpack","Vite","ESLint","Prettier",
] as const;

const HARD_SKILLS = [
  "SQL","REST APIs","GraphQL","Microservices","Machine Learning","Deep Learning","LLM",
  "Data pipelines","ETL","CI/CD","System design","Distributed systems","API design",
  "Performance optimization","Accessibility","SEO","A/B testing","Security","OAuth",
  "SSO","Authentication","Design systems","Responsive design","Animation",
] as const;

const SOFT_SKILLS = ["Communication","Leadership","Mentoring","Ownership","Collaboration"];

const ROLE_MAP: Record<string, { id: string; label: string; group: string }> = {
  "frontend": { id: "frontend-engineer", label: "Frontend Engineer", group: "Engineering" },
  "front-end": { id: "frontend-engineer", label: "Frontend Engineer", group: "Engineering" },
  "backend": { id: "backend-engineer", label: "Backend Engineer", group: "Engineering" },
  "back-end": { id: "backend-engineer", label: "Backend Engineer", group: "Engineering" },
  "full stack": { id: "fullstack-engineer", label: "Full Stack Engineer", group: "Engineering" },
  "full-stack": { id: "fullstack-engineer", label: "Full Stack Engineer", group: "Engineering" },
  "fullstack": { id: "fullstack-engineer", label: "Full Stack Engineer", group: "Engineering" },
  "mobile": { id: "mobile-engineer", label: "Mobile Engineer", group: "Engineering" },
  "ios": { id: "ios-engineer", label: "iOS Engineer", group: "Engineering" },
  "android": { id: "android-engineer", label: "Android Engineer", group: "Engineering" },
  "data engineer": { id: "data-engineer", label: "Data Engineer", group: "Data" },
  "data scientist": { id: "data-scientist", label: "Data Scientist", group: "Data" },
  "data analyst": { id: "data-analyst", label: "Data Analyst", group: "Data" },
  "analytics engineer": { id: "analytics-engineer", label: "Analytics Engineer", group: "Data" },
  "machine learning": { id: "ml-engineer", label: "ML Engineer", group: "Data" },
  "ml engineer": { id: "ml-engineer", label: "ML Engineer", group: "Data" },
  "devops": { id: "devops", label: "DevOps Engineer", group: "Infrastructure" },
  "site reliability": { id: "sre", label: "SRE", group: "Infrastructure" },
  "sre": { id: "sre", label: "SRE", group: "Infrastructure" },
  "platform engineer": { id: "platform-engineer", label: "Platform Engineer", group: "Infrastructure" },
  "security engineer": { id: "security-engineer", label: "Security Engineer", group: "Security" },
  "product manager": { id: "product-manager", label: "Product Manager", group: "Product" },
  "product designer": { id: "product-designer", label: "Product Designer", group: "Design" },
  "ux designer": { id: "ux-designer", label: "UX Designer", group: "Design" },
  "ui designer": { id: "ui-designer", label: "UI Designer", group: "Design" },
  "designer": { id: "designer", label: "Designer", group: "Design" },
  "engineering manager": { id: "engineering-manager", label: "Engineering Manager", group: "Engineering" },
  "qa engineer": { id: "qa-engineer", label: "QA Engineer", group: "Engineering" },
  "test engineer": { id: "qa-engineer", label: "QA Engineer", group: "Engineering" },
  "software engineer": { id: "software-engineer", label: "Software Engineer", group: "Engineering" },
  "engineer": { id: "software-engineer", label: "Software Engineer", group: "Engineering" },
};

function findAll(list: readonly string[], hay: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    const re = new RegExp(`(^|[^A-Za-z0-9+#.-])${escapeRe(item)}([^A-Za-z0-9+#.-]|$)`, "i");
    if (re.test(hay) && !seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function extractKeywords(title: string, description: string) {
  const hay = `${title}\n${description}`;
  return {
    stack: findAll(STACK, hay),
    tools: findAll(TOOLS, hay),
    hardSkills: findAll(HARD_SKILLS, hay),
    softSkills: findAll(SOFT_SKILLS, hay),
  };
}

export function extractRoles(title: string): { roles: string[]; roleIds: string[]; group: string | null } {
  const t = title.toLowerCase();
  const seenIds = new Set<string>();
  const roles: string[] = [];
  const roleIds: string[] = [];
  let group: string | null = null;
  for (const [needle, meta] of Object.entries(ROLE_MAP)) {
    if (t.includes(needle) && !seenIds.has(meta.id)) {
      seenIds.add(meta.id);
      roles.push(meta.label);
      roleIds.push(meta.id);
      if (!group) group = meta.group;
    }
  }
  if (roles.length === 0) {
    roles.push("Other");
    roleIds.push("other");
  }
  return { roles, roleIds, group };
}

export function inferSeniority(title: string): { seniority: string | null; minYears: number | null } {
  const t = title.toLowerCase();
  if (/\b(intern|internship)\b/.test(t)) return { seniority: "Intern", minYears: 0 };
  if (/\b(junior|jr\.?|entry|associate)\b/.test(t)) return { seniority: "Junior", minYears: 1 };
  if (/\b(principal|staff)\b/.test(t)) return { seniority: "Principal", minYears: 8 };
  if (/\b(lead|head of|director)\b/.test(t)) return { seniority: "Lead", minYears: 7 };
  if (/\b(senior|sr\.?)\b/.test(t)) return { seniority: "Senior", minYears: 5 };
  if (/\b(mid|mid-level|intermediate)\b/.test(t)) return { seniority: "Mid", minYears: 3 };
  return { seniority: "Mid", minYears: 3 };
}

export function inferWorkMode(location: string): "Remote" | "Hybrid" | "On-site" {
  const l = location.toLowerCase();
  if (/remote/.test(l)) return "Remote";
  if (/hybrid/.test(l)) return "Hybrid";
  return "On-site";
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function postedDaysFrom(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}