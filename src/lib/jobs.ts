import { supabase } from "@/integrations/supabase/client";

export type Job = {
  id: string;
  title: string;
  group_name: string;
  roles: string[];
  role_ids: string[];
  seniority: "Junior" | "Mid" | "Senior" | "Lead" | "Exec";
  min_years_experience: number;
  work_mode: "Remote" | "Hybrid" | "Onsite";
  location: string;
  company: string;
  company_sector: string | null;
  company_domain: string | null;
  stack: string[];
  hard_skills: string[];
  tools: string[];
  soft_skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  posted_days_ago: number;
  source: string | null;
  description: string | null;
};

export type FetchJobsArgs = {
  groupName?: string;
  roleIds?: string[];
  seniority?: string;
  workMode?: string;
  limit?: number;
  offset?: number;
};

export async function fetchJobs(args: FetchJobsArgs = {}): Promise<Job[]> {
  const { groupName, roleIds, seniority, workMode, limit = 25, offset = 0 } = args;
  let q = supabase
    .from("jobs")
    .select("*")
    .order("posted_days_ago", { ascending: true });
  if (groupName) q = q.eq("group_name", groupName);
  if (seniority) q = q.eq("seniority", seniority);
  if (workMode) q = q.eq("work_mode", workMode);
  if (roleIds && roleIds.length) {
    const clauses = roleIds.map((id) => `role_ids.cs.${JSON.stringify([id])}`).join(",");
    q = q.or(clauses);
  }
  q = q.range(offset, offset + limit - 1);
  const { data, error } = await q;
  if (error || !data) return [];
  return data as unknown as Job[];
}

export async function fetchJobById(id: string): Promise<Job | null> {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as unknown as Job;
}

// Compute the effective posted date on the client, so mock data stays evergreen.
export function postedDate(job: Pick<Job, "posted_days_ago">): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (job.posted_days_ago ?? 0));
  return d;
}