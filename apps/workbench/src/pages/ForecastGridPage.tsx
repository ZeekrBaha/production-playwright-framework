import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  approveForecastApi,
  calculateForecastApi,
  requestChangesApi,
  saveForecastApi,
  submitForecastApi,
} from "../api/client";
import { AddDriverModal } from "../components/AddDriverModal";
import { CompareModal } from "../components/CompareModal";
import { StatusBadge } from "../components/StatusBadge";
import { recalculate, rowTotal } from "../domain/calc";
import { driverByKey, MONTH_LABELS, MONTHS } from "../domain/drivers";
import { ORGANISATIONS } from "../domain/seed";
import { getScenario, getSession, listActivities, updateScenario } from "../domain/store";
import { parseCellInput, validateScenarioForSave } from "../domain/validation";
import { canEditScenario, canReviewScenario, canSubmitScenario } from "../domain/workflow";
import type { ActivityType, DriverDef, Scenario, ScenarioValues } from "../domain/types";

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  created: "created the forecast",
  edited: "saved changes",
  calculated: "ran a calculation",
  submitted: "submitted for review",
  approved: "approved the forecast",
  changes_requested: "requested changes",
  copied: "created this copy",
};

type CellText = Record<string, Record<string, string>>;
type CellErrors = Record<string, Record<string, string>>;

interface Banner {
  kind: "error" | "info" | "success";
  messages: string[];
}

function textFromValues(scenario: Scenario): CellText {
  const text: CellText = {};
  for (const key of scenario.visibleDrivers) {
    if (driverByKey(key).kind !== "input") {
      continue;
    }
    text[key] = {};
    for (const month of MONTHS) {
      text[key][month] = String(scenario.values[key]?.[month] ?? 0);
    }
  }
  return text;
}

