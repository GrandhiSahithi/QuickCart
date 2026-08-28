import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { subscriptionApi } from "../services/api";
import { frequencyLabel } from "../utils/subscriptionFrequency";

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    return subscriptionApi.mine().then(setSubscriptions).finally(() => setLoading(false));
  }

  function toggleActive(sub) {
    setBusyId(sub.id);
    subscriptionApi.setActive(sub.id, !sub.active).then(load).finally(() => setBusyId(null));
  }

  function cancel(sub) {
    setBusyId(sub.id);
    subscriptionApi.cancel(sub.id).then(load).finally(() => setBusyId(null));
  }

  if (loading) return <main className="page-container"><p>Loading subscriptions...</p></main>;

  if (!subscriptions.length) {
    return (
      <main className="page-container">
        <h1>Never Run Out</h1>
        <div className="empty-state">
          <h2>No subscriptions yet</h2>
          <p>
            Open a grocery, pharmacy, or pet-supply item and tap "Never run out — subscribe" to have it delivered on
            a schedule automatically.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="page-container">
      <h1>Never Run Out</h1>
      <p className="subscriptions-subtitle">Auto-restock across groceries, pharmacy, and pet supplies.</p>

      <div className="orders-list">
        {subscriptions.map((sub) => (
          <div className="subscription-row" key={sub.id}>
            <div className="subscription-row-image" style={{ backgroundImage: `url(${sub.productImageUrl})` }} />
            <div className="subscription-row-info">
              <strong>{sub.productName}</strong>
              <div className="order-row-meta">
                From {sub.storeName} · Qty {sub.quantity} · {frequencyLabel(sub.intervalMinutes)}
              </div>
              <div className="order-row-meta">
                {sub.active
                  ? `Next delivery: ${new Date(sub.nextDeliveryDate).toLocaleString()}`
                  : "Paused"}
              </div>
            </div>
            <div className="subscription-row-actions">
              <button type="button" className="link-button" onClick={() => toggleActive(sub)} disabled={busyId === sub.id}>
                {sub.active ? "Pause" : "Resume"}
              </button>
              <button type="button" className="link-button" onClick={() => cancel(sub)} disabled={busyId === sub.id}>
                Cancel
              </button>
            </div>
          </div>
        ))}
      </div>

      <p className="subscriptions-subtitle">
        Auto-restock orders show up in your <Link to="/orders">order history</Link> like any other order.
      </p>
    </main>
  );
}
