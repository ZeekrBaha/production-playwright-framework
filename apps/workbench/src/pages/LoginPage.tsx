import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../domain/store";

export function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      login(username, password);
      navigate("/dashboard");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>Forecast Workbench</h1>
        {error && (
          <div className="banner banner-error" role="alert">
            {error}
          </div>
        )}
        <div className="field">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button type="submit" className="btn btn-primary">
          Sign in
        </button>
        <p className="login-hint">
          Demo accounts: <code>ines</code> (inputter), <code>ravi</code> (reviewer) — password{" "}
          <code>demo123</code>
        </p>
      </form>
    </div>
  );
}
