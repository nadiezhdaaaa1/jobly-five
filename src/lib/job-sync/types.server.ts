export type NormalizedJob = {
  id: string;
  external_id: string;
  external_url: string;
  title: string;
  company: string;
  company_sector: string | null;
  company_domain: string | null;
  location: string;
  work_mode: "Remote" | "Hybrid" | "On-site";
  seniority: string | null;
  min_years_experience: number | null;
  english_level: string;
  roles: string[];
  role_ids: string[];
  group: string | null;
  stack: string[];
  hard_skills: string[];
  tools: string[];
  soft_skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  posted_days_ago: number;
  source: string;
  source_ats: string;
  raw_description: string;
};

export type JobSourceRow = {
  id: string;
  ats: "greenhouse" | "lever" | "ashby";
  handle: string;
  company_name: string;
  company_sector: string | null;
  company_domain: string | null;
};