import { Link } from "react-router-dom";

function deliveryBadgeLabel(percent) {
  if (!percent) return null;
  return percent >= 100 ? "🚚 Free delivery" : `🚚 ${percent}% off delivery`;
}

export default function StoreCard({ store }) {
  const deliveryBadge = deliveryBadgeLabel(store.deliveryFeeDiscountPercent);

  return (
    <Link to={`/store/${store.id}`} className="store-card">
      <div className="store-image" style={{ backgroundImage: `url(${store.imageUrl})` }}>
        {deliveryBadge && <span className="store-delivery-badge">{deliveryBadge}</span>}
      </div>
      <div className="store-details">
        <h3>{store.name}</h3>
        <div className="store-meta">
          <span>⭐ {store.rating}</span>
          <span>{store.etaMinutes} min</span>
        </div>
      </div>
    </Link>
  );
}
