import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

const CART_KEY = "quickcart_cart";
const EMPTY_CART = { storeId: null, storeName: null, items: [] };

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : EMPTY_CART;
    } catch {
      return EMPTY_CART;
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  // A cart holds items from a single store at a time, like most delivery apps.
  function addItem(storeId, storeName, product) {
    setCart((prev) => {
      if (prev.storeId && prev.storeId !== storeId) {
        const confirmed = window.confirm(
          `Your cart has items from ${prev.storeName}. Starting an order from ${storeName} will clear it. Continue?`
        );
        if (!confirmed) return prev;
        return { storeId, storeName, items: [{ ...product, quantity: 1 }] };
      }

      const existing = prev.items.find((item) => item.id === product.id);
      const items = existing
        ? prev.items.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
        : [...prev.items, { ...product, quantity: 1 }];

      return { storeId, storeName, items };
    });
  }

  function updateQuantity(productId, quantity) {
    setCart((prev) => {
      if (quantity <= 0) {
        const items = prev.items.filter((item) => item.id !== productId);
        return items.length ? { ...prev, items } : EMPTY_CART;
      }
      return { ...prev, items: prev.items.map((item) => (item.id === productId ? { ...item, quantity } : item)) };
    });
  }

  function clearCart() {
    setCart(EMPTY_CART);
  }

  const total = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
