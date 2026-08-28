import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import OtpInput from "../components/OtpInput";

const AUTH_IMAGE = "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=1200&q=75";
const RESEND_COOLDOWN = 30;

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(location.state?.email || "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleEmailSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await forgotPassword(email);
      setStep("reset");
      setCode("");
      setInfo(`We sent a 6-digit code to ${email}.`);
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError("We couldn't find an account with that email.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      const auth = await resetPassword(email, code, newPassword);
      navigate(auth.role === "ADMIN" ? "/admin" : "/");
    } catch {
      setError("That code is invalid or has expired, or the password doesn't meet requirements.");
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    try {
      await forgotPassword(email);
      setInfo("We sent you a new code.");
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError("Couldn't resend the code. Please try again shortly.");
    }
  }

  function backToEmail() {
    setStep("email");
    setCode("");
    setNewPassword("");
    setConfirmPassword("");
    setError(null);
    setInfo(null);
  }

  return (
    <main className="auth-page">
      <div className="auth-image" style={{ backgroundImage: `url(${AUTH_IMAGE})` }}>
        <div className="auth-image-overlay">
          <p className="auth-logo">QuickCart</p>
          <h2>Food, groceries, medicine & more — delivered in minutes.</h2>
        </div>
      </div>

      <div className="auth-form-panel">
        {step === "email" ? (
          <form className="form-card" onSubmit={handleEmailSubmit}>
            <h1>Reset your password</h1>
            <p className="otp-subtitle">Enter your account email and we'll send you a verification code.</p>

            <label>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {error && <p className="error-text">{error}</p>}

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Sending code..." : "Send code"}
            </button>

            <p className="auth-switch">
              Remembered it? <Link to="/login">Back to login</Link>
            </p>
          </form>
        ) : (
          <form className="form-card" onSubmit={handleResetSubmit}>
            <h1>Enter your code</h1>
            <p className="otp-subtitle">{info}</p>

            <OtpInput value={code} onChange={setCode} />

            <label>New password</label>
            <PasswordInput
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <label>Confirm password</label>
            <PasswordInput
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {error && <p className="error-text field-error">{error}</p>}

            <button className="primary-button" type="submit" disabled={submitting || code.length !== 6}>
              {submitting ? "Resetting..." : "Reset password"}
            </button>

            <div className="otp-actions">
              <button type="button" className="link-button" onClick={handleResend} disabled={cooldown > 0}>
                {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
              </button>
              <button type="button" className="link-button" onClick={backToEmail}>
                Use a different email
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
