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
  rawDescription?: string | null;
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

// English tiers on the job side, ranked. Higher rank = stricter requirement.
const ENGLISH_RANK: Record<string, number> = {
  conversational: 1,
  professional: 2,
  native: 3,
};

// Maps the user's CEFR-style answer to the same 1–3 scale.
function userEnglishRank(level?: string): number | null {
  if (!level) return null;
  const l = level.toLowerCase();
  if (l.includes("native")) return 3;
  if (l.includes("c2") || l.includes("proficient")) return 3;
  if (l.includes("c1") || l.includes("advanced")) return 2;
  if (l.includes("b2") || l.includes("upper")) return 2;
  if (l.includes("b1") || l.includes("intermediate")) return 1;
  if (l.includes("a2") || l.includes("a1") || l.includes("no english")) return 0;
  return null;
}

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
  if (roleMatch) criteria.push({ status: "full", text: `Role: ${job.roles.slice(0, 2).join(", ") || job.title} — matches` });
  else if (userRoles.length) criteria.push({ status: "partial", text: `Role: ${job.roles[0] ?? job.title} — adjacent` });

  const overlap = userSkills.size ? jobSkillsLc.filter((s) => userSkills.has(s)).length : 0;
  const needed = Math.max(3, Math.min(jobSkillsLc.length, 8));
  const skillRatio =
    jobSkillsLc.length && userSkills.size ? Math.min(1, overlap / needed) : null;
  const matchedSkills = jobSkills.filter((s) => userSkills.has(s.toLowerCase())).slice(0, 3);
  const missingSkills = jobSkills
    .filter((s) => !userSkills.has(s.toLowerCase()))
    .slice(0, 3);
  if (matchedSkills.length) criteria.push({ status: "full", text: `Stack: ${matchedSkills.join(", ")} — matches` });

  const userSen = seniorityFromLevel(quiz.level);
  let senRatio: number | null = null;
  if (userSen && job.seniority) {
    const ui = SENIORITY_ORDER.indexOf(userSen);
    const ji = SENIORITY_ORDER.indexOf(job.seniority);
    if (ui >= 0 && ji >= 0) {
      const diff = Math.abs(ui - ji);
      senRatio = Math.max(0, 1 - diff * 0.35);
      if (diff === 0) criteria.push({ status: "full", text: `Level: ${job.seniority} — matches` });
      else if (diff === 1) criteria.push({ status: "partial", text: `Level: ${job.seniority} — adjacent` });
    }
  }

  // Years of experience — absent, not zero: skipped entirely when either side
  // has no value. Partial credit when the user is 1–3 years short.
  let expRatio: number | null = null;
  if (typeof quiz.years === "number" && typeof job.minYearsExperience === "number") {
    const gap = job.minYearsExperience - quiz.years;
    if (gap <= 0) expRatio = 1;
    else if (gap <= 3) expRatio = Math.max(0, 1 - gap * 0.2);
    else expRatio = 0.15;
  }

  // English — only scored when the job actually states a requirement.
  let engRatio: number | null = null;
  const jobEng = job.englishLevel ? ENGLISH_RANK[job.englishLevel.toLowerCase()] : undefined;
  const userEng = userEnglishRank(quiz.primaryLanguage);
  if (jobEng && userEng !== null) {
    const diff = jobEng - userEng;
    engRatio = diff <= 0 ? 1 : diff === 1 ? 0.5 : 0;
  }

  const wm = (job.workMode ?? "").toLowerCase();
  const remote = /remote/.test(wm) || /remote/i.test(job.location);
  const userLocs = (quiz.locations ?? []).map((l) => l.toLowerCase());
  let locRatio: number | null = null;
  const jobLocLc = job.location.toLowerCase();
  if (remote) {
    locRatio = 1;
    criteria.push({ status: "full", text: `Location: Remote — matches` });
  } else if (userLocs.some((l) => jobLocLc.includes(l) || l.includes(jobLocLc))) {
    locRatio = 1;
    criteria.push({ status: "full", text: `Location: ${job.location} — matches` });
  } else if (userLocs.length) {
    locRatio = 0.3;
  }

  // "Absent, not zero": every signal without data drops out of both the
  // numerator and the denominator, so a job can still reach 100%.
  const signals: Array<{ weight: number; ratio: number | null }> = [
    { weight: 40, ratio: userRoles.length ? roleMatch : null },
    { weight: 25, ratio: skillRatio },
    { weight: 15, ratio: senRatio },
    { weight: 10, ratio: expRatio },
    { weight: 10, ratio: engRatio },
    { weight: 10, ratio: locRatio },
  ];
  let earned = 0;
  let possible = 0;
  for (const s of signals) {
    if (s.ratio === null) continue;
    earned += s.weight * s.ratio;
    possible += s.weight;
  }
  const score = possible
    ? Math.max(30, Math.min(100, Math.round((earned / possible) * 100)))
    : 50;

  const whyBits: string[] = [];
  if (matchedSkills.length) whyBits.push(matchedSkills.slice(0, 2).join(" + "));
  if (job.seniority) whyBits.push(`${job.seniority.toLowerCase()} level`);
  if (remote) whyBits.push("remote");
  const why = whyBits.length ? whyBits.join(", ") : `${job.company} — ${job.title}`;

  return { score, why, criteria, missingSkills };
}