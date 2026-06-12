import type { DriverDef } from "./types";

/** Fiscal months covered by every scenario. */
export const MONTHS = [
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
] as const;

export const MONTH_LABELS: Record<string, string> = {
  "2026-01": "Jan 26",
  "2026-02": "Feb 26",
  "2026-03": "Mar 26",
  "2026-04": "Apr 26",
  "2026-05": "May 26",
  "2026-06": "Jun 26",
};

/**
 * Driver catalog. Calculated drivers derive from inputs:
 *   GMV                 = Units × AUR
 *   Net Sales           = GMV − Returns
 *   Contribution Margin = Net Sales − Marketing Spend
 */
export const DRIVER_CATALOG: DriverDef[] = [
  {
    key: "units",
    label: "Units",
    kind: "input",
    format: "int",
    description: "Units sold per month",
  },
  {
    key: "aur",
    label: "AUR",
    kind: "input",
    format: "decimal",
    description: "Average unit retail price",
  },
  {
    key: "returns",
    label: "Returns",
    kind: "input",
    format: "currency",
    description: "Returned merchandise value",
  },
  {
    key: "gmv",
    label: "GMV",
    kind: "calculated",
    format: "currency",
    description: "Gross merchandise value = Units × AUR",
  },
  {
    key: "netSales",
    label: "Net Sales",
    kind: "calculated",
    format: "currency",
    description: "Net sales = GMV − Returns",
  },
  {
    key: "marketingSpend",
    label: "Marketing Spend",
    kind: "input",
    format: "currency",
    description: "Marketing investment per month",
  },
  {
    key: "contributionMargin",
    label: "Contribution Margin",
    kind: "calculated",
    format: "currency",
    description: "Contribution margin = Net Sales − Marketing Spend",
  },
];

export const DEFAULT_VISIBLE_DRIVERS = [
  "units",
  "aur",
  "returns",
  "gmv",
  "netSales",
];

export function driverByKey(key: string): DriverDef {
  const def = DRIVER_CATALOG.find((d) => d.key === key);
  if (!def) {
    throw new Error(`Unknown driver: ${key}`);
  }
  return def;
}
