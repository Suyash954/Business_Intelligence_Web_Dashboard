import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("ceo@company.com");
  const [password, setPassword] = useState("Password123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Sales &amp; Growth Analytics</h1>
        <p className="auth-subtitle">Sign in to access the BI dashboard.</p>
        {error && <div className="auth-error">{error}</div>}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="auth-label">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button className="btn-primary full-width" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
          <div className="auth-hint">
            Demo accounts:
            <br />
            CEO – <code>ceo@company.com</code> / <code>Password123!</code>
            <br />
            Sales Manager – <code>sales.manager@company.com</code> / <code>Password123!</code>
            <br />
            Analyst – <code>analyst@company.com</code> / <code>Password123!</code>
          </div>
        </form>
      </div>
    </div>
  );
}

