import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dropLegacyCache, readUserCache, writeUserCache } from "@/lib/user-cache";

// ---------- Types ----------

// Column *kinds*. Users cannot create new kinds — only Interview is multi-instance.
export type ColumnKind = "saved" | "applied" | "interview" | "offer" | "rejected";

export type BoardColumn = {
  id: string;
  kind: ColumnKind;
  title: string;
  // Ordered list of stage labels a card can hold within this column.
  // Meaningful only for `interview` and `offer` kinds; empty otherwise.
  stages: string[];
};

export const KIND_LABEL: Record<ColumnKind, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

// Kinds that only ever exist as a single column on the board.
export const SINGLETON_KINDS: ColumnKind[] = ["saved", "applied", "offer", "rejected"];

// Fixed ids for the singletons so a card's persisted `columnId` keeps
// resolving across sessions and installs.
export const SINGLETON_IDS: Record<Exclude<ColumnKind, "interview">, string> = {
  saved: "col-saved",
  applied: "col-applied",
  offer: "col-offer",
  rejected: "col-rejected",
};

export const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: SINGLETON_IDS.saved, kind: "saved", title: "Saved", stages: [] },
  { id: SINGLETON_IDS.applied, kind: "applied", title: "Applied", stages: [] },
  {
    id: "col-interview-screen",
    kind: "interview",
    title: "Screen interview",
    stages: ["Recruiter screen", "Hiring manager screen"],
  },
  {
    id: "col-interview-tech",
    kind: "interview",
    title: "Tech interview",
    stages: ["Tech screen", "System design"],
  },
  {
    id: "col-interview-test",
    kind: "interview",
    title: "Take-home",
    stages: ["Assigned", "In progress", "Submitted"],
  },
  {
    id: "col-interview-final",
    kind: "interview",
    title: "Final interview",
    stages: ["Onsite", "Panel", "Culture", "Executive"],
  },
  {
    id: SINGLETON_IDS.offer,
    kind: "offer",
    title: "Offer",
    stages: ["Received", "Negotiating", "Accepted"],
  },
  { id: SINGLETON_IDS.rejected, kind: "rejected", title: "Rejected", stages: [] },
];

const CACHE = "board-columns";
// Pre-namespacing keys: dropped on hydrate, never uploaded to an account.
const LEGACY_STORAGE_KEYS = ["jobly:board-columns:v2", "jobly:board-columns:v1"];

// Map legacy v1 stage identifiers → new column ids (used when migrating a
// v1-persisted layout and when translating cards whose `columnId` still
// points at the old stage identifier).
export const LEGACY_STAGE_TO_COLUMN_ID: Record<string, string> = {
  saved: SINGLETON_IDS.saved,
  applied: SINGLETON_IDS.applied,
  interview_screen: "col-interview-screen",
  interview_tech: "col-interview-tech",
  test_task: "col-interview-test",
  offer: SINGLETON_IDS.offer,
  rejection: SINGLETON_IDS.rejected,
};

// Starts from defaults: the per-account cache is read on hydrate.
let columns: BoardColumn[] = defaults();
const listeners = new Set<() => void>();
let version = 0;

function defaults(): BoardColumn[] {
  return DEFAULT_COLUMNS.map((c) => ({ ...c, stages: [...c.stages] }));
}

function validKind(k: unknown): k is ColumnKind {
  return k === "saved" || k === "applied" || k === "interview" || k === "offer" || k === "rejected";
}

function ensureInvariants(list: BoardColumn[]): BoardColumn[] {
  // Deduplicate singletons — keep the first occurrence, drop the rest.
  const seen = new Set<ColumnKind>();
  const out: BoardColumn[] = [];
  for (const c of list) {
    if (SINGLETON_KINDS.includes(c.kind)) {
      if (seen.has(c.kind)) continue;
      seen.add(c.kind);
    }
    out.push({
      ...c,
      // Pin singleton ids so cards persisted with the fixed ids resolve.
      id: SINGLETON_KINDS.includes(c.kind)
        ? SINGLETON_IDS[c.kind as Exclude<ColumnKind, "interview">]
        : c.id,
      stages: c.kind === "interview" || c.kind === "offer" ? [...(c.stages ?? [])] : [],
    });
  }
  // Add any missing singletons in their canonical order.
  const defaultsList = defaults();
  for (const kind of SINGLETON_KINDS) {
    if (!out.some((c) => c.kind === kind)) {
      const d = defaultsList.find((c) => c.kind === kind)!;
      // saved/applied → prepend; offer → before rejected; rejected → append.
      if (kind === "saved") out.unshift(d);
      else if (kind === "applied") {
        const savedIdx = out.findIndex((c) => c.kind === "saved");
        out.splice(savedIdx + 1, 0, d);
      } else if (kind === "offer") {
        const rejIdx = out.findIndex((c) => c.kind === "rejected");
        if (rejIdx >= 0) out.splice(rejIdx, 0, d);
        else out.push(d);
      } else {
        out.push(d);
      }
    }
  }
  // Ensure at least one interview column exists.
  if (!out.some((c) => c.kind === "interview")) {
    const rejIdx = out.findIndex((c) => c.kind === "rejected");
    const insertAt = rejIdx >= 0 ? rejIdx : out.length;
    out.splice(insertAt, 0, {
      id: `col-${Math.random().toString(36).slice(2, 9)}`,
      kind: "interview",
      title: "Interview",
      stages: [],
    });
  }
  return out;
}

