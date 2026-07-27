// Client-safe taxonomy → title-regex patterns for matching job titles to quiz roles.
// Order matters: more specific patterns first so "Frontend Engineer" wins over "Software Engineer".
// Both the server-side extractor (jobs sync) and the client-side matcher use this.

export type RolePattern = {
  role: string;
  id: string;
  group: string;
  patterns: RegExp[];
};

const r = (s: string) => new RegExp(s, "i");

export const ROLE_PATTERNS: RolePattern[] = [
  // Engineering: specific first
  { role: "Frontend Engineer", id: "frontend-engineer", group: "Engineering", patterns: [r("front[\\s-]?end"), r("\\bui\\s+engineer\\b")] },
  { role: "Backend Engineer", id: "backend-engineer", group: "Engineering", patterns: [r("back[\\s-]?end"), r("server[\\s-]?side\\s+engineer")] },
  { role: "Full-Stack Engineer", id: "fullstack-engineer", group: "Engineering", patterns: [r("full[\\s-]?stack")] },
  { role: "Mobile Engineer — iOS", id: "ios-engineer", group: "Engineering", patterns: [r("\\bios\\b"), r("swift\\s+engineer")] },
  { role: "Mobile Engineer — Android", id: "android-engineer", group: "Engineering", patterns: [r("\\bandroid\\b"), r("kotlin\\s+engineer")] },
  { role: "Mobile Engineer — Cross-platform", id: "mobile-crossplatform", group: "Engineering", patterns: [r("react\\s?native"), r("flutter"), r("cross[\\s-]?platform.*(mobile|engineer)"), r("\\bmobile\\s+engineer\\b")] },
  { role: "Web Developer", id: "web-developer", group: "Engineering", patterns: [r("\\bweb\\s+developer\\b"), r("wordpress\\s+developer")] },
  { role: "Game Developer", id: "game-developer", group: "Engineering", patterns: [r("\\bgame\\s+(developer|engineer|programmer)\\b"), r("unity\\s+(developer|engineer)"), r("unreal\\s+(developer|engineer)")] },
  { role: "Embedded / Firmware Engineer", id: "embedded-engineer", group: "Engineering", patterns: [r("\\bembedded\\b"), r("\\bfirmware\\b")] },
  { role: "Systems / Low-level Engineer", id: "systems-lowlevel", group: "Engineering", patterns: [r("\\bkernel\\b"), r("low[\\s-]?level"), r("systems\\s+programmer")] },
  { role: "Desktop / Enterprise App Developer", id: "desktop-enterprise", group: "Engineering", patterns: [r("desktop\\s+(developer|engineer)"), r("enterprise\\s+app")] },
  { role: "UX Engineer / Design Engineer", id: "ux-engineer", group: "Design", patterns: [r("ux\\s+engineer"), r("design\\s+engineer"), r("design\\s+technologist")] },

  // Data / ML
  { role: "Analytics Engineer", id: "analytics-engineer", group: "Data", patterns: [r("analytics\\s+engineer"), r("\\bdbt\\s+engineer")] },
  { role: "Data Engineer", id: "data-engineer", group: "Data", patterns: [r("data\\s+engineer")] },
  { role: "Data Scientist", id: "data-scientist", group: "Data", patterns: [r("data\\s+scientist")] },
  { role: "Data Analyst", id: "data-analyst", group: "Data", patterns: [r("data\\s+analyst")] },
  { role: "MLOps Engineer", id: "mlops-engineer", group: "Data", patterns: [r("ml[\\s-]?ops"), r("machine\\s+learning\\s+ops")] },
  { role: "Computer Vision Engineer", id: "cv-engineer", group: "Data", patterns: [r("computer\\s+vision")] },
  { role: "NLP Engineer", id: "nlp-engineer", group: "Data", patterns: [r("\\bnlp\\b"), r("natural\\s+language")] },
  { role: "AI / LLM Engineer", id: "ai-llm-engineer", group: "Data", patterns: [r("\\bllm\\b"), r("generative\\s+ai"), r("gen[\\s-]?ai"), r("\\bai\\s+engineer\\b"), r("prompt\\s+engineer")] },
  { role: "ML / AI Research Scientist", id: "ml-research", group: "Data", patterns: [r("research\\s+scientist"), r("ml\\s+researcher"), r("ai\\s+researcher")] },
  { role: "Machine Learning Engineer", id: "ml-engineer", group: "Data", patterns: [r("machine\\s+learning"), r("\\bml\\s+engineer\\b")] },
  { role: "BI Developer / Analyst", id: "bi-analyst", group: "Data", patterns: [r("\\bbi\\s+(developer|analyst)"), r("business\\s+intelligence")] },
  { role: "Data Architect", id: "data-architect", group: "Data", patterns: [r("data\\s+architect")] },
  { role: "Database Administrator (DBA)", id: "dba", group: "Data", patterns: [r("\\bdba\\b"), r("database\\s+administrator")] },
  { role: "Data Governance / Data Quality Engineer", id: "data-governance", group: "Data", patterns: [r("data\\s+governance"), r("data\\s+quality")] },

  // Infra / DevOps / Security
  { role: "Site Reliability Engineer (SRE)", id: "sre", group: "Infrastructure", patterns: [r("\\bsre\\b"), r("site\\s+reliability")] },
  { role: "DevOps Engineer", id: "devops", group: "Infrastructure", patterns: [r("\\bdevops\\b")] },
  { role: "Platform Engineer", id: "platform-engineer", group: "Infrastructure", patterns: [r("platform\\s+engineer")] },
  { role: "Cloud Engineer / Architect", id: "cloud-engineer", group: "Infrastructure", patterns: [r("cloud\\s+(engineer|architect)")] },
  { role: "Infrastructure Engineer", id: "infra-engineer", group: "Infrastructure", patterns: [r("infrastructure\\s+engineer")] },
  { role: "Network Engineer", id: "network-engineer", group: "Infrastructure", patterns: [r("network\\s+engineer")] },
  { role: "Systems Administrator", id: "sysadmin", group: "Infrastructure", patterns: [r("systems?\\s+administrator"), r("\\bsysadmin\\b")] },
  { role: "Application Security (AppSec) Engineer", id: "appsec-engineer", group: "Security", patterns: [r("app\\s?sec"), r("application\\s+security")] },
  { role: "Cloud Security Engineer", id: "cloud-security", group: "Security", patterns: [r("cloud\\s+security")] },
  { role: "Penetration Tester / Red Team", id: "pentester", group: "Security", patterns: [r("penetration\\s+test"), r("\\bpentest"), r("red\\s+team")] },
  { role: "Security / SOC Analyst", id: "soc-analyst", group: "Security", patterns: [r("\\bsoc\\s+analyst\\b"), r("security\\s+analyst")] },
  { role: "GRC / Security Compliance", id: "grc", group: "Security", patterns: [r("\\bgrc\\b"), r("security\\s+compliance")] },
  { role: "Incident Response / Threat Intelligence", id: "incident-response", group: "Security", patterns: [r("incident\\s+response"), r("threat\\s+intelligence")] },
  { role: "Security Engineer", id: "security-engineer", group: "Security", patterns: [r("security\\s+engineer")] },

  // QA
  { role: "SDET", id: "sdet", group: "Engineering", patterns: [r("\\bsdet\\b")] },
  { role: "QA Automation Engineer", id: "qa-automation", group: "Engineering", patterns: [r("qa\\s+automation"), r("automation\\s+(engineer|qa)"), r("test\\s+automation")] },
  { role: "QA Engineer (Manual)", id: "qa-manual", group: "Engineering", patterns: [r("\\bqa\\b"), r("quality\\s+assurance"), r("test\\s+engineer")] },

  // Product
  { role: "Technical Product Manager", id: "tpm-product", group: "Product", patterns: [r("technical\\s+product\\s+manager")] },
  { role: "Growth Product Manager", id: "growth-pm", group: "Product", patterns: [r("growth\\s+product\\s+manager")] },
  { role: "AI / ML Product Manager", id: "ai-pm", group: "Product", patterns: [r("(ai|ml)\\s+product\\s+manager")] },
  { role: "Data Product Manager", id: "data-pm", group: "Product", patterns: [r("data\\s+product\\s+manager")] },
  { role: "Product Owner", id: "product-owner", group: "Product", patterns: [r("product\\s+owner")] },
  { role: "Product Manager", id: "product-manager", group: "Product", patterns: [r("product\\s+manager"), r("\\bproduct\\s+lead\\b")] },

  // Design
  { role: "Product Designer", id: "product-designer", group: "Design", patterns: [r("product\\s+designer")] },
  { role: "UX Researcher", id: "ux-researcher", group: "Design", patterns: [r("ux\\s+research"), r("user\\s+research")] },
  { role: "Interaction Designer", id: "interaction-designer", group: "Design", patterns: [r("interaction\\s+designer")] },
  { role: "Design Systems Designer", id: "design-systems", group: "Design", patterns: [r("design\\s+system")] },
  { role: "Content Designer / UX Writer", id: "ux-writer", group: "Design", patterns: [r("ux\\s+writer"), r("content\\s+designer")] },
  { role: "Visual / Graphic Designer", id: "graphic-designer", group: "Design", patterns: [r("graphic\\s+designer"), r("visual\\s+designer")] },
  { role: "Motion Designer", id: "motion-designer", group: "Design", patterns: [r("motion\\s+designer")] },
  { role: "UX Designer", id: "ux-designer", group: "Design", patterns: [r("ux\\s+designer")] },
  { role: "UI Designer", id: "ui-designer", group: "Design", patterns: [r("ui\\s+designer")] },

  // Leadership / architects
  { role: "Tech Lead", id: "tech-lead", group: "Engineering", patterns: [r("tech\\s+lead"), r("technical\\s+lead")] },
  { role: "Staff / Principal Engineer", id: "staff-principal", group: "Engineering", patterns: [r("\\bstaff\\s+engineer\\b"), r("\\bprincipal\\s+engineer\\b"), r("\\bdistinguished\\s+engineer\\b")] },
  { role: "Engineering Manager", id: "engineering-manager", group: "Engineering", patterns: [r("engineering\\s+manager"), r("manager,?\\s+engineering")] },
  { role: "Software / Solutions Architect", id: "solutions-architect", group: "Engineering", patterns: [r("solutions?\\s+architect"), r("software\\s+architect")] },

  // Program / project / DevRel
  { role: "Technical Program Manager (TPM)", id: "tpm", group: "Product", patterns: [r("technical\\s+program\\s+manager"), r("\\btpm\\b")] },
  { role: "Project Manager (Tech)", id: "project-manager", group: "Product", patterns: [r("project\\s+manager")] },
  { role: "Scrum Master / Agile Coach", id: "scrum-master", group: "Product", patterns: [r("scrum\\s+master"), r("agile\\s+coach")] },
  { role: "Developer Advocate (DevRel)", id: "devrel", group: "Engineering", patterns: [r("developer\\s+advocate"), r("dev\\s?rel"), r("developer\\s+relations")] },
  { role: "Technical Writer", id: "tech-writer", group: "Engineering", patterns: [r("technical\\s+writer")] },
  { role: "Business / Systems Analyst", id: "business-analyst", group: "Product", patterns: [r("business\\s+analyst"), r("systems\\s+analyst")] },

  // Sales
  { role: "SDR / BDR", id: "sdr-bdr", group: "Sales", patterns: [r("\\bsdr\\b"), r("\\bbdr\\b"), r("sales\\s+development\\s+rep"), r("business\\s+development\\s+rep")] },
  { role: "Account Executive (AE)", id: "ae", group: "Sales", patterns: [r("account\\s+executive")] },
  { role: "Account Manager", id: "account-manager", group: "Sales", patterns: [r("account\\s+manager")] },
  { role: "Sales Engineer / Solutions Engineer", id: "sales-engineer", group: "Sales", patterns: [r("sales\\s+engineer"), r("solutions\\s+engineer")] },
  { role: "Sales Manager", id: "sales-manager", group: "Sales", patterns: [r("sales\\s+manager")] },
  { role: "Sales Director", id: "sales-director", group: "Sales", patterns: [r("sales\\s+director"), r("director\\s+of\\s+sales")] },
  { role: "Revenue Operations (RevOps)", id: "revops", group: "Sales", patterns: [r("rev\\s?ops"), r("revenue\\s+operations")] },
  { role: "Sales Enablement", id: "sales-enablement", group: "Sales", patterns: [r("sales\\s+enablement")] },
  { role: "Partnerships / Channel Manager", id: "partnerships", group: "Sales", patterns: [r("partnership"), r("channel\\s+manager")] },

  // Support / CS
  { role: "Technical Support Engineer", id: "tech-support", group: "Support", patterns: [r("technical\\s+support\\s+engineer"), r("support\\s+engineer")] },
  { role: "Customer Success Manager (CSM)", id: "csm", group: "Support", patterns: [r("customer\\s+success"), r("\\bcsm\\b")] },
  { role: "Support Team Lead", id: "support-lead", group: "Support", patterns: [r("support\\s+team\\s+lead"), r("support\\s+lead")] },
  { role: "Implementation / Onboarding Specialist", id: "implementation", group: "Support", patterns: [r("implementation\\s+specialist"), r("onboarding\\s+specialist")] },
  { role: "Solutions Consultant", id: "solutions-consultant", group: "Support", patterns: [r("solutions\\s+consultant")] },
  { role: "Customer Support Representative", id: "customer-support", group: "Support", patterns: [r("customer\\s+support"), r("customer\\s+service")] },

  // People / HR
  { role: "Technical Recruiter", id: "tech-recruiter", group: "People", patterns: [r("technical\\s+recruiter")] },
  { role: "Sourcer", id: "sourcer", group: "People", patterns: [r("\\bsourcer\\b")] },
  { role: "Recruiting Coordinator", id: "recruiting-coord", group: "People", patterns: [r("recruiting\\s+coordinator")] },
  { role: "HR Business Partner (HRBP)", id: "hrbp", group: "People", patterns: [r("\\bhrbp\\b"), r("hr\\s+business\\s+partner")] },
  { role: "People Ops Specialist", id: "people-ops", group: "People", patterns: [r("people\\s+ops")] },
  { role: "L&D Specialist", id: "l-and-d", group: "People", patterns: [r("learning\\s+(and|&)\\s+development"), r("\\bl&d\\b")] },
  { role: "Compensation & Benefits", id: "comp-benefits", group: "People", patterns: [r("compensation\\s+(and|&)\\s+benefits")] },
  { role: "HR Manager / HR Director", id: "hr-manager", group: "People", patterns: [r("hr\\s+manager"), r("hr\\s+director"), r("head\\s+of\\s+(people|hr)")] },
  { role: "Recruiter", id: "recruiter", group: "People", patterns: [r("\\brecruiter\\b")] },

  // Marketing
  { role: "Growth Marketer", id: "growth-marketer", group: "Marketing", patterns: [r("growth\\s+marketer"), r("growth\\s+marketing")] },
  { role: "Performance / Paid Ads Manager", id: "paid-ads", group: "Marketing", patterns: [r("paid\\s+ads?"), r("performance\\s+marketing")] },
  { role: "SEO Specialist", id: "seo-specialist", group: "Marketing", patterns: [r("\\bseo\\b")] },
  { role: "Content Marketer", id: "content-marketer", group: "Marketing", patterns: [r("content\\s+marketer"), r("content\\s+marketing")] },
  { role: "Social Media Manager (SMM)", id: "smm", group: "Marketing", patterns: [r("social\\s+media\\s+manager"), r("\\bsmm\\b")] },
  { role: "Email / Lifecycle Marketer", id: "lifecycle-marketer", group: "Marketing", patterns: [r("lifecycle\\s+marketer"), r("email\\s+marketer")] },
  { role: "Brand Manager", id: "brand-manager", group: "Marketing", patterns: [r("brand\\s+manager")] },
  { role: "Product Marketing Manager", id: "pmm", group: "Marketing", patterns: [r("product\\s+marketing")] },
  { role: "Marketing Operations", id: "marketing-ops", group: "Marketing", patterns: [r("marketing\\s+operations"), r("marketing\\s+ops")] },
  { role: "PR / Communications", id: "pr-comms", group: "Marketing", patterns: [r("\\bpr\\s+manager"), r("communications\\s+manager"), r("public\\s+relations")] },

  // Emerging tech
  { role: "Blockchain / Web3 Developer", id: "blockchain", group: "Engineering", patterns: [r("blockchain"), r("web3"), r("solidity"), r("smart\\s+contract")] },
  { role: "AR / VR / XR Engineer", id: "arvr-engineer", group: "Engineering", patterns: [r("\\bar\\s?/\\s?vr\\b"), r("\\bxr\\s+engineer"), r("augmented\\s+reality"), r("virtual\\s+reality")] },
  { role: "Robotics Engineer", id: "robotics", group: "Engineering", patterns: [r("robotics")] },

  // Executive
  { role: "CEO", id: "ceo", group: "Executive", patterns: [r("\\bceo\\b"), r("chief\\s+executive")] },
  { role: "COO", id: "coo", group: "Executive", patterns: [r("\\bcoo\\b"), r("chief\\s+operating")] },
  { role: "CFO", id: "cfo", group: "Executive", patterns: [r("\\bcfo\\b"), r("chief\\s+financial")] },
  { role: "CIO", id: "cio", group: "Executive", patterns: [r("\\bcio\\b"), r("chief\\s+information")] },

  // Generic software fallback (LAST)
  { role: "Software Engineer (General)", id: "software-engineer", group: "Engineering", patterns: [r("software\\s+(engineer|developer)"), r("\\bswe\\b"), r("\\bengineer\\b"), r("\\bdeveloper\\b"), r("\\bprogrammer\\b")] },
];

