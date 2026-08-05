import {
  ACHIEVEMENT_LABELS,
  type AchievementBlockKey,
  type AchievementEntry,
  type ApplyMode,
} from "@/lib/profile-store";

/** Quick mentions users can drop into a template. */
export const COVER_LETTER_TOKENS = [
  { token: "{company}", label: "Company", hint: "The company you're applying to" },
  { token: "{role}", label: "Role", hint: "The job title" },
  { token: "{My name}", label: "My name", hint: "Your name from Experience → contact" },
  { token: "{Achievements}", label: "Achievements", hint: "Your selected achievement blocks" },
] as const;

export type CoverLetterContext = {
  company: string;
  role: string;
  myName: string;
  achievements: string;
};

/** Turns template HTML into clean plain text, keeping paragraph breaks. */
export function coverLetterHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Builds the {Achievements} text from the profile's attach-blocks settings. */
export function buildAchievementsText(opts: {
  achievements: Record<AchievementBlockKey, AchievementEntry[]>;
  applyMode: ApplyMode;
  applyBlocks: AchievementBlockKey[];
}): string {
  if (opts.applyMode === "off") return "";
  const lines: string[] = [];
  for (const key of opts.applyBlocks) {
    const entries = (opts.achievements[key] ?? []).filter((e) => e.description.trim());
    if (entries.length === 0) continue;
    lines.push(`${ACHIEVEMENT_LABELS[key]}:`);
    for (const e of entries) {
      const dates = e.dates?.trim() ? ` (${e.dates.trim()})` : "";
      const url = e.url?.trim() ? ` — ${e.url.trim()}` : "";
      lines.push(`• ${e.description.trim()}${dates}${url}`);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}

function replaceToken(text: string, name: string, value: string): string {
  // Tolerates {token}, {{token}}, and any casing/spacing the user typed.
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`\\{\\{?\\s*${escaped}\\s*\\}?\\}`, "gi");
  return text.replace(re, value);
}

/**
 * Composes a template into the final letter text. Unknown/legacy tokens are
 * blanked so nothing raw like "{years}" ships to a recruiter.
 */
export function renderCoverLetter(body: string, ctx: CoverLetterContext): string {
  let text = coverLetterHtmlToText(body);

  // Achievements first: an empty value should not leave a dangling blank block.
  if (ctx.achievements.trim()) {
    text = replaceToken(text, "Achievements", ctx.achievements.trim());
  } else {
    text = text.replace(/\n*\{\{?\s*Achievements\s*\}?\}\n*/gi, "\n\n");
  }

  text = replaceToken(text, "company", ctx.company);
  text = replaceToken(text, "role", ctx.role);
  text = replaceToken(text, "My name", ctx.myName || "(your name)");
  text = replaceToken(text, "my name", ctx.myName || "(your name)");
  text = replaceToken(text, "name", ctx.myName || "(your name)");
  // Legacy placeholders from earlier templates.
  text = replaceToken(text, "hiring manager", "there");
  text = replaceToken(text, "hr_name", "there");
  text = text.replace(/\{\{?[^{}\n]{0,40}\}?\}/g, "").replace(/[ \t]{2,}/g, " ");

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

/** First-line preview for template cards. */
export function coverLetterPreview(body: string, max = 96): string {
  const text = coverLetterHtmlToText(body).replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
