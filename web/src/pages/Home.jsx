import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CategoryCard from "../components/CategoryCard";
import StoreCard from "../components/StoreCard";
import { storeApi, orderApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLocationContext } from "../context/LocationContext";
import { VERTICALS } from "../constants/verticals";

const OFFERS = [
  { emoji: "🎉", title: "50% off your first order", text: "New customers save big on their first checkout.", vertical: "FOOD" },
  { emoji: "🚚", title: "Free delivery with QuickCart+", text: "Join for $7.99/mo and never pay a delivery fee again.", to: "/premium" },
  { emoji: "💊", title: "20% off Medicine this week", text: "Pharmacy essentials, discounted through Sunday.", vertical: "MEDICINE" }
];

const HERO_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=70";

export default function Home() {
  const { user } = useAuth();
  const { location } = useLocationContext();
  const [vertical, setVertical] = useState("FOOD");
  const [stores, setStores] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);

  function handleOfferClick(offer) {
    setVertical(offer.vertical);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  useEffect(() => {
    orderApi
      .mine()
      .then((data) => setRecentOrders(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    storeApi
      .list(vertical, location)
      .then((data) => {
        if (!cancelled) setStores(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load stores. Is the backend running on localhost:8080?");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vertical, location]);

  const activeLabel = VERTICALS.find((v) => v.key === vertical)?.label;
  const firstName = user?.name?.split(" ")[0];

  return (
    <main>
      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(24, 27, 33, 0.88), rgba(16, 18, 22, 0.94)), url(${HERO_IMAGE})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div>
          <p className="eyebrow">DELIVERED FAST</p>
          <h1>{firstName ? `Hi ${firstName}, what are you ordering today?` : "What are you ordering today?"}</h1>
          <p>
            Order from {activeLabel?.toLowerCase()} and track it live as it arrives
            {location ? ` — delivering to ${location.label}` : ""}.
          </p>
        </div>
      </section>

      <div className="page-container">
        <section>
          <div className="section-title">
            <h2>Offers for you</h2>
          </div>
          <div className="premium-grid">
            {OFFERS.map((o) =>
              o.to ? (
                <Link key={o.title} to={o.to} className="premium-benefit offer-card">
                  <span className="premium-benefit-emoji">{o.emoji}</span>
                  <div>
                    <strong>{o.title}</strong>
                    <p>{o.text}</p>
                  </div>
                </Link>
              ) : (
                <button key={o.title} type="button" className="premium-benefit offer-card offer-card-button" onClick={() => handleOfferClick(o)}>
                  <span className="premium-benefit-emoji">{o.emoji}</span>
                  <div>
                    <strong>{o.title}</strong>
                    <p>{o.text}</p>
                  </div>
                </button>
              )
            )}
          </div>
        </section>

        {recentOrders.length > 0 && (
          <section>
            <div className="section-title">
              <h2>Your recent orders</h2>
            </div>
            <div className="recent-orders-row">
              {recentOrders.map((order) => (
                <Link to={`/orders/${order.id}`} key={order.id} className="recent-order-card">
                  <strong>{order.storeName}</strong>
                  <span className={`status-badge status-${order.status.toLowerCase()}`}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="section-title">
            <h2>What are you looking for?</h2>
          </div>

          <div className="category-grid">
            {VERTICALS.map((v) => (
              <CategoryCard
                key={v.key}
                label={v.label}
                emoji={v.emoji}
                image={v.image}
                color={v.color}
                active={v.key === vertical}
                onClick={() => setVertical(v.key)}
              />
            ))}
          </div>
        </section>

        <section ref={resultsRef}>
          <div className="section-title">
            <h2>{activeLabel} near you</h2>
          </div>

          {loading && <p>Loading stores...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && (
            <div className="store-grid">
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