/** Reads this account's cached column set; null when there is nothing usable. */
function loadCached(userId: string): BoardColumn[] | null {
  const parsed = readUserCache<BoardColumn[]>(CACHE, userId);
  if (!Array.isArray(parsed) || !parsed.length) return null;
  const clean = parsed
    .filter((c) => c && typeof c.id === "string" && typeof c.title === "string" && validKind(c.kind))
    .map((c) => ({
      id: c.id,
      kind: c.kind,
      title: c.title,
      stages: Array.isArray(c.stages) ? c.stages.filter((s) => typeof s === "string") : [],
    }));
  return clean.length ? ensureInvariants(clean) : null;
}

function persist() {
  writeUserCache(CACHE, currentUserId, columns);
}

function emit() {
  version++;
  persist();
  listeners.forEach((l) => l());
  scheduleSync();
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

// Deletable rules — mirrors the invariants in deleteColumn().
export function isSingleton(kind: ColumnKind): boolean {
  return SINGLETON_KINDS.includes(kind);
}

export function canDeleteColumn(id: string): boolean {
  const c = columns.find((x) => x.id === id);
  if (!c) return false;
  if (isSingleton(c.kind)) return false;
  if (c.kind === "interview") {
    const remaining = columns.filter((x) => x.kind === "interview").length;
    return remaining > 1;
  }
  return true;
}

export function findColumn(id: string): BoardColumn | undefined {
  return columns.find((c) => c.id === id);
}

// Find the display column for a card given its persisted (columnId?, status).
// Handles both fresh v2 columnIds and legacy v1 columnIds/stages.
export function resolveColumnForCard(cardColumnId: string | undefined, status: string): BoardColumn | undefined {
  const wantedKind = statusToKind(status);
  if (cardColumnId) {
    const hit = columns.find((c) => c.id === cardColumnId);
    // Only honour the stored column when it still matches the card's status.
    // A mismatch means the status changed without the column following (e.g. a
    // drag to Applied whose confirm dialog was dismissed) — fall back to status.
    if (hit && (!wantedKind || hit.kind === wantedKind)) return hit;
    // Legacy column id (v1 stage identifier) → remap
    const remapped = LEGACY_STAGE_TO_COLUMN_ID[cardColumnId];
    if (remapped) {
      const hit2 = columns.find((c) => c.id === remapped);
      if (hit2 && (!wantedKind || hit2.kind === wantedKind)) return hit2;
    }
  }
  // Fall back to status: map to the corresponding kind's column.
  const kind = wantedKind;
  if (!kind) return undefined;
  if (kind === "interview") {
    // First interview column in the current layout.
    return columns.find((c) => c.kind === "interview");
  }
  return columns.find((c) => c.kind === kind);
}

// Map a legacy JobStatus string to its ColumnKind (or null if not a board status).
export function statusToKind(status: string): ColumnKind | null {
  switch (status) {
    case "saved":
      return "saved";
    case "applied":
      return "applied";
    case "interview":
    case "interview_screen":
    case "interview_tech":
    case "test_task":
      return "interview";
    case "offer":
      return "offer";
    case "rejection":
      return "rejected";
    default:
      return null;
  }
}

// Canonical JobStatus string to persist on a JobRecord when it lands in a
// column of this kind. Kept separate from ColumnKind for backwards compat
// with existing status-based selectors (counts, digest hidden ids, etc).
export function statusForKind(kind: ColumnKind): "saved" | "applied" | "interview" | "offer" | "rejection" {
  if (kind === "rejected") return "rejection";
  return kind;
}

function uid() {
  return `col-${Math.random().toString(36).slice(2, 9)}`;
}

// Only Interview columns are user-addable. Inserted just after the last
// existing interview column (or before Offer if none exist).
export function addInterviewColumn(title: string): string {
  const t = title.trim() || "Interview";
  const col: BoardColumn = { id: uid(), kind: "interview", title: t, stages: [] };
  const lastInterviewIdx = (() => {
    let idx = -1;
    for (let i = 0; i < columns.length; i++) if (columns[i].kind === "interview") idx = i;
    return idx;
  })();
  if (lastInterviewIdx >= 0) {
    columns = [...columns.slice(0, lastInterviewIdx + 1), col, ...columns.slice(lastInterviewIdx + 1)];
  } else {
    const rejIdx = columns.findIndex((c) => c.kind === "rejected");
    const offerIdx = columns.findIndex((c) => c.kind === "offer");
    const insertAt = offerIdx >= 0 ? offerIdx : rejIdx >= 0 ? rejIdx : columns.length;
    columns = [...columns.slice(0, insertAt), col, ...columns.slice(insertAt)];
  }
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
  if (!canDeleteColumn(id)) return;
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
  columns = defaults();
  emit();
}

// ---------- Stage CRUD (interview / offer only) ----------

function updateStages(colId: string, mut: (stages: string[]) => string[]) {
  const col = columns.find((c) => c.id === colId);
  if (!col || (col.kind !== "interview" && col.kind !== "offer")) return;
  columns = columns.map((c) => (c.id === colId ? { ...c, stages: mut([...c.stages]) } : c));
  emit();
}

export function addStage(colId: string, name: string) {
  const t = name.trim();
  if (!t) return;
  updateStages(colId, (stages) => (stages.includes(t) ? stages : [...stages, t]));
}

export function renameStage(colId: string, oldName: string, newName: string) {
  const t = newName.trim();
  if (!t) return;
  updateStages(colId, (stages) => stages.map((s) => (s === oldName ? t : s)));
}

export function deleteStage(colId: string, name: string) {
  updateStages(colId, (stages) => stages.filter((s) => s !== name));
}

export function moveStage(colId: string, name: string, dir: -1 | 1) {
  updateStages(colId, (stages) => {
    const idx = stages.indexOf(name);
    if (idx < 0) return stages;
    const to = idx + dir;
    if (to < 0 || to >= stages.length) return stages;
    const next = stages.slice();
    const [item] = next.splice(idx, 1);
    next.splice(to, 0, item);
    return next;
  });
}

// ---------- Account sync ----------
// The column set belongs to the account; localStorage is only an offline cache.

let currentUserId: string | null = null;
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSync() {
  if (!currentUserId) return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncTimer = null;
    void pushColumns();
  }, 400);
}

