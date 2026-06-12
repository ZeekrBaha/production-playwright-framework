import { MONTHS } from "./drivers";
import type { ScenarioValues } from "./types";

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function cell(values: ScenarioValues, driverKey: string, month: string): number {
  return values[driverKey]?.[month] ?? 0;
}

/**
 * Derives all calculated driver rows from the input rows.
 * Pure: returns a new object, never mutates the input.
 *
 *   GMV                 = Units × AUR
 *   Net Sales           = GMV − Returns
 *   Contribution Margin = Net Sales − Marketing Spend
 */
export function recalculate(values: ScenarioValues): ScenarioValues {
  const result: ScenarioValues = JSON.parse(JSON.stringify(values));
  result.gmv = {};
  result.netSales = {};
  result.contributionMargin = {};

  for (const month of MONTHS) {
    const gmv = roundMoney(cell(values, "units", month) * cell(values, "aur", month));
    const netSales = roundMoney(gmv - cell(values, "returns", month));
    const contributionMargin = roundMoney(
      netSales - cell(values, "marketingSpend", month),
    );
    result.gmv[month] = gmv;
    result.netSales[month] = netSales;
    result.contributionMargin[month] = contributionMargin;
  }
  return result;
}

/** Sum of a driver row across all months, rounded to 2 decimal places. */
export function rowTotal(values: ScenarioValues, driverKey: string): number {
  const row = values[driverKey] ?? {};
  const total = MONTHS.reduce((sum, month) => sum + (row[month] ?? 0), 0);
  return roundMoney(total);
}
