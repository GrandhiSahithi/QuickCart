import { Link } from "react-router-dom";
import { VERTICALS } from "../constants/verticals";

const HERO_IMAGE = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=70";

const CATEGORIES = [
  { key: "FOOD", text: "Pizza, sushi, burgers, Indian, Mexican, Chinese & more" },
  { key: "GROCERY", text: "Fresh produce, pantry staples, delivered fast" },
  { key: "MEDICINE", text: "Pharmacy essentials, on demand" },
  { key: "SHOP", text: "Home goods, stationery, everyday essentials" },
  { key: "ELECTRONICS", text: "Gadgets, audio, gaming gear" },
  { key: "FASHION", text: "Clothing, sneakers, accessories" },
  { key: "BEAUTY", text: "Skincare, cosmetics, grooming" },
  { key: "PETS", text: "Food, toys & supplies for every pet" }
].map((c) => ({ ...c, ...VERTICALS.find((v) => v.key === c.key) }));

const OFFERS = [
  { emoji: "🎉", title: "50% off your first order", text: "New customers save big on their first checkout." },
  { emoji: "🚚", title: "Free delivery with QuickCart+", text: "Join for $7.99/mo and never pay a delivery fee again." },
  { emoji: "💊", title: "20% off Medicine this week", text: "Pharmacy essentials, discounted through Sunday." }
];

export default function Landing() {
  return (
    <main className="landing">
      <section
        className="landing-hero"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(20, 22, 26, 0.85), rgba(20, 22, 26, 0.97)), url(${HERO_IMAGE})`
        }}
      >
        <p className="eyebrow">DELIVERED FAST</p>
        <h1>Food, groceries, medicine & more — delivered in minutes.</h1>
        <p className="landing-hero-sub">
          Track your order live on the map from the moment it's placed to the second it's at your door.
        </p>
        <div className="landing-cta-row">
          <Link to="/signup" className="primary-button landing-cta">Get Started</Link>
          <Link to="/login" className="secondary-button landing-cta">Login</Link>
        </div>
      </section>

      <div className="page-container">
        <section>
          <div className="section-title">
            <h2>Everything you can order</h2>
          </div>
          <div className="landing-category-grid">
            {CATEGORIES.map((c) => (
              <div
                key={c.key}
                className="landing-category-card"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(10,11,13,0.4), rgba(10,11,13,0.88)), url(${c.image})`,
                  borderColor: `${c.color}66`
                }}
              >
                <span className="landing-category-emoji">{c.emoji}</span>
                <strong>{c.label}</strong>
                <p>{c.text}</p>
                <span className="category-accent-bar" style={{ background: c.color, margin: "10px auto 0" }} />
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="section-title">
            <h2>Offers waiting for you</h2>
          </div>
          <div className="premium-grid">
            {OFFERS.map((o) => (
              <div key={o.title} className="premium-benefit">
                <span className="premium-benefit-emoji">{o.emoji}</span>
                <div>
                  <strong>{o.title}</strong>
                  <p>{o.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-premium-band">
          <div>
            <p className="eyebrow">QUICKCART+</p>
            <h2>Free delivery, every order, for $7.99/mo.</h2>
            <p>A couple dollars less than DoorDash DashPass or Uber One — and it works across every category.</p>
          </div>
          <Link to="/signup" className="primary-button premium-cta">Sign up to join</Link>
        </section>
      </div>
    </main>
  );
}
