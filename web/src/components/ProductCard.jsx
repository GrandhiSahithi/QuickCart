export default function ProductCard({ product, onAdd }) {
  return (
    <div className="product-card">
      <div className="product-image" style={{ backgroundImage: `url(${product.imageUrl})` }} />

      <div className="product-details">
        {product.description && <small>{product.description}</small>}
        <h3>{product.name}</h3>

        <div className="product-bottom">
          <strong>${product.price.toFixed(2)}</strong>
          <button onClick={() => onAdd(product)}>ADD</button>
        </div>
      </div>
    </div>
  );
}
