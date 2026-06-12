import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { getSession, logout } from "./domain/store";

export function App() {
  return <Outlet />;
}

export function RequireAuth() {
  const session = getSession();
  const location = useLocation();
  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

function Header() {
  const session = getSession();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/dashboard" className="app-title">
          Forecast Workbench
        </Link>
        <nav className="nav-links" aria-label="Main">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/orgs">Organisations</Link>
        </nav>
      </div>
      <div className="header-right">
        <span className="user-chip" data-testid="user-chip">
          {session?.displayName}
          <span className="role-badge" data-testid="role-badge">
            {session?.role}
          </span>
        </span>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
