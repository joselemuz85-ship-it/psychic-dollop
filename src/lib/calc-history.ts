// WeldSizer — Calculation History (localStorage)
// Paid tier feature — available during preview

const STORAGE_KEY = "weldsizer-calc-history";
const MAX_ENTRIES = 50;

export interface CalcHistoryEntry {
  id: string;
  timestamp: number;
  thickness: string;
  jointType: string;
  materialType: string;
  materialGrade?: string;
  codeStandard: string;
  customCodeNote?: string;
  unitSystem: string;
  legSize: number;
  legSizeInches: number;
  throat: number;
  throatInches: number;
  codeNote: string;
}

export function loadHistory(): CalcHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CalcHistoryEntry[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.timestamp - a.timestamp) : [];
  } catch {
    return [];
  }
}

export function saveCalculation(entry: Omit<CalcHistoryEntry, "id" | "timestamp">): void {
  try {
    const history = loadHistory();
    const newEntry: CalcHistoryEntry = {
      ...entry,
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
    };
    history.unshift(newEntry);
    // Keep only MAX_ENTRIES
    while (history.length > MAX_ENTRIES) {
      history.pop();
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Silently fail — localStorage might be full or unavailable
  }
}

export function deleteEntry(id: string): void {
  try {
    const history = loadHistory().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Silently fail
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Human-friendly label helpers (mirroring the UI labels without importing React stuff)
export const JOINT_LABELS: Record<string, string> = {
  fillet: "Fillet",
  butt: "Butt",
  groove: "Groove",
  socket: "Socket",
  lap: "Lap",
};

export const MATERIAL_LABELS: Record<string, string> = {
  "carbon-steel": "C.Steel",
  "stainless-steel": "S.Steel",
  "aluminum": "Aluminum",
};

export const CODE_LABELS: Record<string, string> = {
  general: "General",
  "aws-d1.1": "AWS D1.1",
  "asme-b31.3": "ASME B31.3",
  custom: "Custom",
};