async function pushColumns() {
  const userId = currentUserId;
  if (!userId) return;
  const snapshot = columns;
  const rows = snapshot.map((c, i) => ({
    user_id: userId,
    column_id: c.id,
    kind: c.kind,
    title: c.title,
    stages: c.stages,
    position: i,
  }));
  const keep = snapshot.map((c) => c.id);
  const { error } = await supabase.from("board_columns").upsert(rows, { onConflict: "user_id,column_id" });
  if (error) return;
  // Drop columns the user removed.
  await supabase
    .from("board_columns")
    .delete()
    .eq("user_id", userId)
    .not("column_id", "in", `(${keep.map((id) => `"${id}"`).join(",")})`);
}

function applyRemote(next: BoardColumn[]) {
  columns = ensureInvariants(next);
  version++;
  persist();
  listeners.forEach((l) => l());
}

/**
 * Loads the account's column set. The server is the only source of truth; when
 * the account has none yet, the defaults are written for that account.
 */
export async function hydrateBoardColumnsFromDb(userId: string) {
  currentUserId = userId;
  dropLegacyCache(...LEGACY_STORAGE_KEYS);
  const cached = loadCached(userId);
  if (cached) applyRemote(cached);
  const { data, error } = await supabase
    .from("board_columns")
    .select("column_id, kind, title, stages, position")
    .eq("user_id", userId)
    .order("position", { ascending: true });
  if (error) return;
  if (data && data.length) {
    applyRemote(
      data
        .filter((r) => validKind(r.kind as ColumnKind))
        .map((r) => ({
          id: r.column_id,
          kind: r.kind as ColumnKind,
          title: r.title,
          stages: Array.isArray(r.stages) ? (r.stages as string[]) : [],
        })),
    );
  } else {
    // Fresh account: start from the defaults, not from whatever this browser held.
    applyRemote(defaults());
    await pushColumns();
  }
}

/** Another account signing in on this tab must not inherit these columns. */
export function resetBoardColumnsForSignOut() {
  currentUserId = null;
  columns = defaults();
  version++;
  listeners.forEach((l) => l());
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
}