import type { ScenarioStatus } from "../domain/types";

const LABELS: Record<ScenarioStatus, string> = {
  DRAFT: "Draft",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
};

export function StatusBadge({ status }: { status: ScenarioStatus }) {
  return (
    <span className={`status-badge status-${status}`} data-testid="status-badge">
      {LABELS[status]}
    </span>
  );
}
