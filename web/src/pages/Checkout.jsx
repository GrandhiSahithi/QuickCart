import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLocationContext } from "../context/LocationContext";
import { orderApi } from "../services/api";

const DELIVERY_FEE = 2.99;

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const { location } = useLocationContext();
  const navigate = useNavigate();
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  if (!cart.items.length) {
    navigate("/cart");
    return null;
  }

  const deliveryFee = user?.premium ? 0 : DELIVERY_FEE;
  const grandTotal = total + deliveryFee;

  async function handlePay(e) {
    e.preventDefault();
    setPlacing(true);
    setError(null);

    try {
      const order = await orderApi.create({
        storeId: cart.storeId,
        items: cart.items.map((item) => ({ productId: item.id, quantity: item.quantity })),
        lat: location?.lat,
        lng: location?.lng
      });
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch {
      setError("Couldn't place order. Please try again.");
      setPlacing(false);
    }
  }

  return (
    <main className="form-page">
      <form className="form-card" onSubmit={handlePay}>
        <h1>Checkout</h1>
        <p className="checkout-note">🔒 Payments are encrypted and secure.</p>
        {location && <p className="checkout-note">📍 Delivering to {location.label}</p>}

        <label>Card number</label>
        <input value={card} onChange={(e) => setCard(e.target.value)} placeholder="4242 4242 4242 4242" />

        <label>Expiry</label>
        <input placeholder="MM/YY" defaultValue="12/29" />

        <label>CVC</label>
        <input placeholder="123" defaultValue="123" />

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

        {error && <p className="error-text">{error}</p>}

        <button className="primary-button" type="submit" disabled={placing}>
          {placing ? "Placing order..." : `Pay $${grandTotal.toFixed(2)}`}
        </button>
      </form>
    </main>
  );
}
