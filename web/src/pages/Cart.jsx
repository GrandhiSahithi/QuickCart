import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

const DELIVERY_FEE = 2.99;

export default function Cart() {
  const { cart, updateQuantity, total, count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (count === 0) {
    return (
      <main className="page-container">
        <h1>Your Cart</h1>
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p>Add products from a store to see them here.</p>
        </div>
      </main>
    );
  }

  function handleCheckout() {
    if (!user) {
      navigate("/login", { state: { from: "/checkout" } });
      return;
    }
    navigate("/checkout");
  }

  const deliveryFee = user?.premium ? 0 : DELIVERY_FEE;
  const grandTotal = total + deliveryFee;

  return (
    <main className="page-container">
      <h1>Your Cart</h1>
      <p className="cart-store-name">From {cart.storeName}</p>

      <div className="cart-items">
        {cart.items.map((item) => (
          <div className="cart-item" key={item.id}>
            <div className="cart-item-image" style={{ backgroundImage: `url(${item.imageUrl})` }} />
            <div className="cart-item-details">
              <strong>{item.name}</strong>
              <span>${item.price.toFixed(2)}</span>
            </div>
            <div className="quantity-control">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-subtotal-row">
          <span>Subtotal</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="cart-subtotal-row">
          <span>Delivery fee</span>
          <span>{deliveryFee === 0 ? "FREE with QuickCart+" : `$${deliveryFee.toFixed(2)}`}</span>
        </div>
        <div className="cart-total-row">
          <span>Total</span>
          <strong>${grandTotal.toFixed(2)}</strong>
        </div>
        <button className="primary-button" onClick={handleCheckout}>
          Checkout
        </button>
      </div>
    </main>
  );
}
