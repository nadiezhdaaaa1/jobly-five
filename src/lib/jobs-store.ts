import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadQuiz } from "./quiz-store";
import { computeMatch, rolesOverlap, type DbJob } from "./match";
import type { Job, JobSource, Source, DescriptionSection } from "./jobs-data";

// Eagerly import every fake-company logo pointer. Keys are like
// "/src/assets/logos-fake/Actuari.jpg.asset.json".
const LOGO_MODULES = import.meta.glob<{ default: { url: string } }>(
  "@/assets/logos-fake/*.asset.json",
  { eager: true },
);

const LOGO_BY_NAME = new Map<string, string>();
const LOGO_URLS: string[] = [];
for (const [path, mod] of Object.entries(LOGO_MODULES)) {
  const url = mod.default.url;
  const file = path.split("/").pop() ?? "";
  const name = file.replace(/\.jpg\.asset\.json$/i, "");
  LOGO_BY_NAME.set(name.toLowerCase(), url);
  LOGO_URLS.push(url);
}

function pickLogo(company: string): string {
  const key = company.trim().toLowerCase();
  const direct = LOGO_BY_NAME.get(key) ?? LOGO_BY_NAME.get(key.replace(/\s+/g, "_"));
  if (direct) return direct;
  let h = 0;
  for (let i = 0; i < company.length; i++) h = (h * 31 + company.charCodeAt(i)) >>> 0;
  return LOGO_URLS[h % LOGO_URLS.length];
}

const DIRECT_SOURCES = new Set(["greenhouse", "lever", "ashby", "workable"]);

function formatSalary(min: number | null, max: number | null): string {
  if (min && max) return `$${Math.round(min / 1000)}–${Math.round(max / 1000)}K`;
  if (min) return `$${Math.round(min / 1000)}K+`;
  return "Salary not disclosed";
}

function toJob(db: DbJob): Job {
  const quiz = loadQuiz();
  const { score, why, criteria, missingSkills } = computeMatch(db, quiz);
  const src = (db.source ?? "").toLowerCase();
  const source: Source = DIRECT_SOURCES.has(src) ? "direct" : "aggregated";
  const wm = (db.workMode ?? "").toLowerCase();
  const isRemoteMode = wm.includes("remote");
  const location = isRemoteMode && !/remote/i.test(db.location) ? `${db.location} · Remote` : db.location;
  const description: DescriptionSection[] = [
    {
      heading: "About the role",
      body: `Join ${db.company} as a ${db.title}. You'll work on impactful problems in ${db.companySector ?? "the industry"} using ${db.stack.slice(0, 3).join(", ") || "modern tools"}.`,
    },
    {
      heading: "Requirements",
      bullets: [
        `${db.minYearsExperience ?? 3}+ years of professional experience`,
        `Strong with ${(db.hardSkills.length ? db.hardSkills : db.stack).slice(0, 3).join(", ") || "the core stack"}`,
        `English level ${db.englishLevel ?? "B2+"}`,
      ],
    },
  ];
  const sources: JobSource[] = [
    {
      name: db.source
        ? source === "direct"
          ? `${db.source} — company careers page`
          : `${db.source} — aggregated listing`
        : "Unknown source",
      role: "primary",
      url: "#",
    },
  ];
  return {
    id: db.id,
    title: db.title,
    company: db.company,
    logo: pickLogo(db.company),
    location: location || "Remote",
    salary: formatSalary(db.salaryMin, db.salaryMax),
    score,
    why,
    source,
    postedDays: db.postedDaysAgo ?? 0,
    employmentType: "Full-time",
    postingUrl: "#",
    criteria,
    missingSkills,
    description,
    details: {
      employmentType: "Full-time",
      experienceLevel: db.seniority ?? "Senior",
      workplace: location,
      jobId: db.id.toUpperCase(),
    },
    sources,
  };
}

let dbJobs: DbJob[] = [];
let jobs: Job[] = [];
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  for (const l of listeners) l();
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function getVersion() {
  return version;
}

export function recomputeJobs() {
  jobs = dbJobs.map(toJob);
  emit();
}

export async function loadJobs(): Promise<void> {
  if (loaded) return;
  if (loading) return loading;
  loading = (async () => {
    const { data, error } = await supabase.from("jobs").select("*").limit(5000);
    if (error || !data) {
      loading = null;
      return;
    }
    dbJobs = data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      title: row.title as string,
      company: (row.company as string) ?? "",
      location: (row.location as string) ?? "",
      workMode: (row.work_mode as string | null) ?? null,
      seniority: (row.seniority as string | null) ?? null,
      minYearsExperience: (row.min_years_experience as number | null) ?? null,
      englishLevel: (row.english_level as string | null) ?? null,
      roles: (row.roles as string[] | null) ?? [],
      roleIds: (row.role_ids as string[] | null) ?? [],
      stack: (row.stack as string[] | null) ?? [],
      hardSkills: (row.hard_skills as string[] | null) ?? [],
      tools: (row.tools as string[] | null) ?? [],
      softSkills: (row.soft_skills as string[] | null) ?? [],
      salaryMin: (row.salary_min as number | null) ?? null,
      salaryMax: (row.salary_max as number | null) ?? null,
      postedDaysAgo: (row.posted_days_ago as number | null) ?? 0,
      source: (row.source as string | null) ?? null,
      companySector: (row.company_sector as string | null) ?? null,
      companyDomain: (row.company_domain as string | null) ?? null,
      group: (row.group as string | null) ?? null,
    }));
    dbJobs.sort((a, b) => (a.postedDaysAgo ?? 0) - (b.postedDaysAgo ?? 0));
    recomputeJobs();
    loaded = true;
  })();
  return loading;
}

export function getAllJobsCached(): Job[] {
  return jobs;
}
export function getDbJobsCached(): DbJob[] {
  return dbJobs;
}
export function getDbJobById(id: string): DbJob | undefined {
  return dbJobs.find((j) => j.id === id);
}

export function useJobs(): { jobs: Job[]; loaded: boolean } {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  return { jobs, loaded };
}

export function useMatchedJobs(minScore = 70): Job[] {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  const quiz = loadQuiz();
  const userRoles = quiz.roles?.length ? quiz.roles : quiz.role ? [quiz.role] : [];
  return jobs
    .filter((j) => j.score >= minScore)
    .filter((j) => {
      const db = dbJobs.find((d) => d.id === j.id);
      if (!db) return true;
      return userRoles.length === 0 || rolesOverlap(userRoles, db);
    })
    .sort((a, b) => b.score - a.score);
}

if (typeof window !== "undefined") {
  void loadJobs();
}