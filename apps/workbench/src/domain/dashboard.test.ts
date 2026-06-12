import { describe, expect, it } from "vitest";
import { computeDashboardStats, queueFor } from "./dashboard";
import { MONTHS } from "./drivers";
import type { Scenario, ScenarioStatus } from "./types";

function scenario(
  id: string,
  status: ScenarioStatus,
  gmvPerMonth = 100,
  netSalesPerMonth = 80,
): Scenario {
  return {
    id,
    orgId: "org-merch",
    name: `Scenario ${id}`,
    type: "SANDBOX",
    status,
    createdBy: "ines",
    updatedAt: "2026-06-01T00:00:00.000Z",
    visibleDrivers: [],
    values: {
      gmv: Object.fromEntries(MONTHS.map((m) => [m, gmvPerMonth])),
      netSales: Object.fromEntries(MONTHS.map((m) => [m, netSalesPerMonth])),
    },
    reviewComment: null,
  };
}

describe("computeDashboardStats", () => {
  it("counts scenarios per workflow status", () => {
    const stats = computeDashboardStats([
      scenario("a", "DRAFT"),
      scenario("b", "DRAFT"),
      scenario("c", "IN_REVIEW"),
      scenario("d", "APPROVED"),
      scenario("e", "CHANGES_REQUESTED"),
    ]);
    expect(stats.total).toBe(5);
    expect(stats.draft).toBe(2);
    expect(stats.inReview).toBe(1);
    expect(stats.approved).toBe(1);
    expect(stats.changesRequested).toBe(1);
  });

  it("sums GMV and Net Sales across all scenarios and months", () => {
    const stats = computeDashboardStats([
      scenario("a", "DRAFT", 100, 80),
      scenario("b", "APPROVED", 50, 40),
    ]);
    // 6 months × (100 + 50) and 6 × (80 + 40)
    expect(stats.totalGmv).toBe(900);
    expect(stats.totalNetSales).toBe(720);
  });

  it("returns zeros for an empty list", () => {
    const stats = computeDashboardStats([]);
    expect(stats.total).toBe(0);
    expect(stats.totalGmv).toBe(0);
    expect(stats.totalNetSales).toBe(0);
  });
});

describe("queueFor", () => {
  const scenarios = [
    scenario("a", "DRAFT"),
    scenario("b", "IN_REVIEW"),
    scenario("c", "CHANGES_REQUESTED"),
    scenario("d", "APPROVED"),
  ];

  it("inputter queue contains drafts and change requests", () => {
    expect(queueFor(scenarios, "inputter").map((s) => s.id)).toEqual([
      "a",
      "c",
    ]);
  });

  it("reviewer queue contains forecasts in review", () => {
    expect(queueFor(scenarios, "reviewer").map((s) => s.id)).toEqual(["b"]);
  });
});
