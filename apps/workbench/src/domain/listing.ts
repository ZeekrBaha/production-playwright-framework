import type { Scenario, ScenarioStatus, ScenarioType } from "./types";

export interface ListFilter {
  search: string;
  status: "ALL" | ScenarioStatus;
  type: "ALL" | ScenarioType;
  sort: "name" | "updated" | "status";
}

export const DEFAULT_LIST_FILTER: ListFilter = {
  search: "",
  status: "ALL",
  type: "ALL",
  sort: "name",
};

const STATUS_ORDER: Record<ScenarioStatus, number> = {
  DRAFT: 0,
  IN_REVIEW: 1,
  CHANGES_REQUESTED: 2,
  APPROVED: 3,
};

export function filterAndSortScenarios(scenarios: Scenario[], filter: ListFilter): Scenario[] {
  const search = filter.search.trim().toLowerCase();
  const filtered = scenarios.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search)) {
      return false;
    }
    if (filter.status !== "ALL" && s.status !== filter.status) {
      return false;
    }
    if (filter.type !== "ALL" && s.type !== filter.type) {
      return false;
    }
    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (filter.sort) {
      case "updated":
        return b.updatedAt.localeCompare(a.updatedAt);
      case "status":
        return (
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        );
      default:
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    }
  });
}
