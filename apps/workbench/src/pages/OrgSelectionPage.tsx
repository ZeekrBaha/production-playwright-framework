import { useNavigate } from "react-router-dom";
import { ORGANISATIONS } from "../domain/seed";

export function OrgSelectionPage() {
  const navigate = useNavigate();

  return (
    <section>
      <h1>Select organisation</h1>
      <div className="org-grid">
        {ORGANISATIONS.map((org) => (
          <button
            key={org.id}
            type="button"
            className="card org-card"
            data-testid={`org-card-${org.id}`}
            onClick={() => navigate(`/orgs/${org.id}`)}
          >
            <span className="org-name">{org.name}</span>
            <span className="org-desc">{org.description}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
