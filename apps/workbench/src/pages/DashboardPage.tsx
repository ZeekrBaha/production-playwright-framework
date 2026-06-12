import { Link } from "react-router-dom";
import { StatusBadge } from "../components/StatusBadge";
import { computeDashboardStats, queueFor } from "../domain/dashboard";
import { getSession, listRecentActivities, loadData } from "../domain/store";
import type { ActivityType } from "../domain/types";

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  created: "created",
  edited: "saved changes to",
  calculated: "ran a calculation on",
  submitted: "submitted",
  approved: "approved",
  changes_requested: "requested changes on",
  copied: "copied into",
};

function currency(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function DashboardPage() {
  const session = getSession();
  const data = loadData();
  const stats = computeDashboardStats(data.scenarios);
  const queue = queueFor(data.scenarios, session?.role ?? "inputter");
  const recent = listRecentActivities(5);
  const scenarioName = (id: string) =>
    data.scenarios.find((s) => s.id === id)?.name ?? "a forecast";

  return (
    <section>
      <h1>Dashboard</h1>

      {stats.total === 0 ? (
        <p className="muted" data-testid="dashboard-empty">
          No forecasts yet. Pick an organisation to create one.
        </p>
      ) : (
        <div className="stat-grid">
          <StatCard label="Total forecasts" testId="card-total" value={String(stats.total)} />
          <StatCard label="Drafts" testId="card-draft" value={String(stats.draft)} />
          <StatCard label="In review" testId="card-in-review" value={String(stats.inReview)} />
          <StatCard label="Approved" testId="card-approved" value={String(stats.approved)} />
          <StatCard label="Total GMV" testId="card-gmv" value={currency(stats.totalGmv)} />
          <StatCard label="Total Net Sales" testId="card-net-sales" value={currency(stats.totalNetSales)} />
        </div>
      )}

      <div className="dash-columns">
        <div className="card">
          <h2>{session?.role === "reviewer" ? "Review queue" : "My queue"}</h2>
          {queue.length === 0 ? (
            <p className="muted" data-testid="queue-empty">
              Nothing in your queue.
            </p>
          ) : (
            <ul className="plain-list">
              {queue.map((scenario) => (
                <li key={scenario.id} data-testid="queue-item">
                  <Link to={`/forecasts/${scenario.id}`}>{scenario.name}</Link>{" "}
                  <StatusBadge status={scenario.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <h2>Recent activity</h2>
          {recent.length === 0 ? (
            <p className="muted" data-testid="activity-empty">
              No activity yet.
            </p>
          ) : (
            <ul className="plain-list">
              {recent.map((event) => (
                <li key={event.id} data-testid="activity-item">
                  <strong>{event.actor}</strong> {ACTIVITY_LABELS[event.type]}{" "}
                  <Link to={`/forecasts/${event.scenarioId}`}>
                    {scenarioName(event.scenarioId)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <div className="card stat-card" data-testid={testId}>
      <span className="stat-label">{label}</span>
      <span className="stat-value" data-testid={`${testId}-value`}>
        {value}
      </span>
    </div>
  );
}
