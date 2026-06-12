import { describe, expect, it } from "vitest";
import { recalculate, rowTotal } from "./calc";
import { MONTHS } from "./drivers";
import type { ScenarioValues } from "./types";

function makeValues(
  units: number[],
  aur: number[],
  returns: number[],
  marketingSpend?: number[],
): ScenarioValues {
  const row = (numbers: number[]) => Object.fromEntries(MONTHS.map((m, i) => [m, numbers[i] ?? 0]));
  const values: ScenarioValues = {
    units: row(units),
    aur: row(aur),
    returns: row(returns),
  };
  if (marketingSpend) {
    values.marketingSpend = row(marketingSpend);
  }
  return values;
}

describe("recalculate", () => {
  it("computes GMV as Units × AUR per month", () => {
    const values = makeValues([100, 200], [2.5, 3], [0, 0]);
    const result = recalculate(values);
    expect(result.gmv["2026-01"]).toBe(250);
    expect(result.gmv["2026-02"]).toBe(600);
  });

  it("computes Net Sales as GMV − Returns per month", () => {
    const values = makeValues([100], [10], [150]);
    const result = recalculate(values);
    expect(result.netSales["2026-01"]).toBe(850);
  });

  it("computes Contribution Margin as Net Sales − Marketing Spend", () => {
    const values = makeValues([100], [10], [100], [300]);
    const result = recalculate(values);
    expect(result.contributionMargin["2026-01"]).toBe(600);
  });

  it("treats missing Marketing Spend as zero", () => {
    const values = makeValues([100], [10], [100]);
    const result = recalculate(values);
    expect(result.contributionMargin["2026-01"]).toBe(900);
  });

  it("rounds currency results to 2 decimal places", () => {
    const values = makeValues([3], [3.333333], [0]);
    const result = recalculate(values);
    expect(result.gmv["2026-01"]).toBe(10);
  });

  it("does not mutate the input values", () => {
    const values = makeValues([100], [2], [10]);
    const snapshot = JSON.parse(JSON.stringify(values));
    recalculate(values);
    expect(values).toEqual(snapshot);
  });

  it("fills every month for every calculated driver", () => {
    const values = makeValues([1, 2, 3, 4, 5, 6], [1, 1, 1, 1, 1, 1], []);
    const result = recalculate(values);
    for (const month of MONTHS) {
      expect(result.gmv[month]).toBeTypeOf("number");
      expect(result.netSales[month]).toBeTypeOf("number");
      expect(result.contributionMargin[month]).toBeTypeOf("number");
    }
  });
});

describe("rowTotal", () => {
  it("sums a driver row across all months", () => {
    const values = makeValues([10, 20, 30, 40, 50, 60], [1], [0]);
    expect(rowTotal(values, "units")).toBe(210);
  });

  it("returns 0 for a driver with no values", () => {
    expect(rowTotal({}, "units")).toBe(0);
  });

  it("rounds the total to 2 decimal places", () => {
    const values: ScenarioValues = {
      aur: { "2026-01": 0.1, "2026-02": 0.2 },
    };
    expect(rowTotal(values, "aur")).toBe(0.3);
  });
});
