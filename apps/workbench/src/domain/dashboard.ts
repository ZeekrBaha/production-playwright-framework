import { rowTotal } from "./calc";
import type { Role, Scenario } from "./types";

export interface DashboardStats {
  total: number;
  draft: number;
  inReview: number;
  approved: number;
  changesRequested: number;
  totalGmv: number;
  totalNetSales: number;
}

/** Aggregates portfolio-level KPIs across all scenarios. */
export function computeDashboardStats(scenarios: Scenario[]): DashboardStats {
  const byStatus = (status: Scenario["status"]) =>
    scenarios.filter((s) => s.status === status).length;

  const sumDriver = (driverKey: string) =>
    Math.round(
      scenarios.reduce((sum, s) => sum + rowTotal(s.values, driverKey), 0) * 100,
    ) / 100;

  return {
    total: scenarios.length,
    draft: byStatus("DRAFT"),
    inReview: byStatus("IN_REVIEW"),
    approved: byStatus("APPROVED"),
    changesRequested: byStatus("CHANGES_REQUESTED"),
    totalGmv: sumDriver("gmv"),
    totalNetSales: sumDriver("netSales"),
  };
}

/**
 * The scenarios a user should act on next:
 * inputters own drafts and change requests, reviewers own reviews.
 */
export function queueFor(scenarios: Scenario[], role: Role): Scenario[] {
  const statuses: Scenario["status"][] =
    role === "reviewer" ? ["IN_REVIEW"] : ["DRAFT", "CHANGES_REQUESTED"];
  return scenarios.filter((s) => statuses.includes(s.status));
}
