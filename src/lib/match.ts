import type { QuizAnswers } from "./quiz-store";
import type { MatchCriterion } from "./jobs-data";

export type DbJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: string | null;
  seniority: string | null;
  minYearsExperience: number | null;
  englishLevel: string | null;
  roles: string[];
  roleIds: string[];
  stack: string[];
  hardSkills: string[];
  tools: string[];
  softSkills: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  postedDaysAgo: number;
  source: string | null;
  companySector: string | null;
  companyDomain: string | null;
  group: string | null;
};

export function rolesOverlap(userRoles: string[], job: DbJob): boolean {
  if (!userRoles.length) return false;
  const jobRolesLc = job.roles.map((r) => r.toLowerCase());
  const jobRoleIdsLc = job.roleIds.map((r) => r.toLowerCase());
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[—–]/g, "-")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  return userRoles.some((r) => {
    const rl = r.toLowerCase();
    if (jobRolesLc.includes(rl)) return true;
    const rs = slug(r);
    if (rs && jobRoleIdsLc.includes(rs)) return true;
    if (rs && jobRolesLc.some((jr) => slug(jr) === rs)) return true;
    return false;
  });
}

const SENIORITY_ORDER = ["Junior", "Middle", "Senior", "Lead", "Exec"];
function seniorityFromLevel(level?: string): string | null {
  if (!level) return null;
  const l = level.toLowerCase();
  if (l.includes("exec") || l.includes("c-level") || l.includes("chief")) return "Exec";
  if (
    l.includes("lead") ||
    l.includes("principal") ||
    l.includes("staff") ||
    l.includes("director") ||
    l.includes("vp")
  )
    return "Lead";
  if (l.includes("senior") || /\bsr\b/.test(l)) return "Senior";
  if (l.includes("junior") || l.includes("entry") || /\bjr\b/.test(l)) return "Junior";
  if (l.includes("mid")) return "Middle";
  return null;
}

export function computeMatch(
  job: DbJob,
  quiz: QuizAnswers,
): { score: number; why: string; criteria: MatchCriterion[]; missingSkills: string[] } {
  const criteria: MatchCriterion[] = [];
  const userRoles = quiz.roles?.length ? quiz.roles : quiz.role ? [quiz.role] : [];
  const userSkillsList = [
    ...(quiz.hardSkills ?? []),
    ...(quiz.tools ?? []),
    ...(quiz.stackSkills ?? []),
  ];
  const userSkills = new Set(userSkillsList.map((s) => s.toLowerCase()));
  const jobSkills = [...job.hardSkills, ...job.tools, ...job.stack];
  const jobSkillsLc = jobSkills.map((s) => s.toLowerCase());

  const roleMatch = rolesOverlap(userRoles, job) ? 1 : 0;
  const roleScore = 30 * roleMatch;
  if (roleMatch) criteria.push({ status: "full", text: `Role: ${job.roles.slice(0, 2).join(", ") || job.title} — matches` });
  else if (userRoles.length) criteria.push({ status: "partial", text: `Role: ${job.roles[0] ?? job.title} — adjacent` });

  const overlap = userSkills.size ? jobSkillsLc.filter((s) => userSkills.has(s)).length : 0;
  const needed = Math.max(3, Math.min(jobSkillsLc.length, 8));
  const skillRatio = jobSkillsLc.length ? Math.min(1, overlap / needed) : 0.5;
  const skillScore = 35 * skillRatio;
  const matchedSkills = jobSkills.filter((s) => userSkills.has(s.toLowerCase())).slice(0, 3);
  const missingSkills = jobSkills
    .filter((s) => !userSkills.has(s.toLowerCase()))
    .slice(0, 3);
  if (matchedSkills.length) criteria.push({ status: "full", text: `Stack: ${matchedSkills.join(", ")} — matches` });

  const userSen = seniorityFromLevel(quiz.level);
  let senScore = 15 * 0.6;
  if (userSen && job.seniority) {
    const ui = SENIORITY_ORDER.indexOf(userSen);
    const ji = SENIORITY_ORDER.indexOf(job.seniority);
    if (ui >= 0 && ji >= 0) {
      const diff = Math.abs(ui - ji);
      senScore = 15 * Math.max(0, 1 - diff * 0.35);
      if (diff === 0) criteria.push({ status: "full", text: `Level: ${job.seniority} — matches` });
      else if (diff === 1) criteria.push({ status: "partial", text: `Level: ${job.seniority} — adjacent` });
    }
  }

  let expScore = 10 * 0.7;
  if (typeof quiz.years === "number" && typeof job.minYearsExperience === "number") {
    if (quiz.years >= job.minYearsExperience) expScore = 10;
    else expScore = 10 * Math.max(0.2, quiz.years / Math.max(1, job.minYearsExperience));
  }

  const wm = (job.workMode ?? "").toLowerCase();
  const remote = /remote/.test(wm) || /remote/i.test(job.location);
  const userLocs = (quiz.locations ?? []).map((l) => l.toLowerCase());
  let locScore = 10 * 0.5;
  const jobLocLc = job.location.toLowerCase();
  if (remote) {
    locScore = 10;
    criteria.push({ status: "full", text: `Location: Remote — matches` });
  } else if (userLocs.some((l) => jobLocLc.includes(l) || l.includes(jobLocLc))) {
    locScore = 10;
    criteria.push({ status: "full", text: `Location: ${job.location} — matches` });
  } else if (userLocs.length) {
    locScore = 3;
  }

  const raw = roleScore + skillScore + senScore + expScore + locScore;
  let h = 0;
  for (let i = 0; i < job.id.length; i++) h = (h * 31 + job.id.charCodeAt(i)) >>> 0;
  const jitter = (h % 7) - 3;
  const score = Math.max(30, Math.min(96, Math.round(raw + jitter)));

  const whyBits: string[] = [];
  if (matchedSkills.length) whyBits.push(matchedSkills.slice(0, 2).join(" + "));
  if (job.seniority) whyBits.push(`${job.seniority.toLowerCase()} level`);
  if (remote) whyBits.push("remote");
  const why = whyBits.length ? whyBits.join(", ") : `${job.company} — ${job.title}`;

  return { score, why, criteria, missingSkills };
}