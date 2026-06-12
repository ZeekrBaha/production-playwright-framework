import { applyWorkflowAction } from "../domain/workflow";
import {
  copyScenario,
  createScenario,
  deleteScenario,
  recordActivity,
  updateScenario,
} from "../domain/store";
import type { Scenario, ScenarioType } from "../domain/types";

/**
 * Thin API client. Every mutation performs a real HTTP round trip against
 * the mock API (acknowledgement + error surface) and applies the change to
 * the client-side store only after the server accepts it — an offline-first
 * shape that lets tests intercept, fail, delay, and assert real requests.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch(
  method: "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "Network error — please try again");
  }
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // non-JSON error body; keep the generic message
    }
    throw new ApiError(response.status, message);
  }
}

export async function createForecastApi(input: {
  orgId: string;
  name: string;
  type: ScenarioType;
  createdBy: string;
}): Promise<Scenario> {
  await apiFetch("POST", "/api/forecasts", {
    orgId: input.orgId,
    name: input.name,
    type: input.type,
  });
  const scenario = createScenario(input);
  recordActivity({
    scenarioId: scenario.id,
    type: "created",
    actor: input.createdBy,
  });
  return scenario;
}

export async function copyForecastApi(
  sourceId: string,
  newName: string,
  actor: string,
): Promise<Scenario> {
  await apiFetch("POST", "/api/forecasts", { copyOf: sourceId, name: newName });
  return copyScenario(sourceId, newName, actor);
}

export async function saveForecastApi(scenario: Scenario, actor: string): Promise<Scenario> {
  await apiFetch("PATCH", `/api/forecasts/${scenario.id}`, {
    scenarioId: scenario.id,
    values: scenario.values,
  });
  const saved = updateScenario(scenario);
  recordActivity({ scenarioId: scenario.id, type: "edited", actor });
  return saved;
}

export async function calculateForecastApi(scenarioId: string, actor: string): Promise<void> {
  await apiFetch("POST", `/api/forecasts/${scenarioId}/calculate`, {
    scenarioId,
  });
  recordActivity({ scenarioId, type: "calculated", actor });
}

export async function submitForecastApi(scenario: Scenario, actor: string): Promise<Scenario> {
  await apiFetch("POST", `/api/forecasts/${scenario.id}/submit`, {
    scenarioId: scenario.id,
    targetStatus: "IN_REVIEW",
  });
  const saved = updateScenario(applyWorkflowAction(scenario, "submit"));
  recordActivity({ scenarioId: scenario.id, type: "submitted", actor });
  return saved;
}

export async function approveForecastApi(scenario: Scenario, actor: string): Promise<Scenario> {
  await apiFetch("POST", `/api/forecasts/${scenario.id}/approve`, {
    scenarioId: scenario.id,
    targetStatus: "APPROVED",
  });
  const saved = updateScenario(applyWorkflowAction(scenario, "approve"));
  recordActivity({ scenarioId: scenario.id, type: "approved", actor });
  return saved;
}

export async function requestChangesApi(
  scenario: Scenario,
  comment: string,
  actor: string,
): Promise<Scenario> {
  await apiFetch("POST", `/api/forecasts/${scenario.id}/request-changes`, {
    scenarioId: scenario.id,
    targetStatus: "CHANGES_REQUESTED",
    comment,
  });
  const saved = updateScenario(applyWorkflowAction(scenario, "request_changes", comment));
  recordActivity({
    scenarioId: scenario.id,
    type: "changes_requested",
    actor,
    comment,
  });
  return saved;
}

export async function deleteForecastApi(scenarioId: string): Promise<void> {
  await apiFetch("DELETE", `/api/forecasts/${scenarioId}`);
  deleteScenario(scenarioId);
}
