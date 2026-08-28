import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

const CART_KEY = "quickcart_cart";
const EMPTY_CART = { stores: [] };

// Cart shape: { stores: [{ storeId, storeName, items: [{...product, quantity}] }] }
// One entry per store the customer has items from - unlike a single-store
// cart, adding from a second store doesn't wipe the first; each store is
// checked out as its own order and tracked separately.
function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.stores)) return parsed;
    // Migrate the old single-store shape ({ storeId, storeName, items }).
    if (parsed.storeId && parsed.items?.length) {
      return { stores: [{ storeId: parsed.storeId, storeName: parsed.storeName, items: parsed.items }] };
    }
    return EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  function addItem(store, product) {
    setCart((prev) => {
      const storeIndex = prev.stores.findIndex((s) => s.storeId === store.id);

      if (storeIndex === -1) {
        return { stores: [...prev.stores, { storeId: store.id, storeName: store.name, items: [{ ...product, quantity: 1 }] }] };
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

  // Swaps one product for another within a store's cart (e.g. an
  // out-of-stock item for a suggested alternative), keeping the quantity.
  function replaceItem(storeId, oldProductId, newProduct, quantity) {
    setCart((prev) => ({
      stores: prev.stores.map((s) => {
        if (s.storeId !== storeId) return s;
        const items = s.items.filter((item) => item.id !== oldProductId).concat([{ ...newProduct, quantity }]);
        return { ...s, items };
      })
    }));
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
    <CartContext.Provider value={{ cart, addItem, updateQuantity, replaceItem, removeStore, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
