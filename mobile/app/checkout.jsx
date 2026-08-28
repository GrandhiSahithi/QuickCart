import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import { orderApi } from "../services/api";
import { colors } from "../theme/colors";

export default function CheckoutScreen() {
  const { cart, total, removeStore } = useCart();
  const router = useRouter();
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!placing && cart.stores.length === 0) {
      router.replace("/cart");
    }
  }, [placing, cart.stores.length, router]);

  if (!cart.stores.length) {
    return null;
  }

  async function handlePay() {
    setPlacing(true);
    setError(null);

    const createdOrders = [];
    try {
      for (const s of cart.stores) {
        const order = await orderApi.create({
          storeId: s.storeId,
          items: s.items.map((item) => ({ productId: item.id, quantity: item.quantity }))
        });
        createdOrders.push(order);
        removeStore(s.storeId);
      }
      router.replace(createdOrders.length === 1 ? `/orders/${createdOrders[0].id}` : "/orders");
    } catch {
      setError(
        createdOrders.length > 0
          ? `Placed ${createdOrders.length} of ${cart.stores.length} orders - the rest are still in your cart. Please try again.`
          : "Couldn't place order. Please try again."
      );
      setPlacing(false);
    }
  }

  return (
    <View style={styles.safe}>
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.note}>🔒 Payments are encrypted and secure.</Text>

      {cart.stores.length > 1 && (
        <Text style={styles.multiStoreNote}>
          {cart.stores.length} stores in this order — each is delivered and tracked separately.
        </Text>
      )}

      <Text style={styles.label}>Card number</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} value={card} onChangeText={setCard} />

      <Text style={styles.label}>Expiry</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} defaultValue="12/29" />

      <Text style={styles.label}>CVC</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} defaultValue="123" />

      {cart.stores.map((store) => {
        const storeTotal = store.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        return (
          <View key={store.storeId} style={styles.storeRow}>
            <Text style={styles.storeName}>{store.storeName}</Text>
            <Text style={styles.storeTotal}>${storeTotal.toFixed(2)}</Text>
          </View>
        );
      })}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Order total</Text>
        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.payButton} onPress={handlePay} disabled={placing}>
        {placing ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.payText}>Pay ${total.toFixed(2)}</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 22 },
  title: { fontSize: 24, fontWeight: "800", marginBottom: 4, color: colors.text },
  note: { color: colors.textSecondary, marginBottom: 18 },
  multiStoreNote: { color: colors.textSecondary, fontSize: 13, marginBottom: 14 },
  label: { fontWeight: "600", marginTop: 10, marginBottom: 6, color: colors.text },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text },
  storeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 18 },
  storeName: { color: colors.textSecondary, fontWeight: "700" },
  storeTotal: { color: colors.text, fontWeight: "700" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { color: colors.text },
  totalValue: { fontWeight: "700", fontSize: 18, color: colors.text },
  error: { color: colors.danger, marginBottom: 12 },
  payButton: { backgroundColor: colors.accent, padding: 16, borderRadius: 12, alignItems: "center" },
  payText: { color: colors.accentText, fontWeight: "700" }
});
