import { DEFAULT_VISIBLE_DRIVERS, MONTHS } from "./drivers";
import { recalculate } from "./calc";
import type { AppData, Organisation, Scenario, ScenarioValues, User } from "./types";

export const ORGANISATIONS: Organisation[] = [
  {
    id: "org-merch",
    name: "Merchandising",
    description: "Core retail merchandising forecasts",
  },
  {
    id: "org-ecomm",
    name: "E-Commerce",
    description: "Online channel demand and revenue",
  },
  {
    id: "org-supply",
    name: "Supply Chain",
    description: "Logistics cost and capacity planning",
  },
];

/** Mock users. Every account uses the demo password `demo123`. */
export const USERS: (User & { password: string })[] = [
  {
    username: "ines",
    displayName: "Ines Alvarez",
    role: "inputter",
    password: "demo123",
  },
  {
    username: "ravi",
    displayName: "Ravi Patel",
    role: "reviewer",
    password: "demo123",
  },
];

function monthRow(numbers: number[]): Record<string, number> {
  return Object.fromEntries(MONTHS.map((m, i) => [m, numbers[i] ?? 0]));
}

function seedValues(
  units: number[],
  aur: number[],
  returns: number[],
): ScenarioValues {
  return recalculate({
    units: monthRow(units),
    aur: monthRow(aur),
    returns: monthRow(returns),
    marketingSpend: monthRow([0, 0, 0, 0, 0, 0]),
  });
}

const SEED_TIMESTAMP = "2026-06-01T09:00:00.000Z";

export const SEED_SCENARIOS: Scenario[] = [
  {
    id: "scn-1001",
    orgId: "org-merch",
    name: "FY26 Baseline",
    type: "BUDGET",
    status: "APPROVED",
    createdBy: "ines",
    updatedAt: SEED_TIMESTAMP,
    visibleDrivers: DEFAULT_VISIBLE_DRIVERS,
    values: seedValues(
      [12000, 12500, 13000, 12800, 13500, 14000],
      [24.5, 24.5, 25.0, 25.0, 25.5, 25.5],
      [14000, 14500, 15000, 14800, 15200, 15600],
    ),
    reviewComment: null,
  },
  {
    id: "scn-1002",
    orgId: "org-merch",
    name: "FY26 Working Plan",
    type: "SANDBOX",
    status: "DRAFT",
    createdBy: "ines",
    updatedAt: SEED_TIMESTAMP,
    visibleDrivers: DEFAULT_VISIBLE_DRIVERS,
    values: seedValues(
      [10000, 10200, 10400, 10600, 10800, 11000],
      [22.0, 22.0, 22.5, 22.5, 23.0, 23.0],
      [11000, 11200, 11500, 11700, 12000, 12200],
    ),
    reviewComment: null,
  },
  {
    id: "scn-2001",
    orgId: "org-ecomm",
    name: "FY26 Online Push",
    type: "SANDBOX",
    status: "IN_REVIEW",
    createdBy: "ines",
    updatedAt: SEED_TIMESTAMP,
    visibleDrivers: DEFAULT_VISIBLE_DRIVERS,
    values: seedValues(
      [50000, 52000, 54000, 56000, 58000, 60000],
      [18.0, 18.0, 18.2, 18.2, 18.5, 18.5],
      [90000, 93000, 97000, 101000, 105000, 110000],
    ),
    reviewComment: null,
  },
];

export function seedAppData(): AppData {
  return {
    scenarios: JSON.parse(JSON.stringify(SEED_SCENARIOS)),
    activities: [
      {
        id: "act-seed-1",
        scenarioId: "scn-1001",
        type: "approved",
        actor: "ravi",
        at: SEED_TIMESTAMP,
      },
      {
        id: "act-seed-2",
        scenarioId: "scn-2001",
        type: "submitted",
        actor: "ines",
        at: SEED_TIMESTAMP,
      },
    ],
  };
}
