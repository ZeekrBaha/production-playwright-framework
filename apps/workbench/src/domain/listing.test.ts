import { describe, expect, it } from "vitest";
import { filterAndSortScenarios } from "./listing";
import type { Scenario, ScenarioStatus, ScenarioType } from "./types";

function scenario(
  name: string,
  status: ScenarioStatus = "DRAFT",
  type: ScenarioType = "SANDBOX",
  updatedAt = "2026-06-01T00:00:00.000Z",
): Scenario {
  return {
    id: name,
    orgId: "org-merch",
    name,
    type,
    status,
    createdBy: "ines",
    updatedAt,
    visibleDrivers: [],
    values: {},
    reviewComment: null,
  };
}

const SCENARIOS = [
  scenario("Alpha Plan", "DRAFT", "SANDBOX", "2026-06-03T00:00:00.000Z"),
  scenario("beta budget", "APPROVED", "BUDGET", "2026-06-01T00:00:00.000Z"),
  scenario("Gamma Push", "IN_REVIEW", "SANDBOX", "2026-06-02T00:00:00.000Z"),
];

describe("filterAndSortScenarios", () => {
  it("search matches name case-insensitively", () => {
    const result = filterAndSortScenarios(SCENARIOS, {
      search: "BETA",
      status: "ALL",
      type: "ALL",
      sort: "name",
    });
    expect(result.map((s) => s.name)).toEqual(["beta budget"]);
  });

  it("filters by status", () => {
    const result = filterAndSortScenarios(SCENARIOS, {
      search: "",
      status: "IN_REVIEW",
      type: "ALL",
      sort: "name",
    });
    expect(result.map((s) => s.name)).toEqual(["Gamma Push"]);
  });

  it("filters by type", () => {
    const result = filterAndSortScenarios(SCENARIOS, {
      search: "",
      status: "ALL",
      type: "BUDGET",
      sort: "name",
    });
    expect(result.map((s) => s.name)).toEqual(["beta budget"]);
  });

  it("sorts by name ascending, case-insensitively", () => {
    const result = filterAndSortScenarios(SCENARIOS, {
      search: "",
      status: "ALL",
      type: "ALL",
      sort: "name",
    });
    expect(result.map((s) => s.name)).toEqual(["Alpha Plan", "beta budget", "Gamma Push"]);
  });

  it("sorts by most recently updated first", () => {
    const result = filterAndSortScenarios(SCENARIOS, {
      search: "",
      status: "ALL",
      type: "ALL",
      sort: "updated",
    });
    expect(result.map((s) => s.name)).toEqual(["Alpha Plan", "Gamma Push", "beta budget"]);
  });

  it("sorts by workflow status order", () => {
    const result = filterAndSortScenarios(SCENARIOS, {
      search: "",
      status: "ALL",
      type: "ALL",
      sort: "status",
    });
    // DRAFT → IN_REVIEW → CHANGES_REQUESTED → APPROVED
    expect(result.map((s) => s.name)).toEqual(["Alpha Plan", "Gamma Push", "beta budget"]);
  });

  it("returns an empty list when nothing matches", () => {
    const result = filterAndSortScenarios(SCENARIOS, {
      search: "delta",
      status: "ALL",
      type: "ALL",
      sort: "name",
    });
    expect(result).toEqual([]);
  });
});
