import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

const AUTH_IMAGE = "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=75";

export default function Login() {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [portal, setPortal] = useState(location.state?.portal === "admin" ? "admin" : "customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const auth = await login(email, password);

      if (portal === "admin") {
        if (auth.role !== "ADMIN") {
          logout();
          setError("This account doesn't have admin access.");
          setSubmitting(false);
          return;
        }
        navigate("/admin");
        return;
      }

      navigate(auth.role === "ADMIN" ? "/admin" : location.state?.from || "/");
    } catch {
      setError("Invalid email or password.");
      setSubmitting(false);
    }
  }

  const isAdmin = portal === "admin";

  return (
    <main className="auth-page">
      <div className="auth-image" style={{ backgroundImage: `url(${AUTH_IMAGE})` }}>
        <div className="auth-image-overlay">
          <p className="auth-logo">QuickCart</p>
          <h2>Food, groceries, medicine & more — delivered in minutes.</h2>
        </div>
      </div>

      <div className="auth-form-panel">
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="portal-switch">
            <button
              type="button"
              className={portal === "customer" ? "portal-tab active" : "portal-tab"}
              onClick={() => setPortal("customer")}
            >
              Customer Login
            </button>
            <button
              type="button"
              className={portal === "admin" ? "portal-tab active" : "portal-tab"}
              onClick={() => setPortal("admin")}
            >
              Admin Login
            </button>
          </div>

          <h1>{isAdmin ? "QuickCart Admin" : "Welcome back"}</h1>

          <label>Email</label>
          <input
            type="email"
            placeholder={isAdmin ? "admin@quickcart.com" : "you@example.com"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <PasswordInput placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />

          <p className="auth-switch">
            <Link to="/forgot-password" state={{ email }}>Forgot password?</Link>
          </p>

          {error && <p className="error-text">{error}</p>}

          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : isAdmin ? "Sign in to Admin" : "Login"}
          </button>

          {isAdmin ? (
            <p className="auth-switch">
              New admin? <Link to="/signup" state={{ portal: "admin" }}>Create an admin account</Link>
            </p>
          ) : (
            <p className="auth-switch">
              New to QuickCart? <Link to="/signup">Create an account</Link>
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
