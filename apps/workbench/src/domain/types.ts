export type DriverKind = "input" | "calculated";
export type DriverFormat = "int" | "decimal" | "currency";

export interface DriverDef {
  key: string;
  label: string;
  kind: DriverKind;
  format: DriverFormat;
  description: string;
}

export type ScenarioStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "CHANGES_REQUESTED";

export type ScenarioType = "SANDBOX" | "BUDGET";

/** values[driverKey][month] = number */
export type ScenarioValues = Record<string, Record<string, number>>;

export interface Scenario {
  id: string;
  orgId: string;
  name: string;
  type: ScenarioType;
  status: ScenarioStatus;
  createdBy: string;
  updatedAt: string;
  visibleDrivers: string[];
  values: ScenarioValues;
  reviewComment: string | null;
}

export type Role = "inputter" | "reviewer";

export interface User {
  username: string;
  displayName: string;
  role: Role;
}

export interface Organisation {
  id: string;
  name: string;
  description: string;
}

export type ActivityType =
  | "created"
  | "edited"
  | "calculated"
  | "submitted"
  | "approved"
  | "changes_requested"
  | "copied";

export interface ActivityEvent {
  id: string;
  scenarioId: string;
  type: ActivityType;
  actor: string;
  comment?: string;
  at: string;
}

export interface AppData {
  scenarios: Scenario[];
  activities: ActivityEvent[];
}

export type WorkflowAction = "submit" | "approve" | "request_changes";
