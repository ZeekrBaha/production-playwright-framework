import { useState } from "react";
import { rowTotal } from "../domain/calc";
import { driverByKey } from "../domain/drivers";
import { listScenarios } from "../domain/store";
import type { Scenario } from "../domain/types";

interface Props {
  scenario: Scenario;
  onClose: () => void;
}

function money(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Read-only comparison of full-year totals against another forecast. */
export function CompareModal({ scenario, onClose }: Props) {
  const candidates = listScenarios(scenario.orgId).filter((s) => s.id !== scenario.id);
  const [targetId, setTargetId] = useState("");
  const [target, setTarget] = useState<Scenario | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCompare() {
    const found = candidates.find((s) => s.id === targetId);
    if (!found) {
      setError("Select a forecast to compare");
      return;
    }
    setError(null);
    setTarget(found);
  }

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-labelledby="compare-title">
        <h2 id="compare-title">Compare forecasts</h2>
        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="compare-target">Compare with</label>
          <select
            id="compare-target"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">Select a forecast…</option>
            {candidates.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCompare}>
            Compare
          </button>
        </div>

        {target && (
          <div className="table-wrap" style={{ marginTop: "1rem" }}>
            <table aria-label="Comparison">
              <thead>
                <tr>
                  <th>Driver (full-year total)</th>
                  <th className="num">{scenario.name}</th>
                  <th className="num">{target.name}</th>
                  <th className="num">Delta</th>
                </tr>
              </thead>
              <tbody>
                {scenario.visibleDrivers.map((key) => {
                  const thisTotal = rowTotal(scenario.values, key);
                  const otherTotal = rowTotal(target.values, key);
                  const delta = Math.round((thisTotal - otherTotal) * 100) / 100;
                  return (
                    <tr key={key} data-testid={`compare-row-${key}`}>
                      <th scope="row">{driverByKey(key).label}</th>
                      <td className="num" data-testid={`compare-this-${key}`}>
                        {money(thisTotal)}
                      </td>
                      <td className="num" data-testid={`compare-other-${key}`}>
                        {money(otherTotal)}
                      </td>
                      <td className="num" data-testid={`compare-delta-${key}`}>
                        {money(delta)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
