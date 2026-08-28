import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLocationContext } from "../context/LocationContext";
import { orderApi } from "../services/api";
import PaymentIcon from "../components/PaymentIcon";

const DELIVERY_FEE = 2.99;

const PAYMENT_METHODS = [
  { key: "CARD", label: "Credit / Debit Card", sub: "Visa, Mastercard, Amex & more" },
  { key: "APPLE_PAY", label: "Apple Pay", sub: "Pay with Face ID or Touch ID" },
  { key: "GOOGLE_PAY", label: "Google Pay", sub: "Fast checkout with Google" },
  { key: "PAYPAL", label: "PayPal", sub: "Pay with your PayPal balance" },
  { key: "COD", label: "Cash on Delivery", sub: "Pay when your order arrives" }
];

export default function Checkout() {
  const { cart, total, clearCart } = useCart();
  const { user } = useAuth();
  const { location } = useLocationContext();
  const navigate = useNavigate();
  const [method, setMethod] = useState("CARD");
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
      <form className="form-card checkout-card" onSubmit={handlePay}>
        <h1>Checkout</h1>

        <div className="secure-checkout-band">
          <span className="secure-checkout-lock">🔒</span>
          <div>
            <strong>Secure checkout</strong>
            <p>Every payment method below is encrypted and protected.</p>
          </div>
        </div>

        {location && <p className="checkout-note">📍 Delivering to {location.label}</p>}

        <label>Payment method</label>
        <div className="payment-method-list">
          {PAYMENT_METHODS.map((m) => (
            <label key={m.key} className={`payment-method-row${method === m.key ? " selected" : ""}`}>
              <input
                type="radio"
                name="payment-method"
                value={m.key}
                checked={method === m.key}
                onChange={() => setMethod(m.key)}
              />
              <span className="payment-method-icon">
                <PaymentIcon type={m.key} />
              </span>
              <span className="payment-method-text">
                <strong>{m.label}</strong>
                <span>{m.sub}</span>
              </span>
            </label>
          ))}
        </div>

        {method === "CARD" && (
          <div className="payment-card-fields">
            <label>Card number</label>
            <input value={card} onChange={(e) => setCard(e.target.value)} placeholder="4242 4242 4242 4242" />

            <label>Expiry</label>
            <input placeholder="MM/YY" defaultValue="12/29" />

            <label>CVC</label>
            <input placeholder="123" defaultValue="123" />
          </div>
        )}

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
