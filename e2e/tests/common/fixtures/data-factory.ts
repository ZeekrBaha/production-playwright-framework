/**
 * Deterministic test-data builders. The factory keeps its own copy of the
 * business formulas so specs can assert against an independent oracle
 * instead of trusting the application's calculation engine.
 */

export const MONTHS = [
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
] as const;

export type Month = (typeof MONTHS)[number];

export type ScenarioStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export interface SeedScenario {
  id: string;
  orgId: string;
  name: string;
  type: "SANDBOX" | "BUDGET";
  status: ScenarioStatus;
  createdBy: string;
  updatedAt: string;
  visibleDrivers: string[];
  values: Record<string, Record<string, number>>;
  reviewComment: string | null;
}

export interface ScenarioInputs {
  units: number[];
  aur: number[];
  returns: number[];
  marketingSpend?: number[];
}

const DEFAULT_VISIBLE_DRIVERS = ["units", "aur", "returns", "gmv", "netSales"];

function monthRow(numbers: number[]): Record<string, number> {
  return Object.fromEntries(MONTHS.map((m, i) => [m, numbers[i] ?? 0]));
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

// ── Independent business-rule oracle ────────────────────────────────────────

export function expectedGmv(units: number, aur: number): number {
  return roundMoney(units * aur);
}

export function expectedNetSales(
  units: number,
  aur: number,
  returns: number,
): number {
  return roundMoney(expectedGmv(units, aur) - returns);
}

export function expectedContributionMargin(
  units: number,
  aur: number,
  returns: number,
  marketingSpend: number,
): number {
  return roundMoney(expectedNetSales(units, aur, returns) - marketingSpend);
}

/** Matches the app's currency formatting (en-US, always 2 decimals). */
export function asCurrency(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Named test states (presets) ─────────────────────────────────────────────

/**
 * Reusable, intention-revealing input states. Specs reference presets by
 * meaning ("a scenario that will fail the net-sales rule") instead of
 * repeating raw numbers.
 */
export const SCENARIO_PRESETS = {
  /** Passes every business rule. units=100 × aur=10 − returns=50 per month. */
  healthy: {
    units: [100, 100, 100, 100, 100, 100],
    aur: [10, 10, 10, 10, 10, 10],
    returns: [50, 50, 50, 50, 50, 50],
  },
  /** Month-over-month growth — useful for totals and sorting assertions. */
  ramping: {
    units: [100, 200, 300, 400, 500, 600],
    aur: [10, 10, 10, 10, 10, 10],
    returns: [50, 50, 50, 50, 50, 50],
  },
  /** Returns exceed GMV every month — Save must be blocked. */
  negativeNetSales: {
    units: [10, 10, 10, 10, 10, 10],
    aur: [1, 1, 1, 1, 1, 1],
    returns: [500, 500, 500, 500, 500, 500],
  },
} satisfies Record<string, ScenarioInputs>;

// ── Builders ────────────────────────────────────────────────────────────────

let scenarioCounter = 0;

export function buildScenario(overrides: {
  name: string;
  orgId?: string;
  status?: ScenarioStatus;
  inputs?: ScenarioInputs;
  visibleDrivers?: string[];
  reviewComment?: string | null;
  updatedAt?: string;
}): SeedScenario {
  scenarioCounter += 1;
  const inputs: ScenarioInputs = overrides.inputs ?? SCENARIO_PRESETS.healthy;

  const values: Record<string, Record<string, number>> = {
    units: monthRow(inputs.units),
    aur: monthRow(inputs.aur),
    returns: monthRow(inputs.returns),
    marketingSpend: monthRow(inputs.marketingSpend ?? [0, 0, 0, 0, 0, 0]),
    gmv: {},
    netSales: {},
    contributionMargin: {},
  };
  MONTHS.forEach((month, i) => {
    const units = inputs.units[i] ?? 0;
    const aur = inputs.aur[i] ?? 0;
    const returns = inputs.returns[i] ?? 0;
    const marketing = inputs.marketingSpend?.[i] ?? 0;
    values.gmv[month] = expectedGmv(units, aur);
    values.netSales[month] = expectedNetSales(units, aur, returns);
    values.contributionMargin[month] = expectedContributionMargin(
      units,
      aur,
      returns,
      marketing,
    );
  });

  return {
    id: `e2e-scn-${scenarioCounter}`,
    orgId: overrides.orgId ?? "org-merch",
    name: overrides.name,
    type: "SANDBOX",
    status: overrides.status ?? "DRAFT",
    createdBy: "ines",
    updatedAt: overrides.updatedAt ?? "2026-06-11T00:00:00.000Z",
    visibleDrivers: overrides.visibleDrivers ?? [...DEFAULT_VISIBLE_DRIVERS],
    values,
    reviewComment: overrides.reviewComment ?? null,
  };
}
