import { FormEvent, useState } from "react";
import { validateScenarioName } from "../domain/validation";
import type { Scenario } from "../domain/types";

interface Props {
  source: Scenario;
  existingNames: string[];
  onCopy: (newName: string) => Promise<void>;
  onCancel: () => void;
}

export function CopyForecastModal({ source, existingNames, onCopy, onCancel }: Props) {
  const [name, setName] = useState(`${source.name} (copy)`);
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
      await onCopy(name.trim());
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
        aria-labelledby="copy-forecast-title"
        onSubmit={handleSubmit}
      >
        <h2 id="copy-forecast-title">Copy forecast</h2>
        <p className="muted">
          Copying “{source.name}”. The copy starts as a new draft.
        </p>
        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="copy-name">New forecast name</label>
          <input
            id="copy-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Copying…" : "Copy"}
          </button>
        </div>
      </form>
    </div>
  );
}
