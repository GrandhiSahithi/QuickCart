import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useLocationContext } from "../context/LocationContext";
import { orderApi, storeApi, productApi } from "../services/api";
import PaymentIcon from "../components/PaymentIcon";
import { computeCartPricing } from "../utils/pricing";

const PAYMENT_METHODS = [
  { key: "CARD", label: "Credit / Debit Card", sub: "Visa, Mastercard, Amex & more" },
  { key: "APPLE_PAY", label: "Apple Pay", sub: "Pay with Face ID or Touch ID" },
  { key: "GOOGLE_PAY", label: "Google Pay", sub: "Fast checkout with Google" },
  { key: "PAYPAL", label: "PayPal", sub: "Pay with your PayPal balance" },
  { key: "COD", label: "Cash on Delivery", sub: "Pay when your order arrives" }
];

export default function Checkout() {
  const { cart, updateQuantity, replaceItem, removeStore } = useCart();
  const { user } = useAuth();
  const { location } = useLocationContext();
  const navigate = useNavigate();
  const [method, setMethod] = useState("CARD");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);
  const [storesById, setStoresById] = useState({});
  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [alternativesByProduct, setAlternativesByProduct] = useState({});

  useEffect(() => {
    if (!cart.stores.length) return;

    orderApi
      .mine()
      .then((orders) => setIsFirstOrder(orders.length === 0))
      .catch(() => {});

    cart.stores.forEach((s) => {
      storeApi
        .get(s.storeId)
        .then((data) => setStoresById((prev) => ({ ...prev, [s.storeId]: data })))
        .catch(() => {});
    });

    // Re-check live stock right before payment - something in the cart
    // could have sold out since it was added.
    let cancelled = false;
    Promise.all(cart.stores.map((s) => storeApi.products(s.storeId).then((products) => ({ storeId: s.storeId, products }))))
      .then((results) => {
        if (cancelled) return;
        const liveByStore = Object.fromEntries(results.map((r) => [r.storeId, r.products]));
        const issues = [];
        for (const s of cart.stores) {
          for (const item of s.items) {
            const live = liveByStore[s.storeId]?.find((p) => p.id === item.id);
            if (!live || live.stock < item.quantity) {
              issues.push({ storeId: s.storeId, item });
            }
          }
        }
        setAvailability(issues);
        issues.forEach((issue) => {
          productApi
            .alternatives(issue.item.id)
            .then((alts) => setAlternativesByProduct((prev) => ({ ...prev, [issue.item.id]: alts })))
            .catch(() => {});
        });
      })
      .catch(() => setAvailability([]));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.stores.length]);

  // Redirect to an empty cart, but only when we're not actively placing an
  // order - checkout removes each store from the cart as its order
  // succeeds, so the cart legitimately hits zero mid-checkout too.
  useEffect(() => {
    if (!placing && cart.stores.length === 0) {
      navigate("/cart");
    }
  }, [placing, cart.stores.length, navigate]);

  if (!cart.stores.length) {
    return null;
  }

  function resolveByRemoving(storeId, productId) {
    updateQuantity(storeId, productId, 0);
    setAvailability((prev) => prev.filter((issue) => !(issue.storeId === storeId && issue.item.id === productId)));
  }

  function resolveBySwapping(storeId, productId, quantity, altProduct) {
    replaceItem(storeId, productId, altProduct, quantity);
    setAvailability((prev) => prev.filter((issue) => !(issue.storeId === storeId && issue.item.id === productId)));
  }

  const sections = cart.stores.map((s, index) => ({
    ...s,
    pricing: computeCartPricing({
      items: s.items,
      deliveryFeeDiscountPercent: storesById[s.storeId]?.deliveryFeeDiscountPercent,
      isFirstOrder: isFirstOrder && index === 0,
      isPremium: user?.premium
    })
  }));

  const grandTotal = sections.reduce((sum, s) => sum + s.pricing.total, 0);
  const checkingAvailability = availability === null;
  const hasIssues = availability && availability.length > 0;

  async function handlePay(e) {
    e.preventDefault();
    setPlacing(true);
    setError(null);

    const createdOrders = [];
    try {
      for (const s of cart.stores) {
        const order = await orderApi.create({
          storeId: s.storeId,
          items: s.items.map((item) => ({ productId: item.id, quantity: item.quantity })),
          lat: location?.lat,
          lng: location?.lng
        });
        createdOrders.push(order);
        removeStore(s.storeId);
      }
      navigate(createdOrders.length === 1 ? `/orders/${createdOrders[0].id}` : "/orders");
    } catch {
      setError(
        createdOrders.length > 0
          ? `Placed ${createdOrders.length} of ${cart.stores.length} orders - the rest are still in your cart. Please try again.`
          : "Couldn't place your order. Please try again."
      );
      setPlacing(false);
    }
  }

  return (
    <main className="form-page">
      <form className="form-card checkout-card" onSubmit={handlePay}>
        <h1>Checkout</h1>

        {location && <p className="checkout-note">📍 Delivering to {location.label}</p>}

        {sections.length > 1 && (
          <p className="cart-multi-store-note">
            {sections.length} stores in this order — each is delivered and tracked separately.
          </p>
        )}

        {checkingAvailability && <p className="checkout-note">Checking item availability...</p>}

        {hasIssues && (
          <div className="availability-review">
            <h2>Some items changed</h2>
            <p>These items are no longer available in the quantity you wanted. Swap for an alternative or remove them to continue.</p>

            {availability.map((issue) => {
              const storeName = cart.stores.find((s) => s.storeId === issue.storeId)?.storeName;
              const alts = alternativesByProduct[issue.item.id] || [];
              return (
                <div className="availability-issue" key={`${issue.storeId}-${issue.item.id}`}>
                  <div>
                    <strong>{issue.item.name}</strong>
                    <span> from {storeName} — no longer available</span>
                  </div>
                  <div className="product-alternatives-row">
                    {alts.map((alt) => (
                      <button
                        key={alt.id}
                        type="button"
                        className="alternative-chip"
                        onClick={() => resolveBySwapping(issue.storeId, issue.item.id, issue.item.quantity, alt)}
                      >
                        Swap for {alt.name} · ${alt.price.toFixed(2)}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="alternative-chip"
                      onClick={() => resolveByRemoving(issue.storeId, issue.item.id)}
                    >
                      Remove item
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!checkingAvailability && !hasIssues && (
          <>
            <div className="secure-checkout-band">
              <span className="secure-checkout-lock">🔒</span>
              <div>
                <strong>Secure checkout</strong>
                <p>Every payment method below is encrypted and protected.</p>
              </div>
            </div>

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

            {sections.map((section) => (
              <div className="checkout-order-summary" key={section.storeId}>
                <p className="cart-store-name">{section.storeName}</p>
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
                {section.pricing.firstOrderDiscount > 0 && (
                  <div className="cart-subtotal-row cart-savings-row">
                    <span>First order discount (-50%)</span>
                    <span>-${section.pricing.firstOrderDiscount.toFixed(2)}</span>
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
            ))}

            <div className="cart-total-row">
              <span>Order total</span>
              <strong>${grandTotal.toFixed(2)}</strong>
            </div>

            {error && <p className="error-text">{error}</p>}

            <button className="primary-button" type="submit" disabled={placing}>
              {placing ? "Placing order..." : `Pay $${grandTotal.toFixed(2)}`}
            </button>
          </>
        )}
      </form>
    </main>
  );
}
