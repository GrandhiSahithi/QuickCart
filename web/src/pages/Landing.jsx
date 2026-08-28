import { Link } from "react-router-dom";
import HeroCarousel from "../components/HeroCarousel";
import { VERTICALS } from "../constants/verticals";

const CTA = [
  { label: "Get Started", to: "/signup" },
  { label: "Login", to: "/login", variant: "secondary" }
];

const SLIDES = [
  {
    id: "fast",
    eyebrow: "DELIVERED FAST",
    heading: "Food, groceries, medicine & more — delivered in minutes.",
    sub: "Track your order live on the map from the moment it's placed to the second it's at your door.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=70",
    cta: CTA
  },
  {
    id: "everything",
    eyebrow: "EVERY CATEGORY, ONE APP",
    heading: "From dinner tonight to a new pair of sneakers.",
    sub: "Food, grocery, medicine, shop, tech, fashion, beauty & pets — stop juggling apps.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=70",
    cta: CTA
  },
  {
    id: "tracking",
    eyebrow: "LIVE TRACKING",
    heading: "Watch it move, door to door.",
    sub: "Every order is tracked on a live map from the store to your doorstep.",
    image: "https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=1600&q=70",
    cta: CTA
  },
  {
    id: "secure",
    eyebrow: "PAYMENTS PROTECTED",
    heading: "Checkout that's encrypted end-to-end.",
    sub: "Card, Apple Pay, Google Pay or cash on delivery — every payment is protected.",
    image: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=1600&q=70",
    cta: CTA
  },
  {
    id: "bogo",
    eyebrow: "BUY ONE GET ONE",
    heading: "BOGO deals across your favorite spots.",
    sub: "Pizza, pharmacy, electronics & more — look for the BOGO tag on select items.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1600&q=70",
    cta: CTA
  },
  {
    id: "delivery",
    eyebrow: "DELIVERY DEALS",
    heading: "Some stores deliver free. Others knock off the fee.",
    sub: "Look for the delivery badge on a store's card before you order.",
    image: "https://images.unsplash.com/photo-1616046229478-9901c5536a45?auto=format&fit=crop&w=1600&q=70",
    cta: CTA
  },
  {
    id: "everyday",
    eyebrow: "NEW EVERY WEEK",
    heading: "Hundreds of stores, thousands of items.",
    sub: "From weekly groceries to a last-minute gift — it's all here.",
    image: "https://images.unsplash.com/photo-1601598851547-4302969d0614?auto=format&fit=crop&w=1600&q=70",
    cta: CTA
  }
];

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
  { emoji: "🎉", title: "50% off your first order", text: "New customers save big on their first checkout.", to: "/signup", tint: 1 },
  { emoji: "🚚", title: "Free delivery with QuickCart+", text: "Join for $7.99/mo and never pay a delivery fee again.", to: "/premium", tint: "gold" },
  { emoji: "💊", title: "20% off Medicine this week", text: "Pharmacy essentials, discounted through Sunday.", to: "/signup", tint: 2 }
];

export default function Landing() {
  return (
    <main className="landing">
      <HeroCarousel slides={SLIDES} />

      <div className="page-container">
        <section>
          <div className="section-title">
            <h2>Offers waiting for you</h2>
          </div>
          <div className="premium-grid">
            {OFFERS.map((o) => (
              <Link key={o.title} to={o.to} className={`premium-benefit offer-card offer-tint-${o.tint}`}>
                <span className="premium-benefit-emoji">{o.emoji}</span>
                <div>
                  <strong>{o.title}</strong>
                  <p>{o.text}</p>
                </div>
                <span className="offer-card-chevron">›</span>
              </Link>
            ))}
          </div>
        </section>

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
