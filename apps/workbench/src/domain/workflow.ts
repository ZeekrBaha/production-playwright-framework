import type { Role, Scenario, WorkflowAction } from "./types";

/**
 * Workflow state machine:
 *   DRAFT ──submit──▶ IN_REVIEW ──approve──▶ APPROVED
 *                         └──request_changes──▶ CHANGES_REQUESTED ──submit──▶ IN_REVIEW
 */
const TRANSITIONS: Record<WorkflowAction, { from: Scenario["status"][]; to: Scenario["status"] }> = {
  submit: { from: ["DRAFT", "CHANGES_REQUESTED"], to: "IN_REVIEW" },
  approve: { from: ["IN_REVIEW"], to: "APPROVED" },
  request_changes: { from: ["IN_REVIEW"], to: "CHANGES_REQUESTED" },
};

export function canEditScenario(scenario: Scenario, role: Role): boolean {
  return (
    role === "inputter" &&
    (scenario.status === "DRAFT" || scenario.status === "CHANGES_REQUESTED")
  );
}

export function canSubmitScenario(scenario: Scenario, role: Role): boolean {
  return canEditScenario(scenario, role);
}

export function canReviewScenario(scenario: Scenario, role: Role): boolean {
  return role === "reviewer" && scenario.status === "IN_REVIEW";
}

/**
 * Applies a workflow action and returns the updated scenario.
 * Throws on illegal transitions or a missing change-request comment.
 */
export function applyWorkflowAction(
  scenario: Scenario,
  action: WorkflowAction,
  comment?: string,
): Scenario {
  const transition = TRANSITIONS[action];
  if (!transition.from.includes(scenario.status)) {
    throw new Error(
      `Cannot ${action} a scenario in status ${scenario.status}`,
    );
  }
  if (action === "request_changes" && !comment?.trim()) {
    throw new Error("A comment is required when requesting changes");
  }
  return {
    ...scenario,
    status: transition.to,
    reviewComment:
      action === "request_changes" ? comment!.trim() : null,
  };
}
