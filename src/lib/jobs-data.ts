// Types for the app-wide Job model. The catalog itself lives in the database
// and is loaded through `src/lib/jobs-store.ts`.

export type Source = "direct" | "aggregated";

export type CardState =
  | "default"
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejection"
  | "dismissed"
  | "reported";

export type MatchCriterion = { status: "full" | "partial"; text: string };
export type DescriptionSection = { heading: string; body?: string; bullets?: string[] };
export type JobDetails = {
  employmentType?: string;
  experienceLevel?: string;
  workplace?: string;
  postedDate?: string;
  jobId?: string;
};
export type JobSource = { name: string; role: "primary" | "secondary"; url?: string };

export type Job = {
  id: string;
  title: string;
  company: string;
  logo?: string;
  location: string;
  salary: string;
  score: number;
  why: string;
  source: Source;
  postedDays: number;
  initialState?: CardState;
  employmentType?: string;
  postingUrl?: string;
  criteria?: MatchCriterion[];
  description?: DescriptionSection[];
  details?: JobDetails;
  sources?: JobSource[];
  missingSkills?: string[];
};

// The job catalog lives in the database. Read jobs through `useJobs()` from
// `@/lib/jobs-store`. `getAllJobs()` is a synchronous accessor into that
// module's cache — it returns the currently loaded snapshot (or empty until
// the first fetch resolves).
export { getAllJobsCached as getAllJobs, useJobs } from "./jobs-store";