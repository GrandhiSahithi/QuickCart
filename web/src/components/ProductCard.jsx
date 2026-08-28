import { useEffect, useState } from "react";
import { productApi, subscriptionApi } from "../services/api";
import { FREQUENCY_OPTIONS } from "../utils/subscriptionFrequency";

const BADGE_LABELS = {
  BESTSELLER: "Bestseller",
  TRENDING: "Trending",
  NEW: "New",
  SALE: "Sale",
  BOGO: "Buy 1 Get 1 Free"
};

// Auto-restock only makes sense for things people actually run out of and
// reorder - not a one-time electronics or fashion purchase.
const SUBSCRIBABLE_VERTICALS = new Set(["GROCERY", "MEDICINE", "PETS"]);

export default function ProductCard({ product, storeVertical, onAdd }) {
  const outOfStock = product.stock <= 0;
  const [alternatives, setAlternatives] = useState([]);
  const [subscribing, setSubscribing] = useState(false);
  const [frequencyMinutes, setFrequencyMinutes] = useState(FREQUENCY_OPTIONS[0].minutes);
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!outOfStock) return;
    let cancelled = false;
    productApi
      .alternatives(product.id)
      .then((data) => {
        if (!cancelled) setAlternatives(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [outOfStock, product.id]);

  function handleSubscribe() {
    setSubmitting(true);
    subscriptionApi
      .create({ productId: product.id, quantity: 1, intervalMinutes: frequencyMinutes })
      .then(() => {
        setSubscribed(true);
        setSubscribing(false);
      })
      .finally(() => setSubmitting(false));
  }

  const canSubscribe = SUBSCRIBABLE_VERTICALS.has(storeVertical) && !outOfStock;

  return (
    <div className="product-card">
      <div className="product-image" style={{ backgroundImage: `url(${product.imageUrl})` }}>
        {product.badge && (
          <span className={`product-badge product-badge-${product.badge.toLowerCase()}`}>
            {BADGE_LABELS[product.badge] || product.badge}
          </span>
        )}
      </div>

      <div className="product-details">
        {product.description && <small>{product.description}</small>}
        <h3>{product.name}</h3>

        <div className="product-bottom">
          <span className="product-price">
            {product.originalPrice && <s className="product-original-price">${product.originalPrice.toFixed(2)}</s>}
            <strong>${product.price.toFixed(2)}</strong>
          </span>
          {outOfStock ? (
            <button disabled className="out-of-stock-button">Out of Stock</button>
          ) : (
            <button onClick={() => onAdd(product)}>ADD</button>
          )}
        </div>

        {outOfStock && alternatives.length > 0 && (
          <div className="product-alternatives">
            <small>Try instead:</small>
            <div className="product-alternatives-row">
              {alternatives.map((alt) => (
                <button key={alt.id} type="button" className="alternative-chip" onClick={() => onAdd(alt)}>
                  {alt.name} · ${alt.price.toFixed(2)}
                </button>
              ))}
            </div>
          </div>
        )}

        {canSubscribe && (
          <div className="product-subscribe">
            {subscribed ? (
              <small className="product-subscribe-confirmed">✓ Auto-restock on</small>
            ) : subscribing ? (
              <div className="product-subscribe-form">
                <select value={frequencyMinutes} onChange={(e) => setFrequencyMinutes(Number(e.target.value))}>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.minutes} value={opt.minutes}>{opt.label}</option>
                  ))}
                </select>
                <button type="button" className="link-button" onClick={handleSubscribe} disabled={submitting}>
                  {submitting ? "Starting..." : "Start"}
                </button>
                <button type="button" className="link-button" onClick={() => setSubscribing(false)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button type="button" className="link-button product-subscribe-link" onClick={() => setSubscribing(true)}>
                🔁 Never run out — subscribe
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
