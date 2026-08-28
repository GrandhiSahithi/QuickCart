import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function HeroCarousel({ slides, intervalMs = 5000 }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const slideCount = slides.length;

  useEffect(() => {
    if (paused || slideCount <= 1) return undefined;
    const timer = setInterval(() => setIndex((i) => (i + 1) % slideCount), intervalMs);
    return () => clearInterval(timer);
  }, [paused, slideCount, intervalMs]);

  function goTo(i) {
    setIndex((i + slideCount) % slideCount);
  }

  const slide = slides[index];

  return (
    <section className="hero-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`hero-carousel-slide${i === index ? " active" : ""}`}
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(20, 22, 26, 0.85), rgba(20, 22, 26, 0.97)), url(${s.image})`
          }}
        />
      ))}

      <div className="hero-carousel-content">
        {slide.eyebrow && <p className="eyebrow">{slide.eyebrow}</p>}
        <h1>{slide.heading}</h1>
        {slide.sub && <p className="hero-carousel-sub">{slide.sub}</p>}
        {slide.cta && (
          <div className="landing-cta-row">
            {slide.cta.map((c) => (
              <Link key={c.label} to={c.to} className={`${c.variant === "secondary" ? "secondary-button" : "primary-button"} landing-cta`}>
                {c.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {slideCount > 1 && (
        <>
          <button type="button" className="hero-carousel-arrow hero-carousel-arrow-prev" onClick={() => goTo(index - 1)} aria-label="Previous slide">
            ‹
          </button>
          <button type="button" className="hero-carousel-arrow hero-carousel-arrow-next" onClick={() => goTo(index + 1)} aria-label="Next slide">
            ›
          </button>

          <div className="hero-carousel-dots">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                className={i === index ? "active" : ""}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
