import { describe, expect, it } from "vitest";
import { applyWorkflowAction, canEditScenario, canReviewScenario } from "./workflow";
import type { Scenario } from "./types";

function scenario(status: Scenario["status"]): Scenario {
  return {
    id: "s1",
    orgId: "org-1",
    name: "Test",
    type: "SANDBOX",
    status,
    createdBy: "ines",
    updatedAt: "2026-01-01T00:00:00.000Z",
    visibleDrivers: [],
    values: {},
    reviewComment: null,
  };
}

describe("canEditScenario", () => {
  it("lets an inputter edit a DRAFT scenario", () => {
    expect(canEditScenario(scenario("DRAFT"), "inputter")).toBe(true);
  });

  it("lets an inputter edit a CHANGES_REQUESTED scenario", () => {
    expect(canEditScenario(scenario("CHANGES_REQUESTED"), "inputter")).toBe(true);
  });

  it("blocks edits on IN_REVIEW and APPROVED scenarios", () => {
    expect(canEditScenario(scenario("IN_REVIEW"), "inputter")).toBe(false);
    expect(canEditScenario(scenario("APPROVED"), "inputter")).toBe(false);
  });

  it("blocks reviewers from editing in any state", () => {
    expect(canEditScenario(scenario("DRAFT"), "reviewer")).toBe(false);
  });
});

describe("canReviewScenario", () => {
  it("lets a reviewer act only on IN_REVIEW scenarios", () => {
    expect(canReviewScenario(scenario("IN_REVIEW"), "reviewer")).toBe(true);
    expect(canReviewScenario(scenario("DRAFT"), "reviewer")).toBe(false);
  });

  it("blocks inputters from reviewing", () => {
    expect(canReviewScenario(scenario("IN_REVIEW"), "inputter")).toBe(false);
  });
});

describe("applyWorkflowAction", () => {
  it("submit moves DRAFT to IN_REVIEW", () => {
    const result = applyWorkflowAction(scenario("DRAFT"), "submit");
    expect(result.status).toBe("IN_REVIEW");
  });

  it("submit moves CHANGES_REQUESTED to IN_REVIEW and clears the comment", () => {
    const s = { ...scenario("CHANGES_REQUESTED"), reviewComment: "fix it" };
    const result = applyWorkflowAction(s, "submit");
    expect(result.status).toBe("IN_REVIEW");
    expect(result.reviewComment).toBeNull();
  });

  it("approve moves IN_REVIEW to APPROVED", () => {
    const result = applyWorkflowAction(scenario("IN_REVIEW"), "approve");
    expect(result.status).toBe("APPROVED");
  });

  it("request_changes moves IN_REVIEW to CHANGES_REQUESTED with the comment", () => {
    const result = applyWorkflowAction(
      scenario("IN_REVIEW"),
      "request_changes",
      "Returns look too high",
    );
    expect(result.status).toBe("CHANGES_REQUESTED");
    expect(result.reviewComment).toBe("Returns look too high");
  });

  it("request_changes without a comment throws", () => {
    expect(() =>
      applyWorkflowAction(scenario("IN_REVIEW"), "request_changes"),
    ).toThrow(/comment/i);
  });

  it("rejects illegal transitions", () => {
    expect(() => applyWorkflowAction(scenario("APPROVED"), "submit")).toThrow();
    expect(() => applyWorkflowAction(scenario("DRAFT"), "approve")).toThrow();
  });
});
