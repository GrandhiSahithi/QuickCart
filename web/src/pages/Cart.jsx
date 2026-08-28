import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { storeApi } from "../services/api";
import { computeCartPricing } from "../utils/pricing";

export default function Cart() {
  const { cart, updateQuantity, count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);

  useEffect(() => {
    if (!cart.storeId) return;
    storeApi.get(cart.storeId).then(setStore).catch(() => {});
  }, [cart.storeId]);

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

  const pricing = computeCartPricing({
    items: cart.items,
    deliveryFeeDiscountPercent: store?.deliveryFeeDiscountPercent,
    isFirstOrder: false,
    isPremium: user?.premium
  });

  return (
    <main className="page-container">
      <h1>Your Cart</h1>
      <p className="cart-store-name">From {cart.storeName}</p>

      <div className="cart-items">
        {cart.items.map((item) => (
          <div className="cart-item" key={item.id}>
            <div className="cart-item-image" style={{ backgroundImage: `url(${item.imageUrl})` }} />
            <div className="cart-item-details">
              <strong>
                {item.name}
                {item.badge === "BOGO" && <span className="cart-item-bogo-tag">BOGO</span>}
              </strong>
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
          <span>${pricing.listSubtotal.toFixed(2)}</span>
        </div>
        {pricing.bogoSavings > 0 && (
          <div className="cart-subtotal-row cart-savings-row">
            <span>Buy 1 Get 1 savings</span>
            <span>-${pricing.bogoSavings.toFixed(2)}</span>
          </div>
        )}
        <div className="cart-subtotal-row">
          <span>Delivery fee</span>
          <span>
            {user?.premium ? (
              "FREE with QuickCart+"
            ) : pricing.deliveryFeeOriginal ? (
              <>
                <s className="product-original-price">${pricing.deliveryFeeOriginal.toFixed(2)}</s>{" "}
                {pricing.deliveryFee === 0 ? "FREE" : `$${pricing.deliveryFee.toFixed(2)}`}
              </>
            ) : (
              `$${pricing.deliveryFee.toFixed(2)}`
            )}
          </span>
        </div>
        <div className="cart-total-row">
          <span>Total</span>
          <strong>${pricing.total.toFixed(2)}</strong>
        </div>
        <button className="primary-button" onClick={handleCheckout}>
          Checkout
        </button>
      </div>
    </main>
  );
}
