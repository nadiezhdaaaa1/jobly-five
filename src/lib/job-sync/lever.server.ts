import type { JobSourceRow, NormalizedJob } from "./types.server";
import { extractKeywords, extractRoles, inferSeniority, inferWorkMode, postedDaysFrom, stripHtml } from "./keywords.server";

type LeverJob = {
  id: string;
  text: string;
  createdAt?: number;
  hostedUrl: string;
  applyUrl?: string;
  descriptionPlain?: string;
  description?: string;
  categories?: { team?: string; location?: string; commitment?: string; department?: string };
  workplaceType?: string;
};

export async function fetchLever(source: JobSourceRow): Promise<NormalizedJob[]> {
  const url = `https://api.lever.co/v0/postings/${encodeURIComponent(source.handle)}?mode=json`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let payload: LeverJob[];
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "Jobly-Sync/1.0" } });
    if (!res.ok) throw new Error(`Lever ${source.handle} HTTP ${res.status}`);
    payload = (await res.json()) as LeverJob[];
  } finally {
    clearTimeout(timer);
  }
  return payload.map((j) => normalize(source, j));
}

function normalize(source: JobSourceRow, j: LeverJob): NormalizedJob {
  const ext = `lever:${source.handle}:${j.id}`;
  const desc = (j.descriptionPlain ?? stripHtml(j.description ?? "")).slice(0, 4000);
  const kw = extractKeywords(j.text, desc);
  const roleInfo = extractRoles(j.text);
  const sen = inferSeniority(j.text);
  const locName = j.categories?.location ?? "";
  const workplaceHint = (j.workplaceType ?? "").toLowerCase();
  const workMode = workplaceHint.includes("remote")
    ? "Remote"
    : workplaceHint.includes("hybrid")
      ? "Hybrid"
      : inferWorkMode(locName);
  const postedIso = j.createdAt ? new Date(j.createdAt).toISOString() : null;
  return {
    id: ext,
    external_id: ext,
    external_url: j.hostedUrl,
    title: j.text,
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
    salary_min: null,
    salary_max: null,
    posted_days_ago: postedDaysFrom(postedIso),
    source: "lever",
    source_ats: "lever",
    raw_description: desc,
  };
}