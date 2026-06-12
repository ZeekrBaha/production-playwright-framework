import { FormEvent, useState } from "react";
import { validateScenarioName } from "../domain/validation";
import type { ScenarioType } from "../domain/types";

interface Props {
  existingNames: string[];
  onCreate: (name: string, type: ScenarioType) => Promise<void>;
  onCancel: () => void;
}

export function CreateForecastModal({ existingNames, onCreate, onCancel }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ScenarioType>("SANDBOX");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationError = validateScenarioName(name, existingNames);
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    try {
      await onCreate(name.trim(), type);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay">
      <form
        className="modal"
        role="dialog"
        aria-labelledby="create-forecast-title"
        onSubmit={handleSubmit}
      >
        <h2 id="create-forecast-title">Create forecast</h2>
        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="forecast-name">Forecast name</label>
          <input
            id="forecast-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="forecast-type">Type</label>
          <select
            id="forecast-type"
            value={type}
            onChange={(e) => setType(e.target.value as ScenarioType)}
          >
            <option value="SANDBOX">Sandbox</option>
            <option value="BUDGET">Budget</option>
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
