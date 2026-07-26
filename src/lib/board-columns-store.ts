import { useSyncExternalStore } from "react";

export type BoardStage =
  | "saved"
  | "applied"
  | "interview_screen"
  | "interview_tech"
  | "test_task"
  | "offer"
  | "rejection";

export type BoardColumn = {
  id: string;
  title: string;
  stage: BoardStage;
};

export const STAGE_LABEL: Record<BoardStage, string> = {
  saved: "Saved",
  applied: "Applied",
  interview_screen: "Screen interview",
  interview_tech: "Tech interview",
  test_task: "Test task",
  offer: "Offer",
  rejection: "Rejected",
};

// Built-in ids match their stages so drag/drop preserves stage naturally.
export const BUILTIN_COLUMN_IDS = new Set<string>([
  "saved",
  "applied",
  "interview_screen",
  "interview_tech",
  "test_task",
  "offer",
  "rejection",
]);

export const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: "saved", title: "Saved", stage: "saved" },
  { id: "applied", title: "Applied", stage: "applied" },
  { id: "interview_screen", title: "Screen interview", stage: "interview_screen" },
  { id: "interview_tech", title: "Tech interview", stage: "interview_tech" },
  { id: "test_task", title: "Test task", stage: "test_task" },
  { id: "offer", title: "Offer", stage: "offer" },
  { id: "rejection", title: "Rejected", stage: "rejection" },
];

const STORAGE_KEY = "jobly:board-columns:v1";

let columns: BoardColumn[] = load();
const listeners = new Set<() => void>();
let version = 0;

function load(): BoardColumn[] {
  if (typeof window === "undefined") return [...DEFAULT_COLUMNS];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_COLUMNS];
    const parsed = JSON.parse(raw) as BoardColumn[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [...DEFAULT_COLUMNS];
    // Basic validation
    const clean = parsed.filter(
      (c) =>
        c &&
        typeof c.id === "string" &&
        typeof c.title === "string" &&
        typeof c.stage === "string" &&
        (STAGE_LABEL as Record<string, string>)[c.stage] !== undefined,
    );
    return clean.length ? clean : [...DEFAULT_COLUMNS];
  } catch {
    return [...DEFAULT_COLUMNS];
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  } catch {
    // ignore quota errors
  }
}

function emit() {
  version++;
  persist();
  listeners.forEach((l) => l());
}

export function getColumns(): BoardColumn[] {
  return columns;
}

export function useColumns(): BoardColumn[] {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
    () => version,
  );
  return columns;
}

export function isBuiltin(id: string): boolean {
  return BUILTIN_COLUMN_IDS.has(id);
}

export function findColumn(id: string): BoardColumn | undefined {
  return columns.find((c) => c.id === id);
}

// Find the display column for a card given its persisted (columnId?, status).
export function resolveColumnForCard(cardColumnId: string | undefined, status: string): BoardColumn | undefined {
  if (cardColumnId) {
    const hit = columns.find((c) => c.id === cardColumnId);
    if (hit) return hit;
  }
  // Legacy "interview" status → interview_screen
  const stage = status === "interview" ? "interview_screen" : status;
  return columns.find((c) => c.stage === stage);
}

function uid() {
  return `col-${Math.random().toString(36).slice(2, 9)}`;
}

export function addColumn(input: { title: string; stage: BoardStage; afterId?: string }) {
  const col: BoardColumn = { id: uid(), title: input.title.trim() || STAGE_LABEL[input.stage], stage: input.stage };
  const idx = input.afterId ? columns.findIndex((c) => c.id === input.afterId) : -1;
  if (idx >= 0) columns = [...columns.slice(0, idx + 1), col, ...columns.slice(idx + 1)];
  else columns = [...columns, col];
  emit();
  return col.id;
}

export function renameColumn(id: string, title: string) {
  const t = title.trim();
  if (!t) return;
  columns = columns.map((c) => (c.id === id ? { ...c, title: t } : c));
  emit();
}

export function deleteColumn(id: string) {
  if (isBuiltin(id)) return;
  columns = columns.filter((c) => c.id !== id);
  emit();
}

export function moveColumn(id: string, dir: -1 | 1) {
  const idx = columns.findIndex((c) => c.id === id);
  if (idx < 0) return;
  const to = idx + dir;
  if (to < 0 || to >= columns.length) return;
  const next = columns.slice();
  const [item] = next.splice(idx, 1);
  next.splice(to, 0, item);
  columns = next;
  emit();
}

export function reorderColumns(orderedIds: string[]) {
  const byId = new Map(columns.map((c) => [c.id, c]));
  const next: BoardColumn[] = [];
  for (const id of orderedIds) {
    const c = byId.get(id);
    if (c) next.push(c);
  }
  // Preserve any missing (defensive)
  for (const c of columns) if (!orderedIds.includes(c.id)) next.push(c);
  columns = next;
  emit();
}

export function resetColumns() {
  columns = [...DEFAULT_COLUMNS];
  emit();
}