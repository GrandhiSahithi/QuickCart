const BADGE_LABELS = {
  BESTSELLER: "Bestseller",
  TRENDING: "Trending",
  NEW: "New",
  SALE: "Sale"
};

export default function ProductCard({ product, onAdd }) {
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
          <button onClick={() => onAdd(product)}>ADD</button>
        </div>
      </div>
    </div>
  );
}
