import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

export default function CartScreen() {
  const { cart, updateQuantity, total, count } = useCart();
  const { user } = useAuth();
  const router = useRouter();

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
      <Text style={styles.storeName}>From {cart.storeName}</Text>

      <FlatList
        data={cart.items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={{ uri: item.imageUrl }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={styles.qtyRow}>
              <Pressable style={styles.qtyButton} onPress={() => updateQuantity(item.id, item.quantity - 1)}>
                <Text style={styles.qtyButtonText}>-</Text>
              </Pressable>
              <Text style={styles.qty}>{item.quantity}</Text>
              <Pressable style={styles.qtyButton} onPress={() => updateQuantity(item.id, item.quantity + 1)}>
                <Text style={styles.qtyButtonText}>+</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <View style={styles.summary}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
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
  storeName: { color: colors.textSecondary, paddingHorizontal: 18, marginBottom: 8 },
  list: { paddingHorizontal: 18, paddingBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 14, padding: 12, marginBottom: 12, gap: 12 },
  image: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  info: { flex: 1 },
  name: { fontWeight: "700", color: colors.text },
  price: { color: colors.textSecondary, marginTop: 4 },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  qtyButton: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  qtyButtonText: { fontWeight: "700", color: colors.text },
  qty: { minWidth: 18, textAlign: "center", color: colors.text },
  summary: { padding: 18, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  totalLabel: { color: colors.text },
  totalValue: { fontWeight: "700", fontSize: 18, color: colors.text },
  checkoutButton: { backgroundColor: colors.accent, padding: 14, borderRadius: 10, alignItems: "center" },
  checkoutText: { color: colors.accentText, fontWeight: "700" }
});
