import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

export default function CartScreen() {
  const { cart, updateQuantity, removeStore, total, count } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (count === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>Add products from a store to see them here.</Text>
      </View>
    );
  }

  function handleCheckout() {
    router.push(user ? "/checkout" : "/login");
  }

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={styles.list}>
        {cart.stores.length > 1 && (
          <Text style={styles.multiStoreNote}>
            {cart.stores.length} stores in this order — each is delivered and tracked separately.
          </Text>
        )}

        {cart.stores.map((store) => {
          const storeTotal = store.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
          return (
            <View key={store.storeId} style={styles.storeSection}>
              <View style={styles.storeHeader}>
                <Text style={styles.storeName}>From {store.storeName}</Text>
                <Pressable onPress={() => removeStore(store.storeId)}>
                  <Text style={styles.removeAll}>Remove all</Text>
                </Pressable>
              </View>

              {store.items.map((item) => (
                <View key={item.id} style={styles.row}>
                  <Image source={{ uri: item.imageUrl }} style={styles.image} />
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.price}>${item.price.toFixed(2)}</Text>
                  </View>
                  <View style={styles.qtyRow}>
                    <Pressable style={styles.qtyButton} onPress={() => updateQuantity(store.storeId, item.id, item.quantity - 1)}>
                      <Text style={styles.qtyButtonText}>-</Text>
                    </Pressable>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <Pressable style={styles.qtyButton} onPress={() => updateQuantity(store.storeId, item.id, item.quantity + 1)}>
                      <Text style={styles.qtyButtonText}>+</Text>
                    </Pressable>
                  </View>
                </View>
              ))}

              <View style={styles.storeTotalRow}>
                <Text style={styles.storeTotalLabel}>{store.storeName} total</Text>
                <Text style={styles.storeTotalValue}>${storeTotal.toFixed(2)}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.summary, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Order total</Text>
          <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
        </View>
        <Pressable style={styles.checkoutButton} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingTop: 16 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: colors.background },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  emptyText: { color: colors.textSecondary, marginTop: 8, textAlign: "center" },
  list: { paddingHorizontal: 18, paddingBottom: 20 },
  multiStoreNote: { color: colors.textSecondary, fontSize: 13, marginBottom: 14 },
  storeSection: { marginBottom: 20 },
  storeHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  storeName: { color: colors.textSecondary, fontWeight: "700" },
  removeAll: { color: colors.accent, fontWeight: "600", fontSize: 13 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 14, padding: 12, marginBottom: 12, gap: 12 },
  image: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  info: { flex: 1 },
  name: { fontWeight: "700", color: colors.text },
  price: { color: colors.textSecondary, marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyButton: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  qtyButtonText: { fontWeight: "700", color: colors.text },
  qty: { minWidth: 18, textAlign: "center", color: colors.text },
  storeTotalRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4 },
  storeTotalLabel: { color: colors.textSecondary },
  storeTotalValue: { fontWeight: "700", color: colors.text },
  summary: { padding: 18, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  totalLabel: { color: colors.text },
  totalValue: { fontWeight: "700", fontSize: 18, color: colors.text },
  checkoutButton: { backgroundColor: colors.accent, padding: 14, borderRadius: 10, alignItems: "center" },
  checkoutText: { color: colors.accentText, fontWeight: "700" }
});
