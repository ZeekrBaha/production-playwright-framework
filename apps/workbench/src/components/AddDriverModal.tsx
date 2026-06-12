import { useState } from "react";
import { DRIVER_CATALOG } from "../domain/drivers";

interface Props {
  visibleDrivers: string[];
  onApply: (drivers: string[]) => void;
  onCancel: () => void;
}

export function AddDriverModal({ visibleDrivers, onApply, onCancel }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(visibleDrivers),
  );

  const filtered = DRIVER_CATALOG.filter((d) =>
    d.label.toLowerCase().includes(search.trim().toLowerCase()),
  );

  function toggle(key: string) {
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    setSelected(next);
  }

  function handleApply() {
    // Preserve canonical catalog order regardless of click order.
    const ordered = DRIVER_CATALOG.filter((d) => selected.has(d.key)).map(
      (d) => d.key,
    );
    onApply(ordered);
  }

  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-labelledby="add-drivers-title">
        <h2 id="add-drivers-title">Add drivers</h2>
        <div className="field">
          <label htmlFor="driver-search">Search drivers</label>
          <input
            id="driver-search"
            placeholder="Search drivers"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div role="group" aria-label="Available drivers">
          {filtered.map((driver) => (
            <label key={driver.key} className="driver-option">
              <input
                type="checkbox"
                checked={selected.has(driver.key)}
                onChange={() => toggle(driver.key)}
                aria-label={driver.label}
              />
              <span>
                <span>{driver.label}</span>
                <br />
                <span className="driver-desc">{driver.description}</span>
              </span>
            </label>
          ))}
          {filtered.length === 0 && (
            <p className="muted" data-testid="no-driver-results">
              No drivers match your search.
            </p>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleApply}
            disabled={selected.size === 0}
          >
            Apply drivers
          </button>
        </div>
      </div>
    </div>
  );
}
