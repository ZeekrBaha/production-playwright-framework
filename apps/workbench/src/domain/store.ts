import { DEFAULT_VISIBLE_DRIVERS, MONTHS } from "./drivers";
import { recalculate } from "./calc";
import { seedAppData, USERS } from "./seed";
import type {
  ActivityEvent,
  AppData,
  Scenario,
  ScenarioType,
  User,
} from "./types";

const DATA_KEY = "fw:data";
const SESSION_KEY = "fw:session";

// ── App data ────────────────────────────────────────────────────────────────

export function loadData(): AppData {
  const raw = localStorage.getItem(DATA_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<AppData>;
      return {
        scenarios: parsed.scenarios ?? [],
        activities: parsed.activities ?? [],
      };
    } catch {
      // fall through to reseed on corrupt data
    }
  }
  const data = seedAppData();
  saveData(data);
  return data;
}

export function saveData(data: AppData): void {
  localStorage.setItem(DATA_KEY, JSON.stringify(data));
}

export function resetData(): AppData {
  const data = seedAppData();
  saveData(data);
  return data;
}

export function listScenarios(orgId: string): Scenario[] {
  return loadData()
    .scenarios.filter((s) => s.orgId === orgId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getScenario(id: string): Scenario | undefined {
  return loadData().scenarios.find((s) => s.id === id);
}

export function createScenario(input: {
  orgId: string;
  name: string;
  type: ScenarioType;
  createdBy: string;
}): Scenario {
  const data = loadData();
  const zeroRow = Object.fromEntries(MONTHS.map((m) => [m, 0]));
  const scenario: Scenario = {
    id: `scn-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    orgId: input.orgId,
    name: input.name.trim(),
    type: input.type,
    status: "DRAFT",
    createdBy: input.createdBy,
    updatedAt: new Date().toISOString(),
    visibleDrivers: [...DEFAULT_VISIBLE_DRIVERS],
    values: recalculate({
      units: { ...zeroRow },
      aur: Object.fromEntries(MONTHS.map((m) => [m, 1])),
      returns: { ...zeroRow },
      marketingSpend: { ...zeroRow },
    }),
    reviewComment: null,
  };
  data.scenarios.push(scenario);
  saveData(data);
  return scenario;
}

export function updateScenario(scenario: Scenario): Scenario {
  const data = loadData();
  const index = data.scenarios.findIndex((s) => s.id === scenario.id);
  if (index === -1) {
    throw new Error(`Scenario not found: ${scenario.id}`);
  }
  const updated = { ...scenario, updatedAt: new Date().toISOString() };
  data.scenarios[index] = updated;
  saveData(data);
  return updated;
}

export function deleteScenario(id: string): void {
  const data = loadData();
  data.scenarios = data.scenarios.filter((s) => s.id !== id);
  saveData(data);
}

/**
 * Clones a scenario into a new DRAFT owned by the actor.
 * Values and visible drivers are preserved; the review comment is cleared.
 */
export function copyScenario(
  sourceId: string,
  newName: string,
  actor: string,
): Scenario {
  const data = loadData();
  const source = data.scenarios.find((s) => s.id === sourceId);
  if (!source) {
    throw new Error(`Scenario not found: ${sourceId}`);
  }
  const copy: Scenario = {
    ...JSON.parse(JSON.stringify(source)),
    id: `scn-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    name: newName.trim(),
    status: "DRAFT",
    createdBy: actor,
    updatedAt: new Date().toISOString(),
    reviewComment: null,
  };
  data.scenarios.push(copy);
  saveData(data);
  recordActivity({ scenarioId: copy.id, type: "copied", actor });
  return copy;
}

// ── Activity log ────────────────────────────────────────────────────────────

let activityCounter = 0;

export function recordActivity(
  event: Omit<ActivityEvent, "id" | "at">,
): ActivityEvent {
  const data = loadData();
  activityCounter += 1;
  const full: ActivityEvent = {
    ...event,
    id: `act-${Date.now()}-${activityCounter}`,
    at: new Date().toISOString(),
  };
  data.activities.push(full);
  saveData(data);
  return full;
}

/** Events for one scenario, newest first. */
export function listActivities(scenarioId: string): ActivityEvent[] {
  return loadData()
    .activities.filter((a) => a.scenarioId === scenarioId)
    .reverse();
}

/** Most recent events across all scenarios, newest first. */
export function listRecentActivities(limit: number): ActivityEvent[] {
  return loadData().activities.slice(-limit).reverse();
}

// ── Session ─────────────────────────────────────────────────────────────────

export function getSession(): User | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function login(username: string, password: string): User {
  const account = USERS.find(
    (u) => u.username === username.trim().toLowerCase(),
  );
  if (!account || account.password !== password) {
    throw new Error("Invalid username or password");
  }
  const user: User = {
    username: account.username,
    displayName: account.displayName,
    role: account.role,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}
