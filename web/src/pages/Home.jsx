import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CategoryCard from "../components/CategoryCard";
import StoreCard from "../components/StoreCard";
import HeroCarousel from "../components/HeroCarousel";
import { storeApi, orderApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useLocationContext } from "../context/LocationContext";
import { VERTICALS } from "../constants/verticals";

const OFFERS = [
  { emoji: "🎉", title: "50% off your first order", text: "New customers save big on their first checkout.", vertical: "FOOD" },
  { emoji: "🚚", title: "Free delivery with QuickCart+", text: "Join for $7.99/mo and never pay a delivery fee again.", to: "/premium" },
  { emoji: "🍕", title: "Buy 1 Get 1 on select items", text: "Look for the BOGO tag on menus and product pages.", vertical: "FOOD" },
  { emoji: "💊", title: "20% off select Medicine", text: "Pharmacy essentials, discounted this week.", vertical: "MEDICINE" },
  { emoji: "🚚", title: "Free delivery from select stores", text: "Look for the delivery badge on a store's card.", vertical: "GROCERY" }
];

const PROMO_SLIDES = [
  {
    id: "bogo",
    eyebrow: "BUY ONE GET ONE",
    heading: "BOGO deals across your favorite spots.",
    sub: "Look for the BOGO tag on menus and product pages.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=70"
  },
  {
    id: "delivery",
    eyebrow: "DELIVERY DEALS",
    heading: "Some stores deliver free. Others knock off the fee.",
    sub: "Watch for the delivery badge on a store's card before you order.",
    image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1600&q=70"
  },
  {
    id: "tracking",
    eyebrow: "LIVE TRACKING",
    heading: "Watch it move, door to door.",
    sub: "Every order is tracked on a live map from the store to your doorstep.",
    image: "https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=1600&q=70"
  }
];

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

  const heroSlides = [
    {
      id: "greeting",
      eyebrow: "DELIVERED FAST",
      heading: firstName ? `Hi ${firstName}, what are you ordering today?` : "What are you ordering today?",
      sub: `Order from ${activeLabel?.toLowerCase()} and track it live as it arrives${location ? ` — delivering to ${location.label}` : ""}.`,
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=70"
    },
    ...PROMO_SLIDES
  ];

  return (
    <main>
      <HeroCarousel slides={heroSlides} />

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
