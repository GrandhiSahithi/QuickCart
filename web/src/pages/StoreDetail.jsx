import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { storeApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { useLocationContext } from "../context/LocationContext";

function groupByCategory(products) {
  const groups = new Map();
  for (const product of products) {
    const key = product.category || "Menu";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(product);
  }
  return groups;
}

function sectionId(category) {
  return `section-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export default function StoreDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem, total, count } = useCart();
  const { location } = useLocationContext();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([storeApi.get(id, location), storeApi.products(id)])
      .then(([storeData, productData]) => {
        if (!cancelled) {
          setStore(storeData);
          setProducts(productData);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, location]);

  if (loading) return <main className="page-container"><p>Loading...</p></main>;
  if (!store) return <main className="page-container"><p>Store not found.</p></main>;

  const grouped = groupByCategory(products);
  const categories = [...grouped.keys()];

  function scrollToSection(category) {
    document.getElementById(sectionId(category))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="page-container">
      <div className="store-header" style={{ backgroundImage: `url(${store.imageUrl})` }}>
        <div className="store-header-overlay">
          <h1>{store.name}</h1>
          <div className="store-meta">
            <span>⭐ {store.rating}</span>
            <span>{store.etaMinutes} min delivery</span>
          </div>
        </div>
      </div>

      {categories.length > 1 && (
        <div className="menu-section-nav">
          {categories.map((category) => (
            <button key={category} type="button" className="menu-section-pill" onClick={() => scrollToSection(category)}>
              {category}
            </button>
          ))}
        </div>
      )}

      {categories.map((category) => (
        <section key={category} id={sectionId(category)} className="menu-section">
          <div className="section-title">
            <h2>{category}</h2>
          </div>

          <div className="product-grid">
            {grouped.get(category).map((product) => (
              <ProductCard key={product.id} product={product} storeVertical={store.vertical} onAdd={(p) => addItem(store, p)} />
            ))}
          </div>
        </section>
      ))}

      {count > 0 && (
        <button className="floating-cart-button" onClick={() => navigate("/cart")}>
          View cart ({count}) · ${total.toFixed(2)}
        </button>
      )}
    </main>
  );
}
