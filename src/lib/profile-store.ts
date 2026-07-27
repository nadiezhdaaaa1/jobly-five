import { useSyncExternalStore } from "react";

// ------- Types -------

export type CoverLetter = {
  id: string;
  name: string;
  body: string; // HTML from contenteditable
};

export type LinkRow = {
  id: string;
  type: string; // e.g. "GitHub", "Behance", "Other"
  label?: string; // for "Other"
  url: string;
};

export type SocialRow = {
  id: string;
  network: string;
  url: string;
};

export type PortfolioFile = {
  name: string;
  size: number;
  uploadedAt: string;
};

export type CvFile = {
  name: string;
  size: number;
  uploadedAt: string;
};

export type AchievementEntry = {
  id: string;
  description: string;
  url: string;
};

export type AchievementBlockKey =
  | "speaking"
  | "conferences"
  | "publications"
  | "media"
  | "board"
  | "courses"
  | "awards";

export type ApplyMode = "blocks" | "pdf";

export type ProfileExtras = {
  coverLetters: CoverLetter[];
  defaultCoverLetterId: string | null;
  links: LinkRow[];
  socials: SocialRow[];
  portfolioFile: PortfolioFile | null;
  cvFile: CvFile | null;
  achievements: Record<AchievementBlockKey, AchievementEntry[]>;
  applyMode: ApplyMode;
  applyBlocks: AchievementBlockKey[];
};

const KEY = "jobly.profile.extras";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function seed(): ProfileExtras {
  return {
    coverLetters: [
      {
        id: uid(),
        name: "General — product roles",
        body:
          "<p>Hi {hiring manager},</p><p>I'm excited to apply for the {role} role at {company}. With {years} years shipping product, I've led work that balances craft with speed.</p><p>Would love to share more.</p>",
      },
      {
        id: uid(),
        name: "Leadership & exec",
        body:
          "<p>Hi {hiring manager},</p><p>As a design leader with {years} years scaling teams, I'm drawn to what {company} is building. I'd love to talk about how I could help.</p>",
      },
      {
        id: uid(),
        name: "Startup & high-growth",
        body:
          "<p>Hi {hiring manager},</p><p>The {role} at {company} caught my eye — early stage is where I do my best work. Happy to share a portfolio and past 0→1 stories.</p>",
      },
    ],
    defaultCoverLetterId: null,
    links: [],
    socials: [{ id: uid(), network: "LinkedIn", url: "" }],
    portfolioFile: null,
    cvFile: null,
    achievements: {
      speaking: [],
      conferences: [],
      publications: [],
      media: [],
      board: [],
      courses: [],
      awards: [],
    },
    applyMode: "blocks",
    applyBlocks: ["speaking", "publications", "courses"],
  };
}

function load(): ProfileExtras {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as Partial<ProfileExtras>;
    const base = seed();
    return {
      ...base,
      ...parsed,
      achievements: { ...base.achievements, ...(parsed.achievements ?? {}) },
    };
  } catch {
    return seed();
  }
}