function formatValue(def: DriverDef, value: number): string {
  if (def.format === "currency") {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  if (def.format === "decimal") {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return value.toLocaleString("en-US");
}

export function ForecastGridPage() {
  const { scenarioId = "" } = useParams();
  const session = getSession();
  const [scenario, setScenario] = useState(() => getScenario(scenarioId));
  const [cellText, setCellText] = useState<CellText>(() =>
    scenario ? textFromValues(scenario) : {},
  );
  const [cellErrors, setCellErrors] = useState<CellErrors>({});
  const [banner, setBanner] = useState<Banner | null>(null);
  const [dirty, setDirty] = useState(false);
  const [showDrivers, setShowDrivers] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");

  if (!scenario || !session) {
    return <p role="alert">Forecast not found.</p>;
  }

  const org = ORGANISATIONS.find((o) => o.id === scenario.orgId);
  const editable = canEditScenario(scenario, session.role);
  const reviewable = canReviewScenario(scenario, session.role);

  /**
   * Parses every editable cell. Returns recalculated values,
   * or null when any cell is invalid (errors are set on the cells).
   */
  function parseAndRecalculate(current: Scenario): ScenarioValues | null {
    const errors: CellErrors = {};
    const nextValues: ScenarioValues = JSON.parse(JSON.stringify(current.values));
    let hasErrors = false;

    for (const [driverKey, months] of Object.entries(cellText)) {
      for (const [month, raw] of Object.entries(months)) {
        const result = parseCellInput(driverKey, raw);
        if (result.ok) {
          nextValues[driverKey] = nextValues[driverKey] ?? {};
          nextValues[driverKey][month] = result.value;
        } else {
          errors[driverKey] = errors[driverKey] ?? {};
          errors[driverKey][month] = result.error;
          hasErrors = true;
        }
      }
    }

    setCellErrors(errors);
    if (hasErrors) {
      setBanner({
        kind: "error",
        messages: ["Fix the highlighted cells before continuing"],
      });
      return null;
    }
    return recalculate(nextValues);
  }

  function handleCellChange(driverKey: string, month: string, raw: string) {
    setCellText((prev) => ({
      ...prev,
      [driverKey]: { ...prev[driverKey], [month]: raw },
    }));
    setDirty(true);
  }

  /** Reflects an already-persisted scenario in the UI. */
  function applySaved(saved: Scenario, message: string) {
    setScenario(saved);
    setCellText(textFromValues(saved));
    setDirty(false);
    setBanner({ kind: "success", messages: [message] });
  }

  async function handleCalculate() {
    const values = parseAndRecalculate(scenario!);
    if (!values) {
      return;
    }
    setBusy("calculate");
    try {
      await calculateForecastApi(scenario!.id, session!.username);
      setScenario({ ...scenario!, values });
      setBanner({ kind: "info", messages: ["Calculation complete — unsaved"] });
      setDirty(true);
    } catch {
      setBanner({
        kind: "error",
        messages: ["Calculation failed — please try again"],
      });
    } finally {
      setBusy(null);
    }
  }

  /**
   * Validates and saves via the API. Returns the saved scenario, null on
   * validation failure. API errors propagate to the caller; the user's
   * edits stay in the grid either way.
   */
  async function saveInternal(): Promise<Scenario | null> {
    const values = parseAndRecalculate(scenario!);
    if (!values) {
      return null;
    }
    const businessErrors = validateScenarioForSave(values);
    if (businessErrors.length > 0) {
      setBanner({ kind: "error", messages: businessErrors });
      return null;
    }
    return saveForecastApi({ ...scenario!, values }, session!.username);
  }

  async function handleSave() {
    setBusy("save");
    try {
      const saved = await saveInternal();
      if (saved) {
        applySaved(saved, "Forecast saved");
      }
    } catch {
      setBanner({
        kind: "error",
        messages: ["Save failed — your edits are kept"],
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleSubmit() {
    setBusy("submit");
    try {
      const saved = await saveInternal();
      if (!saved) {
        return;
      }
      const submitted = await submitForecastApi(saved, session!.username);
      applySaved(submitted, "Forecast submitted for review");
    } catch {
      setBanner({
        kind: "error",
        messages: ["Submit failed — please try again"],
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleApprove() {
    setBusy("approve");
    try {
      const approved = await approveForecastApi(scenario!, session!.username);
      applySaved(approved, "Forecast approved");
    } catch {
      setBanner({
        kind: "error",
        messages: ["Action failed — please try again"],
      });
    } finally {
      setBusy(null);
    }
  }

  async function handleRequestChanges() {
    if (!reviewComment.trim()) {
      setBanner({
        kind: "error",
        messages: ["A comment is required when requesting changes"],
      });
      return;
    }
    setBusy("request");
    try {
      const updated = await requestChangesApi(scenario!, reviewComment, session!.username);
      applySaved(updated, "Changes requested");
      setReviewComment("");
    } catch {
      setBanner({
        kind: "error",
        messages: ["Action failed — please try again"],
      });
    } finally {
      setBusy(null);
    }
  }

  function handleApplyDrivers(drivers: string[]) {
    const next = { ...scenario!, visibleDrivers: drivers };
    const saved = updateScenario(next);
    setScenario(saved);
    setCellText(textFromValues(saved));
    setShowDrivers(false);
  }

  return (
    <section>
      <p className="muted">
        <Link to="/orgs">Organisations</Link> /{" "}
        <Link to={`/orgs/${scenario.orgId}`}>{org?.name ?? scenario.orgId}</Link> / {scenario.name}
      </p>

      <div className="toolbar">
        <h1>{scenario.name}</h1>
        <StatusBadge status={scenario.status} />
        {dirty && (
          <span className="muted" data-testid="unsaved-indicator">
            Unsaved changes
          </span>
        )}
        <span className="spacer" />
        <button type="button" className="btn" onClick={() => setShowCompare(true)}>
          Compare
        </button>
        {editable && (
          <>
            <button
              type="button"
              className="btn"
              disabled={busy !== null}
              onClick={() => setShowDrivers(true)}
            >
              Add drivers
            </button>
            <button
              type="button"
              className="btn"
              disabled={busy !== null}
              onClick={handleCalculate}
            >
              {busy === "calculate" ? "Calculating…" : "Calculate"}
            </button>
            <button type="button" className="btn" disabled={busy !== null} onClick={handleSave}>
              {busy === "save" ? "Saving…" : "Save"}
            </button>
            {canSubmitScenario(scenario, session.role) && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy !== null}
                onClick={handleSubmit}
              >
                {busy === "submit" ? "Submitting…" : "Submit for review"}
              </button>
            )}
          </>
        )}
      </div>

      {banner && (
        <div
          className={`banner banner-${banner.kind}`}
          role={banner.kind === "error" ? "alert" : "status"}
          data-testid="grid-banner"
        >
          {banner.messages.map((message) => (
            <div key={message}>{message}</div>
          ))}
        </div>
      )}

      {scenario.status === "CHANGES_REQUESTED" && scenario.reviewComment && (
        <div className="banner banner-error" data-testid="review-comment-banner">
          Reviewer requested changes: “{scenario.reviewComment}”
        </div>
      )}

      {scenario.status === "APPROVED" && (
        <div className="banner banner-info" data-testid="approved-banner">
          This forecast is approved and read-only.
        </div>
      )}

      <table aria-label="Forecast grid">
        <thead>
          <tr>
            <th>Driver</th>
            {MONTHS.map((month) => (
              <th key={month} className="num">
                {MONTH_LABELS[month]}
              </th>
            ))}
            <th className="num">Total</th>
          </tr>
        </thead>
        <tbody>
          {scenario.visibleDrivers.map((driverKey) => {
            const def = driverByKey(driverKey);
            const isEditableRow = editable && def.kind === "input";
            return (
              <tr key={driverKey} data-testid={`driver-row-${driverKey}`}>
                <th scope="row">{def.label}</th>
                {MONTHS.map((month) => (
                  <td key={month} className="num">
                    {isEditableRow ? (
                      <>
                        <input
                          className="cell-input"
                          aria-label={`${def.label} ${MONTH_LABELS[month]}`}
                          data-testid={`cell-${driverKey}-${month}`}
                          aria-invalid={Boolean(cellErrors[driverKey]?.[month])}
                          value={cellText[driverKey]?.[month] ?? ""}
                          onChange={(e) => handleCellChange(driverKey, month, e.target.value)}
                        />
                        {cellErrors[driverKey]?.[month] && (
                          <div
                            className="field-error"
                            data-testid={`cell-error-${driverKey}-${month}`}
                          >
                            {cellErrors[driverKey][month]}
                          </div>
                        )}
                      </>
                    ) : (
                      <span
                        className={def.kind === "calculated" ? "calc-cell" : ""}
                        data-testid={`value-${driverKey}-${month}`}
                      >
                        {formatValue(def, scenario.values[driverKey]?.[month] ?? 0)}
                      </span>
                    )}
                  </td>
                ))}
                <td className="num">
                  <strong data-testid={`total-${driverKey}`}>
                    {formatValue(def, rowTotal(scenario.values, driverKey))}
                  </strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {reviewable && (
        <div className="card" style={{ marginTop: "1rem" }}>
          <h2>Review</h2>
          <div className="field">
            <label htmlFor="review-comment">Comment</label>
            <textarea
              id="review-comment"
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Required when requesting changes"
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-danger"
              disabled={busy !== null}
              onClick={handleRequestChanges}
            >
              {busy === "request" ? "Requesting…" : "Request changes"}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy !== null}
              onClick={handleApprove}
            >
              {busy === "approve" ? "Approving…" : "Approve"}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2>Activity</h2>
        {listActivities(scenario.id).length === 0 ? (
          <p className="muted" data-testid="activity-empty">
            No activity yet.
          </p>
        ) : (
          <ul className="plain-list">
            {listActivities(scenario.id).map((event) => (
              <li key={event.id} data-testid="activity-item">
                <strong>{event.actor}</strong> {ACTIVITY_LABELS[event.type]}
                {event.comment ? <> — “{event.comment}”</> : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showDrivers && (
        <AddDriverModal
          visibleDrivers={scenario.visibleDrivers}
          onApply={handleApplyDrivers}
          onCancel={() => setShowDrivers(false)}
        />
      )}

      {showCompare && <CompareModal scenario={scenario} onClose={() => setShowCompare(false)} />}
    </section>
  );
}
