import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPasswordChecks, getPasswordStrength, isPasswordValid } from "../utils/password";
import PasswordInput from "../components/PasswordInput";

const AUTH_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=75";

const RULES = [
  { key: "length", label: "At least 8 characters" },
  { key: "upper", label: "One uppercase letter" },
  { key: "lower", label: "One lowercase letter" },
  { key: "number", label: "One number" },
  { key: "special", label: "One special character" }
];

export default function Signup() {
  const { signup, adminSignup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.state?.portal === "admin";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const checks = getPasswordChecks(password);
  const strength = getPasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = name && email && isPasswordValid(password) && passwordsMatch;

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched(true);
    setError(null);

    if (!isPasswordValid(password)) {
      setError("Password doesn't meet all the requirements below.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      if (isAdmin) {
        await adminSignup(name, email, password);
        navigate("/admin");
      } else {
        await signup(name, email, password);
        navigate("/");
      }
    } catch (err) {
      if (err?.response?.status === 409) {
        setError("That email is already registered.");
      } else if (err?.response?.status === 400) {
        setError("Please check your details and try again.");
      } else {
        setError("Couldn't create your account.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-image" style={{ backgroundImage: `url(${AUTH_IMAGE})` }}>
        <div className="auth-image-overlay">
          <p className="auth-logo">QuickCart</p>
          <h2>{isAdmin ? "Create an admin account to manage QuickCart." : "Create an account and start ordering in seconds."}</h2>
        </div>
      </div>

      <div className="auth-form-panel">
        <form className="form-card" onSubmit={handleSubmit}>
          {isAdmin && <p className="admin-badge">ADMIN PORTAL</p>}
          <h1>{isAdmin ? "Create Admin Account" : "Create Account"}</h1>

          <label>Name</label>
          <input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />

          <label>Email</label>
          <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <label>Password</label>
          <PasswordInput
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setTouched(true)}
            required
          />

          {(touched || password) && (
            <div className="password-strength">
              <div className="strength-bar">
                <div className={`strength-bar-fill strength-${strength.score}`} style={{ width: `${(strength.score / 5) * 100}%` }} />
              </div>
              {strength.label && <span className={`strength-label strength-text-${strength.score}`}>{strength.label}</span>}
            </div>
          )}

          <div className="password-rules">
            {RULES.map((rule) => (
              <p key={rule.key} className={checks[rule.key] ? "rule-met" : ""}>
                {checks[rule.key] ? "✓" : "•"} {rule.label}
              </p>
            ))}
          </div>

          <label>Re-enter Password</label>
          <PasswordInput
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          {touched && confirmPassword.length > 0 && !passwordsMatch && (
            <p className="error-text field-error">Passwords don't match</p>
          )}

          {error && <p className="error-text">{error}</p>}

          <button className="primary-button" type="submit" disabled={submitting || !canSubmit}>
            {submitting ? "Creating account..." : isAdmin ? "Create Admin Account" : "Sign Up"}
          </button>

          <p className="auth-switch">
            Already have an account? <Link to="/login" state={isAdmin ? { portal: "admin" } : undefined}>Login</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
