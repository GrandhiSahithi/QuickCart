import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { accountApi } from "../services/api";

const BENEFITS = [
  { emoji: "🚚", title: "Free delivery", text: "$0 delivery fee on every order, no minimum." },
  { emoji: "⚡", title: "Priority prep", text: "Your orders jump to the front of the queue." },
  { emoji: "🎁", title: "Member-only offers", text: "Extra discounts across every category." },
  { emoji: "💬", title: "Priority support", text: "Faster help whenever you need it." }
];

export default function Premium() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubscribe() {
    setLoading(true);
    setError(null);
    try {
      await accountApi.subscribe();
      await refreshUser();
      navigate("/profile");
    } catch {
      setError("Couldn't complete that. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    setError(null);
    try {
      await accountApi.unsubscribe();
      await refreshUser();
    } catch {
      setError("Couldn't complete that. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-container premium-page">
      <div className="premium-hero">
        <p className="eyebrow">QUICKCART+</p>
        <h1>Free delivery, every order, every store.</h1>
        <p>
          $7.99/month — a couple dollars less than DoorDash DashPass or Uber One, and it covers every
          vertical: food, grocery, medicine, and more.
        </p>
      </div>

      <div className="premium-grid">
        {BENEFITS.map((b) => (
          <div key={b.title} className="premium-benefit">
            <span className="premium-benefit-emoji">{b.emoji}</span>
            <div>
              <strong>{b.title}</strong>
              <p>{b.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="premium-price-card">
        <div>
          <span className="premium-price">$7.99</span>
          <span className="premium-price-period">/month</span>
        </div>

        {error && <p className="error-text">{error}</p>}

        {user.premium ? (
          <>
            <p className="premium-active">✓ You're a QuickCart+ member</p>
            <button className="secondary-button" onClick={handleUnsubscribe} disabled={loading}>
              {loading ? "Cancelling..." : "Cancel membership"}
            </button>
          </>
        ) : (
          <button className="primary-button premium-cta" onClick={handleSubscribe} disabled={loading}>
            {loading ? "Joining..." : "Join QuickCart+"}
          </button>
        )}
      </div>
    </main>
  );
}