let state: ProfileExtras = load();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function emit() {
  persist();
  for (const l of listeners) l();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

const SERVER_STATE = seed();
function getSnapshot() {
  return state;
}
function getServerSnapshot() {
  return SERVER_STATE;
}

export function useProfileExtras() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// ------- Cover letters -------

export const COVER_LETTER_LIMIT = 10;

export function addCoverLetter(input: { name: string; body: string }): CoverLetter | null {
  if (state.coverLetters.length >= COVER_LETTER_LIMIT) return null;
  const cl: CoverLetter = { id: uid(), name: input.name, body: input.body };
  state = { ...state, coverLetters: [...state.coverLetters, cl] };
  emit();
  return cl;
}

export function updateCoverLetter(id: string, patch: Partial<CoverLetter>) {
  state = {
    ...state,
    coverLetters: state.coverLetters.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  };
  emit();
}

export function duplicateCoverLetter(id: string): boolean {
  if (state.coverLetters.length >= COVER_LETTER_LIMIT) return false;
  const cl = state.coverLetters.find((c) => c.id === id);
  if (!cl) return false;
  state = {
    ...state,
    coverLetters: [...state.coverLetters, { id: uid(), name: `${cl.name} copy`, body: cl.body }],
  };
  emit();
  return true;
}

export function deleteCoverLetter(id: string) {
  state = { ...state, coverLetters: state.coverLetters.filter((c) => c.id !== id) };
  if (state.defaultCoverLetterId === id) {
    state = { ...state, defaultCoverLetterId: null };
  }
  emit();
}

export function setDefaultCoverLetter(id: string | null) {
  state = { ...state, defaultCoverLetterId: id };
  emit();
}

// ------- Links -------

export const LINK_LIMIT = 10;

export function addLink(row: Omit<LinkRow, "id">): LinkRow | null {
  if (state.links.length >= LINK_LIMIT) return null;
  const r = { ...row, id: uid() };
  state = { ...state, links: [...state.links, r] };
  emit();
  return r;
}

export function updateLink(id: string, patch: Partial<LinkRow>) {
  state = { ...state, links: state.links.map((l) => (l.id === id ? { ...l, ...patch } : l)) };
  emit();
}

export function removeLink(id: string) {
  state = { ...state, links: state.links.filter((l) => l.id !== id) };
  emit();
}

// ------- Socials -------

export function addSocial(row: Omit<SocialRow, "id">): SocialRow {
  const r = { ...row, id: uid() };
  state = { ...state, socials: [...state.socials, r] };
  emit();
  return r;
}

export function updateSocial(id: string, patch: Partial<SocialRow>) {
  state = { ...state, socials: state.socials.map((s) => (s.id === id ? { ...s, ...patch } : s)) };
  emit();
}

export function removeSocial(id: string) {
  state = { ...state, socials: state.socials.filter((s) => s.id !== id) };
  emit();
}

// ------- Files -------

export function setPortfolioFile(f: PortfolioFile | null) {
  state = { ...state, portfolioFile: f };
  emit();
}

export function setCvFile(f: CvFile | null) {
  state = { ...state, cvFile: f };
  emit();
}

// ------- Achievements -------

export function addAchievement(block: AchievementBlockKey): AchievementEntry {
  const entry: AchievementEntry = { id: uid(), description: "", url: "" };
  state = {
    ...state,
    achievements: {
      ...state.achievements,
      [block]: [...state.achievements[block], entry],
    },
  };
  emit();
  return entry;
}

export function updateAchievement(
  block: AchievementBlockKey,
  id: string,
  patch: Partial<AchievementEntry>,
) {
  state = {
    ...state,
    achievements: {
      ...state.achievements,
      [block]: state.achievements[block].map((a) => (a.id === id ? { ...a, ...patch } : a)),
    },
  };
  emit();
}

export function removeAchievement(block: AchievementBlockKey, id: string) {
  state = {
    ...state,
    achievements: {
      ...state.achievements,
      [block]: state.achievements[block].filter((a) => a.id !== id),
    },
  };
  emit();
}

export function setApplyMode(mode: ApplyMode) {
  state = { ...state, applyMode: mode };
  emit();
}

export function toggleApplyBlock(block: AchievementBlockKey) {
  const has = state.applyBlocks.includes(block);
  state = {
    ...state,
    applyBlocks: has ? state.applyBlocks.filter((b) => b !== block) : [...state.applyBlocks, block],
  };
  emit();
}

// ------- Field config -------

export type FieldConfig = {
  portfolioTypes: string[];
  socialNetworks: string[];
  suggestedBlocks: AchievementBlockKey[];
  extraPref?: "stack" | "scope" | "segment" | "motion" | "stackMotion";
  portfolioHint?: string;
  achievementExamples?: Partial<Record<AchievementBlockKey, string>>;
};

export const ACHIEVEMENT_LABELS: Record<AchievementBlockKey, string> = {
  speaking: "Speaking",
  conferences: "Conferences and events",
  publications: "Publications",
  media: "Media and channels",
  board: "Board and advisory",
  courses: "Courses and certificates",
  awards: "Awards",
};

const ALL_BLOCKS: AchievementBlockKey[] = [
  "speaking",
  "conferences",
  "publications",
  "media",
  "board",
  "courses",
  "awards",
];

export function orderedBlocks(suggested: AchievementBlockKey[]): AchievementBlockKey[] {
  return [...suggested, ...ALL_BLOCKS.filter((b) => !suggested.includes(b))];
}

const TECH_STACK = "stack" as const;

export const FIELD_CONFIG: Record<string, FieldConfig> = {
  Engineering: {
    portfolioTypes: [
      "GitHub",
      "GitLab",
      "Live product (URL)",
      "App Store / Google Play",
      "Personal site",
      "Dev blog",
      "npm / PyPI",
    ],
    socialNetworks: ["GitHub", "LinkedIn", "X / Twitter", "Stack Overflow", "dev.to"],
    suggestedBlocks: ["courses", "speaking", "media"],
    extraPref: TECH_STACK,
  },
  "Data & AI / ML": {
    portfolioTypes: [
      "GitHub",
      "Kaggle",
      "Hugging Face",
      "Google Scholar / arXiv",
      "Public notebooks",
      "Dashboards",
      "Blog",
    ],
    socialNetworks: ["GitHub", "Kaggle", "Hugging Face", "LinkedIn", "Google Scholar"],
    suggestedBlocks: ["publications", "courses", "speaking"],
    extraPref: TECH_STACK,
  },
  "Infrastructure, DevOps & Cloud": {
    portfolioTypes: ["GitHub (IaC / tooling)", "Tech blog", "Conference talks", "Credly certs", "Personal site"],
    socialNetworks: ["GitHub", "LinkedIn", "X / Twitter"],
    suggestedBlocks: ["courses", "speaking"],
    extraPref: TECH_STACK,
  },
  Security: {
    portfolioTypes: ["GitHub (tools / PoC)", "HackerOne", "Bugcrowd", "CVE credits", "CTF profile", "Writeups"],
    socialNetworks: ["GitHub", "HackerOne", "LinkedIn", "X / Twitter"],
    suggestedBlocks: ["awards", "speaking", "courses"],
    extraPref: TECH_STACK,
  },
  "QA & Testing": {
    portfolioTypes: ["GitHub (test frameworks)", "Test doc samples (PDF)", "Blog"],
    socialNetworks: ["GitHub", "LinkedIn"],
    suggestedBlocks: ["courses"],
    extraPref: TECH_STACK,
  },
  Product: {
    portfolioTypes: ["Case-study site", "Notion portfolio", "Read.cv", "Product decks (PDF)", "Medium"],
    socialNetworks: ["LinkedIn", "X / Twitter", "Medium"],
    suggestedBlocks: ["speaking", "publications", "awards"],
  },
  Design: {
    portfolioTypes: ["Behance", "Dribbble", "Personal site", "Figma Community", "Notion", "Awwwards"],
    socialNetworks: ["Behance", "Dribbble", "Instagram", "LinkedIn"],
    suggestedBlocks: ["awards", "speaking", "media"],
    portfolioHint:
      "Attach your portfolio as a PDF if you don't have a live link (Behance / Dribbble).",
    achievementExamples: {
      speaking: "e.g. Config 2025 talk",
      awards: "e.g. Awwwards SOTD",
    },
  },
  "Engineering Leadership & Architecture": {
    portfolioTypes: ["GitHub", "Tech blog", "Conference talks", "Architecture writeups", "Personal site"],
    socialNetworks: ["LinkedIn", "GitHub", "X / Twitter"],
    suggestedBlocks: ["speaking", "publications", "courses"],
    extraPref: TECH_STACK,
  },
  "C-level / Executive": {
    portfolioTypes: [
      "LinkedIn",
      "Personal site",
      "Thought-leadership articles",
      "Press / interviews",
      "Pitch decks",
      "Board / advisor listings",
    ],
    socialNetworks: ["LinkedIn", "X / Twitter"],
    suggestedBlocks: ["speaking", "media", "board", "awards"],
    extraPref: "scope",
  },
  "Program, Project & Technical-Adjacent": {
    portfolioTypes: ["LinkedIn", "Case-study site", "Writing samples", "Read the Docs", "YouTube", "GitHub"],
    socialNetworks: ["LinkedIn", "GitHub", "X / Twitter", "Medium"],
    suggestedBlocks: ["speaking", "publications", "courses"],
  },
  Sales: {
    portfolioTypes: ["LinkedIn", "Personal site", "RepVue profile"],
    socialNetworks: ["LinkedIn", "X / Twitter"],
    suggestedBlocks: ["awards", "speaking"],
    extraPref: "segment",
  },
  "Support & Customer Success": {
    portfolioTypes: ["LinkedIn", "GitHub", "Personal site"],
    socialNetworks: ["LinkedIn"],
    suggestedBlocks: ["courses", "awards"],
  },
  "HR & Recruitment / People": {
    portfolioTypes: ["LinkedIn", "Personal site", "HR content / blog"],
    socialNetworks: ["LinkedIn", "X / Twitter"],
    suggestedBlocks: ["speaking", "courses", "publications"],
  },
  Marketing: {
    portfolioTypes: [
      "Case-study site",
      "Published articles",
      "Managed socials",
      "Decks",
      "Muck Rack (PR)",
      "Behance / Vimeo",
    ],
    socialNetworks: ["LinkedIn", "Instagram", "TikTok", "YouTube", "X / Twitter", "Medium"],
    suggestedBlocks: ["speaking", "publications", "awards"],
    extraPref: "motion",
  },
  "Emerging / Specialized": {
    portfolioTypes: ["GitHub", "Etherscan / live dApps", "Demo videos", "App Store", "Sketchfab", "Personal site"],
    socialNetworks: ["GitHub", "X / Twitter", "LinkedIn"],
    suggestedBlocks: ["publications", "speaking", "courses"],
    extraPref: TECH_STACK,
  },
};

export const DEFAULT_FIELD_CONFIG: FieldConfig = FIELD_CONFIG.Design;

export function fieldConfig(field: string | undefined): FieldConfig {
  if (!field) return DEFAULT_FIELD_CONFIG;
  return FIELD_CONFIG[field] ?? DEFAULT_FIELD_CONFIG;
}

export const ALL_SOCIAL_NETWORKS = [
  "LinkedIn",
  "GitHub",
  "GitLab",
  "X / Twitter",
  "Personal website",
  "Behance",
  "Dribbble",
  "Instagram",
  "TikTok",
  "YouTube",
  "Vimeo",
  "ArtStation",
  "Facebook",
  "Threads",
  "Bluesky",
  "Pinterest",
  "Medium",
  "Substack",
  "Stack Overflow",
  "dev.to",
  "Kaggle",
  "Hugging Face",
  "Google Scholar",
  "ORCID",
  "HackerOne",
  "Bugcrowd",
  "Read.cv",
  "Muck Rack",
  "Other",
];