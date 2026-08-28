import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { storeApi } from "../services/api";
import { computeCartPricing } from "../utils/pricing";

export default function Cart() {
  const { cart, updateQuantity, removeStore, count } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [storesById, setStoresById] = useState({});
  // Which stores to include in checkout right now - everything's selected
  // by default, but a store can be unchecked to check out the rest while
  // leaving it in the cart for later.
  const [selectedStoreIds, setSelectedStoreIds] = useState(() => new Set(cart.stores.map((s) => s.storeId)));

  function toggleStore(storeId) {
    setSelectedStoreIds((prev) => {
      const next = new Set(prev);
      if (next.has(storeId)) next.delete(storeId);
      else next.add(storeId);
      return next;
    });
  }

  useEffect(() => {
    cart.stores.forEach((s) => {
      if (!(s.storeId in storesById)) {
        storeApi
          .get(s.storeId)
          .then((data) => setStoresById((prev) => ({ ...prev, [s.storeId]: data })))
          .catch(() => {});
      }
    });
    // storesById is deliberately left out - it's only used to avoid
    // re-fetching a store we already have, not to react to its own changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.stores]);

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
    navigate("/checkout", { state: { selectedStoreIds: [...selectedStoreIds] } });
  }

  const sections = cart.stores.map((s) => ({
    ...s,
    pricing: computeCartPricing({
      items: s.items,
      deliveryFeeDiscountPercent: storesById[s.storeId]?.deliveryFeeDiscountPercent,
      isFirstOrder: false,
      isPremium: user?.premium
    })
  }));

  const selectedSections = sections.filter((s) => selectedStoreIds.has(s.storeId));
  const grandTotal = selectedSections.reduce((sum, s) => sum + s.pricing.total, 0);
  const deferredCount = sections.length - selectedSections.length;

  return (
    <main className="page-container">
      <h1>Your Cart</h1>

      {sections.length > 1 && (
        <p className="cart-multi-store-note">
          Uncheck a store to leave it in your cart and check out the rest now.
        </p>
      )}

      {sections.map((section) => {
        const selected = selectedStoreIds.has(section.storeId);
        return (
        <div className={`cart-store-section${selected ? "" : " cart-store-section-deferred"}`} key={section.storeId}>
          <div className="cart-store-header">
            <label className="cart-store-select">
              {sections.length > 1 && (
                <input type="checkbox" checked={selected} onChange={() => toggleStore(section.storeId)} />
              )}
              <span className="cart-store-name">From {section.storeName}</span>
            </label>
            <button type="button" className="link-button" onClick={() => removeStore(section.storeId)}>
              Remove all
            </button>
          </div>

          <div className="cart-items">
            {section.items.map((item) => (
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
                  <button onClick={() => updateQuantity(section.storeId, item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(section.storeId, item.id, item.quantity + 1)}>+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-subtotal-row">
              <span>Subtotal</span>
              <span>${section.pricing.listSubtotal.toFixed(2)}</span>
            </div>
            {section.pricing.bogoSavings > 0 && (
              <div className="cart-subtotal-row cart-savings-row">
                <span>Buy 1 Get 1 savings</span>
                <span>-${section.pricing.bogoSavings.toFixed(2)}</span>
              </div>
            )}
            <div className="cart-subtotal-row">
              <span>Delivery fee</span>
              <span>
                {user?.premium ? (
                  "FREE with QuickCart+"
                ) : section.pricing.deliveryFeeOriginal ? (
                  <>
                    <s className="product-original-price">${section.pricing.deliveryFeeOriginal.toFixed(2)}</s>{" "}
                    {section.pricing.deliveryFee === 0 ? "FREE" : `$${section.pricing.deliveryFee.toFixed(2)}`}
                  </>
                ) : (
                  `$${section.pricing.deliveryFee.toFixed(2)}`
                )}
              </span>
            </div>
            <div className="cart-total-row">
              <span>{section.storeName} total</span>
              <strong>${section.pricing.total.toFixed(2)}</strong>
            </div>
          </div>
        </div>
        );
      })}

      <div className="cart-summary cart-grand-summary">
        {selectedSections.length > 1 && (
          <p className="cart-multi-store-note">
            {selectedSections.length} stores in this order — each is delivered and tracked separately.
          </p>
        )}
        {deferredCount > 0 && (
          <p className="cart-multi-store-note">
            {deferredCount} store{deferredCount === 1 ? "" : "s"} staying in your cart for later.
          </p>
        )}
        <div className="cart-total-row">
          <span>Order total</span>
          <strong>${grandTotal.toFixed(2)}</strong>
        </div>
        <button className="primary-button" onClick={handleCheckout} disabled={selectedSections.length === 0}>
          {selectedSections.length === 0 ? "Select a store to check out" : "Checkout"}
        </button>
      </div>
    </main>
  );
}
