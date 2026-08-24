import { Link } from "react-router-dom";

export default function StoreCard({ store }) {
  return (
    <Link to={`/store/${store.id}`} className="store-card">
      <div className="store-image" style={{ backgroundImage: `url(${store.imageUrl})` }} />
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
