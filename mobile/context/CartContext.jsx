import { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CartContext = createContext(null);

const CART_KEY = "quickcart_cart";
const EMPTY_CART = { stores: [] };

// Cart shape: { stores: [{ storeId, storeName, items: [{...product, quantity}] }] }
// One entry per store the customer has items from - adding from a second
// store doesn't wipe the first; each store checks out as its own order.
function normalize(raw) {
  if (!raw) return EMPTY_CART;
  if (Array.isArray(raw.stores)) return raw;
  // Migrate the old single-store shape ({ storeId, storeName, items }).
  if (raw.storeId && raw.items?.length) {
    return { stores: [{ storeId: raw.storeId, storeName: raw.storeName, items: raw.items }] };
  }
  return EMPTY_CART;
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(EMPTY_CART);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CART_KEY)
      .then((raw) => {
        if (raw) setCart(normalize(JSON.parse(raw)));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart, loaded]);

  function addItem(storeId, storeName, product) {
    setCart((prev) => {
      const storeIndex = prev.stores.findIndex((s) => s.storeId === storeId);

      if (storeIndex === -1) {
        return { stores: [...prev.stores, { storeId, storeName, items: [{ ...product, quantity: 1 }] }] };
      }

      const target = prev.stores[storeIndex];
      const existing = target.items.find((item) => item.id === product.id);
      const items = existing
        ? target.items.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
        : [...target.items, { ...product, quantity: 1 }];

      const stores = prev.stores.map((s, i) => (i === storeIndex ? { ...s, items } : s));
      return { stores };
    });
  }

  function updateQuantity(storeId, productId, quantity) {
    setCart((prev) => {
      const stores = prev.stores
        .map((s) => {
          if (s.storeId !== storeId) return s;
          const items =
            quantity <= 0
              ? s.items.filter((item) => item.id !== productId)
              : s.items.map((item) => (item.id === productId ? { ...item, quantity } : item));
          return { ...s, items };
        })
        .filter((s) => s.items.length > 0);

      return { stores };
    });
  }

  function removeStore(storeId) {
    setCart((prev) => ({ stores: prev.stores.filter((s) => s.storeId !== storeId) }));
  }

  function clearCart() {
    setCart(EMPTY_CART);
  }

  const allItems = cart.stores.flatMap((s) => s.items);
  const total = allItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = allItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addItem, updateQuantity, removeStore, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
