// Jobly taxonomy access layer.
//
// Design notes (encoded here so downstream UI stays honest):
// - Roles are first-class keywords. A role's `stack`, `hard`, `tools`, `soft`
//   arrays contain CLEAN labels that map 1:1 into `chipLibrary` by
//   (type, label). Do not mutate, prefix, or reformat these labels — they are
//   the join key.
// - A chip's sub-header (its group/category, e.g. "Database", "Framework",
//   "Method") comes from `chipLibrary[i].category`. Never guess or derive it
//   from the label; always look it up via `getChip(type, label)`.
// - Section flags live on `role.sections[section].flag` ('required' |
//   'optional' | 'na'). `heavy` marks sections that should be emphasized
//   (e.g. Soft for exec roles).
// - `axes` (scope / segment / motion) apply only to the roles/levels listed
//   in each axis's `appliesToGroups` / `appliesToLevels` / `appliesToRoles`.

import raw from "./jobly_taxonomy.json";

export type ChipFlag = "required" | "optional" | "na";

export type SectionKey = "stack" | "hard" | "tools" | "soft" | "scope" | "segment";

export interface SectionSpec {
  flag: ChipFlag;
  heavy?: boolean;
}

export interface Role {
  id: string;
  group: string;
  position: string;
  typicalLevel: string;
  track: string;
  sections: Partial<Record<SectionKey, SectionSpec>>;
  soft: string[];
  stack: string[];
  hard: string[];
  tools: string[];
  stackNote?: string;
  toolsNote?: string;
}

export type ChipType = "Stack" | "Hard / Method" | "Tools" | "Soft";

export interface Chip {
  type: ChipType;
  category: string;
  label: string;
  count: number;
}

export type LevelTrack = "Shared" | "IC" | "Mgmt" | "Exec";

export interface LevelRung {
  level: string;
  track: LevelTrack;
  rank: number;
  yearsHint: string;
  titlePattern: string;
  sectionRule: string;
}

export interface TitleCompositionRow {
  function: string;
  head: string;
  vp: string;
  exec: string;
}

export interface AxisField {
  key: string;
  label: string;
  options: string[];
}

export interface Axis {
  appliesToGroups?: string[];
  appliesToLevels?: string[];
  appliesToRoles?: string[];
  fields?: AxisField[];
  field?: AxisField;
}

export interface Axes {
  scope: Axis;
  segment: Axis;
  motion: Axis;
}

interface Taxonomy {
  version: string;
  note: string;
  groups: string[];
  roles: Role[];
  softVocab: string[];
  levelLadder: LevelRung[];
  titleComposition: TitleCompositionRow[];
  chipLibrary: Chip[];
  axes: Axes;
}

const data = raw as unknown as Taxonomy;

// --- Roles -----------------------------------------------------------------

export function getGroups(): string[] {
  return data.groups.slice();
}

export function getRolesByGroup(group: string): Role[] {
  return data.roles.filter((r) => r.group === group);
}

export function searchRoles(query: string): Role[] {
  const q = query.trim().toLowerCase();
  if (!q) return data.roles.slice();
  return data.roles.filter(
    (r) =>
      r.position.toLowerCase().includes(q) ||
      r.group.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q),
  );
}

export function getRole(group: string, position: string): Role | undefined {
  return data.roles.find((r) => r.group === group && r.position === position);
}

// --- Chips -----------------------------------------------------------------

export const chipLibrary: Chip[] = data.chipLibrary;

const chipIndex = new Map<string, Chip>();
for (const c of chipLibrary) {
  chipIndex.set(`${c.type}::${c.label}`, c);
}

export function getChip(type: ChipType, label: string): Chip | undefined {
  return chipIndex.get(`${type}::${label}`);
}

// --- Vocab / ladders / axes ------------------------------------------------

export const softVocab: string[] = data.softVocab;
export const levelLadder: LevelRung[] = data.levelLadder;
export const titleComposition: TitleCompositionRow[] = data.titleComposition;
export const axes: Axes = data.axes;

export const taxonomyVersion = data.version;