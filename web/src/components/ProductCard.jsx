import { useEffect, useState } from "react";
import { productApi } from "../services/api";

const BADGE_LABELS = {
  BESTSELLER: "Bestseller",
  TRENDING: "Trending",
  NEW: "New",
  SALE: "Sale",
  BOGO: "Buy 1 Get 1 Free"
};

export default function ProductCard({ product, onAdd }) {
  const outOfStock = product.stock <= 0;
  const [alternatives, setAlternatives] = useState([]);

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
      </div>
    </div>
  );
}
