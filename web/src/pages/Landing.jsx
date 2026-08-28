import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { VERTICALS } from "../constants/verticals";

const SLIDES = [
  {
    id: "fast",
    eyebrow: "DELIVERED FAST",
    heading: "Food, groceries, medicine & more — delivered in minutes.",
    sub: "Track your order live on the map from the moment it's placed to the second it's at your door.",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=70"
  },
  {
    id: "everything",
    eyebrow: "EVERY CATEGORY, ONE APP",
    heading: "From dinner tonight to a new pair of sneakers.",
    sub: "Food, grocery, medicine, shop, tech, fashion, beauty & pets — stop juggling apps.",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=70"
  },
  {
    id: "tracking",
    eyebrow: "LIVE TRACKING",
    heading: "Watch it move, door to door.",
    sub: "Every order is tracked on a live map from the store to your doorstep.",
    image: "https://images.unsplash.com/photo-1579113800032-c38bd7635818?auto=format&fit=crop&w=1600&q=70"
  },
  {
    id: "secure",
    eyebrow: "PAYMENTS PROTECTED",
    heading: "Checkout that's encrypted end-to-end.",
    sub: "Card, Apple Pay, Google Pay or cash on delivery — every payment is protected.",
    image: "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=1600&q=70"
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
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slideCount = SLIDES.length;

  useEffect(() => {
    if (paused) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slideCount), 5000);
    return () => clearInterval(timer);
  }, [paused, slideCount]);

  function goTo(i) {
    setIndex((i + slideCount) % slideCount);
  }

  const slide = SLIDES[index];

  return (
    <main className="landing">
      <section
        className="landing-hero-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`landing-hero-slide${i === index ? " active" : ""}`}
            style={{
              backgroundImage: `linear-gradient(135deg, rgba(20, 22, 26, 0.85), rgba(20, 22, 26, 0.97)), url(${s.image})`
            }}
          />
        ))}

        <div className="landing-hero-content">
          <p className="eyebrow">{slide.eyebrow}</p>
          <h1>{slide.heading}</h1>
          <p className="landing-hero-sub">{slide.sub}</p>
          <div className="landing-cta-row">
            <Link to="/signup" className="primary-button landing-cta">Get Started</Link>
            <Link to="/login" className="secondary-button landing-cta">Login</Link>
          </div>
        </div>

        <button type="button" className="landing-hero-arrow landing-hero-arrow-prev" onClick={() => goTo(index - 1)} aria-label="Previous slide">
          ‹
        </button>
        <button type="button" className="landing-hero-arrow landing-hero-arrow-next" onClick={() => goTo(index + 1)} aria-label="Next slide">
          ›
        </button>

        <div className="landing-hero-dots">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={i === index ? "active" : ""}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

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
