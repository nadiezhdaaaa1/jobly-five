import type { JobSourceRow, NormalizedJob } from "./types.server";
import { extractKeywords, extractRoles, inferSeniority, inferWorkMode, postedDaysFrom, stripHtml } from "./keywords.server";

type AshbyComp = {
  compensationType?: string;
  interval?: string;
  currencyCode?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
};
type AshbyTier = { components?: AshbyComp[] };
type AshbyJob = {
  id: string;
  title: string;
  publishedAt?: string;
  jobUrl: string;
  applyUrl?: string;
  location?: string;
  isRemote?: boolean;
  workplaceType?: string;
  employmentType?: string;
  descriptionPlain?: string;
  descriptionHtml?: string;
  isListed?: boolean;
  compensation?: { compensationTiers?: AshbyTier[] } | null;
};

export async function fetchAshby(source: JobSourceRow): Promise<NormalizedJob[]> {
  const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(source.handle)}?includeCompensation=true`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let payload: { jobs?: AshbyJob[] };
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "Jobly-Sync/1.0" } });
    if (!res.ok) throw new Error(`Ashby ${source.handle} HTTP ${res.status}`);
    payload = (await res.json()) as { jobs?: AshbyJob[] };
  } finally {
    clearTimeout(timer);
  }
  const list = (payload.jobs ?? []).filter((j) => j.isListed !== false);
  return list.map((j) => normalize(source, j));
}

function extractSalary(j: AshbyJob): { min: number | null; max: number | null } {
  const tiers = j.compensation?.compensationTiers ?? [];
  let min: number | null = null;
  let max: number | null = null;
  for (const t of tiers) {
    for (const c of t.components ?? []) {
      if (c.compensationType !== "Salary") continue;
      if (c.currencyCode && c.currencyCode !== "USD") continue;
      let lo = c.minValue ?? null;
      let hi = c.maxValue ?? null;
      if (c.interval === "1 HOUR") {
        if (lo != null) lo = Math.round(lo * 2080);
        if (hi != null) hi = Math.round(hi * 2080);
      } else if (c.interval === "1 MONTH") {
        if (lo != null) lo = lo * 12;
        if (hi != null) hi = hi * 12;
      }
      if (lo != null) min = min == null ? lo : Math.min(min, lo);
      if (hi != null) max = max == null ? hi : Math.max(max, hi);
    }
  }
  return { min, max };
}

function normalize(source: JobSourceRow, j: AshbyJob): NormalizedJob {
  const ext = `ashby:${source.handle}:${j.id}`;
  const desc = (j.descriptionPlain ?? stripHtml(j.descriptionHtml ?? "")).slice(0, 4000);
  const kw = extractKeywords(j.title, desc);
  const roleInfo = extractRoles(j.title);
  const sen = inferSeniority(j.title);
  const locName = j.location ?? "";
  const workplaceHint = (j.workplaceType ?? "").toLowerCase();
  const workMode = j.isRemote
    ? "Remote"
    : workplaceHint.includes("remote")
      ? "Remote"
      : workplaceHint.includes("hybrid")
        ? "Hybrid"
        : inferWorkMode(locName);
  const salary = extractSalary(j);
  return {
    id: ext,
    external_id: ext,
    external_url: j.jobUrl,
    title: j.title,
    company: source.company_name,
    company_sector: source.company_sector,
    company_domain: source.company_domain,
    location: locName || "Remote",
    work_mode: workMode as "Remote" | "Hybrid" | "On-site",
    seniority: sen.seniority,
    min_years_experience: sen.minYears,
    english_level: "B2",
    roles: roleInfo.roles,
    role_ids: roleInfo.roleIds,
    group: roleInfo.group,
    stack: kw.stack,
    hard_skills: kw.hardSkills,
    tools: kw.tools,
    soft_skills: kw.softSkills,
    salary_min: salary.min,
    salary_max: salary.max,
    posted_days_ago: postedDaysFrom(j.publishedAt),
    source: "ashby",
    source_ats: "ashby",
    raw_description: desc,
  };
}