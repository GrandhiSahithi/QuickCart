import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const LEGACY_CART_KEY = "quickcart_cart";
const EMPTY_CART = { stores: [] };

function cartKeyFor(userId) {
  return `quickcart_cart_${userId}`;
}

// Cart shape: { stores: [{ storeId, storeName, items: [{...product, quantity}] }] }
// One entry per store the customer has items from - unlike a single-store
// cart, adding from a second store doesn't wipe the first; each store is
// checked out as its own order and tracked separately.
//
// Carts are stored per-account (keyed by user id), never in one shared slot -
// otherwise whoever is logged in next would see the previous account's cart,
// and a signed-out visitor would see whoever was last signed in. No user id
// means no cart to load.
function loadCartFor(userId) {
  if (!userId) return EMPTY_CART;
  try {
    const raw = localStorage.getItem(cartKeyFor(userId));
    if (!raw) return EMPTY_CART;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.stores) ? parsed : EMPTY_CART;
  } catch {
    return EMPTY_CART;
  }
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(() => loadCartFor(user?.id));
  const [ownerId, setOwnerId] = useState(user?.id);

  // Whenever who's signed in changes, swap in that account's own saved cart
  // - signing out (or into a different account) must never carry over
  // someone else's cart, and signing back in picks up where that account's
  // cart left off. This runs during render (not an effect) so the persist
  // effect below never fires with a cart/owner pair that don't match -
  // otherwise the outgoing account's stale cart could briefly overwrite the
  // incoming account's saved one before the reload lands.
  if (ownerId !== user?.id) {
    setOwnerId(user?.id);
    setCart(loadCartFor(user?.id));
  }

  // Undated global cart key from before carts were per-account - the data
  // in it can't be attributed to any one account, so it's discarded rather
  // than migrated.
  useEffect(() => {
    localStorage.removeItem(LEGACY_CART_KEY);
  }, []);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(cartKeyFor(user.id), JSON.stringify(cart));
    }
  }, [cart, user?.id]);

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
