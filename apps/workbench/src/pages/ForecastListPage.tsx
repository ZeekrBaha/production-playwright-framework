import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { createForecastApi, copyForecastApi, deleteForecastApi } from "../api/client";
import { CopyForecastModal } from "../components/CopyForecastModal";
import { CreateForecastModal } from "../components/CreateForecastModal";
import { StatusBadge } from "../components/StatusBadge";
import { DEFAULT_LIST_FILTER, filterAndSortScenarios, type ListFilter } from "../domain/listing";
import { ORGANISATIONS } from "../domain/seed";
import { getSession, listScenarios } from "../domain/store";
import type { Scenario, ScenarioType } from "../domain/types";

export function ForecastListPage() {
  const { orgId = "" } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const org = ORGANISATIONS.find((o) => o.id === orgId);
  const [scenarios, setScenarios] = useState(() => listScenarios(orgId));
  const [filter, setFilter] = useState<ListFilter>(DEFAULT_LIST_FILTER);
  const [showCreate, setShowCreate] = useState(false);
  const [copySource, setCopySource] = useState<Scenario | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  if (!org) {
    return <p role="alert">Unknown organisation.</p>;
  }

  const isInputter = session?.role === "inputter";
  const visible = filterAndSortScenarios(scenarios, filter);

  function patchFilter(patch: Partial<ListFilter>) {
    setFilter((prev) => ({ ...prev, ...patch }));
  }

  async function handleCreate(name: string, type: ScenarioType) {
    const scenario = await createForecastApi({
      orgId,
      name,
      type,
      createdBy: session?.username ?? "unknown",
    });
    navigate(`/forecasts/${scenario.id}`);
  }

  async function handleCopy(newName: string) {
    const copy = await copyForecastApi(copySource!.id, newName, session?.username ?? "unknown");
    navigate(`/forecasts/${copy.id}`);
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete forecast "${name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteForecastApi(id);
      setScenarios(listScenarios(orgId));
    } catch (e) {
      setPageError(`Delete failed: ${(e as Error).message}`);
    }
  }

  return (
    <section>
      <p className="muted">
        <Link to="/orgs">Organisations</Link> / {org.name}
      </p>
      <div className="toolbar">
        <h1>{org.name} forecasts</h1>
        <span className="spacer" />
        {isInputter && (
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Create forecast
          </button>
        )}
      </div>

      {pageError && (
        <div className="banner banner-error" role="alert">
          {pageError}
        </div>
      )}

      <div className="toolbar">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="list-search">Search forecasts</label>
          <input
            id="list-search"
            placeholder="Search by name"
            value={filter.search}
            onChange={(e) => patchFilter({ search: e.target.value })}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="list-status">Status</label>
          <select
            id="list-status"
            value={filter.status}
            onChange={(e) => patchFilter({ status: e.target.value as ListFilter["status"] })}
          >
            <option value="ALL">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="IN_REVIEW">In review</option>
            <option value="CHANGES_REQUESTED">Changes requested</option>
            <option value="APPROVED">Approved</option>
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="list-type">Type</label>
          <select
            id="list-type"
            value={filter.type}
            onChange={(e) => patchFilter({ type: e.target.value as ListFilter["type"] })}
          >
            <option value="ALL">All types</option>
            <option value="SANDBOX">Sandbox</option>
            <option value="BUDGET">Budget</option>
          </select>
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="list-sort">Sort by</label>
          <select
            id="list-sort"
            value={filter.sort}
            onChange={(e) => patchFilter({ sort: e.target.value as ListFilter["sort"] })}
          >
            <option value="name">Name</option>
            <option value="updated">Recently updated</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {scenarios.length === 0 ? (
        <p className="muted" data-testid="empty-state">
          No forecasts yet for this organisation.
        </p>
      ) : visible.length === 0 ? (
        <p className="muted" data-testid="no-results">
          No forecasts match your filters.
        </p>
      ) : (
        <div className="table-wrap">
          <table aria-label="Forecasts">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created by</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((scenario) => (
                <tr key={scenario.id} data-testid="scenario-row">
                  <td>
                    <Link to={`/forecasts/${scenario.id}`}>{scenario.name}</Link>
                  </td>
                  <td>{scenario.type === "BUDGET" ? "Budget" : "Sandbox"}</td>
                  <td>
                    <StatusBadge status={scenario.status} />
                  </td>
                  <td>{scenario.createdBy}</td>
                  <td>
                    {isInputter && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setCopySource(scenario)}
                      >
                        Copy
                      </button>
                    )}
                    {isInputter && scenario.status === "DRAFT" && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-danger"
                        onClick={() => handleDelete(scenario.id, scenario.name)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateForecastModal
          existingNames={scenarios.map((s) => s.name)}
          onCreate={handleCreate}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {copySource && (
        <CopyForecastModal
          source={copySource}
          existingNames={scenarios.map((s) => s.name)}
          onCopy={handleCopy}
          onCancel={() => setCopySource(null)}
        />
      )}
    </section>
  );
}
