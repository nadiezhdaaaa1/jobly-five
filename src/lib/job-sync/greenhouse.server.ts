import type { JobSourceRow, NormalizedJob } from "./types.server";
import { extractKeywords, extractRoles, inferSeniority, inferWorkMode, postedDaysFrom, stripHtml } from "./keywords.server";

type GhJob = {
  id: number;
  title: string;
  updated_at?: string;
  absolute_url: string;
  location?: { name?: string } | null;
  content?: string;
  departments?: Array<{ name?: string }>;
};

export async function fetchGreenhouse(source: JobSourceRow): Promise<NormalizedJob[]> {
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(source.handle)}/jobs?content=true`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let payload: { jobs?: GhJob[] };
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "Jobly-Sync/1.0" } });
    if (!res.ok) throw new Error(`Greenhouse ${source.handle} HTTP ${res.status}`);
    payload = (await res.json()) as { jobs?: GhJob[] };
  } finally {
    clearTimeout(timer);
  }
  const list = payload.jobs ?? [];
  return list.map((j) => normalize(source, j));
}

function normalize(source: JobSourceRow, j: GhJob): NormalizedJob {
  const ext = `greenhouse:${source.handle}:${j.id}`;
  const desc = stripHtml(j.content ?? "").slice(0, 4000);
  const kw = extractKeywords(j.title, desc);
  const roleInfo = extractRoles(j.title);
  const sen = inferSeniority(j.title);
  const locName = j.location?.name ?? "";
  const workMode = inferWorkMode(locName);
  return {
    id: ext,
    external_id: ext,
    external_url: j.absolute_url,
    title: j.title,
    company: source.company_name,
    company_sector: source.company_sector,
    company_domain: source.company_domain,
    location: locName || "Remote",
    work_mode: workMode,
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
    posted_days_ago: postedDaysFrom(j.updated_at),
    source: "greenhouse",
    source_ats: "greenhouse",
    raw_description: desc,
  };
}