const BY_LABEL = new Map<string, RolePattern>();
for (const p of ROLE_PATTERNS) BY_LABEL.set(p.role.toLowerCase(), p);

export function findRolePattern(label: string): RolePattern | undefined {
  return BY_LABEL.get(label.toLowerCase());
}

/** Extract all roles whose patterns match the title. Stops at the generic fallback. */
export function extractRolesFromTitle(title: string): { roles: string[]; roleIds: string[]; group: string | null } {
  const seen = new Set<string>();
  const roles: string[] = [];
  const roleIds: string[] = [];
  let group: string | null = null;
  for (const p of ROLE_PATTERNS) {
    if (seen.has(p.id)) continue;
    if (p.patterns.some((re) => re.test(title))) {
      // Only accept generic Software Engineer fallback if nothing specific matched
      if (p.id === "software-engineer" && roles.length > 0) break;
      seen.add(p.id);
      roles.push(p.role);
      roleIds.push(p.id);
      if (!group) group = p.group;
      if (p.id === "software-engineer") break;
    }
  }
  if (roles.length === 0) {
    roles.push("Other");
    roleIds.push("other");
  }
  return { roles, roleIds, group };
}

/** True if any user role's patterns match the job title. */
export function userRoleMatchesTitle(userRoles: string[], title: string): boolean {
  const t = title || "";
  for (const label of userRoles) {
    const p = findRolePattern(label);
    if (!p) continue;
    if (p.patterns.some((re) => re.test(t))) return true;
  }
  return false;
}
