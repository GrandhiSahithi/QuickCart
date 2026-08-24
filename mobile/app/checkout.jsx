import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useCart } from "../context/CartContext";
import { orderApi } from "../services/api";
import { colors } from "../theme/colors";

export default function CheckoutScreen() {
  const { cart, total, clearCart } = useCart();
  const router = useRouter();
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

  async function handlePay() {
    setPlacing(true);
    setError(null);
    try {
      const order = await orderApi.create({
        storeId: cart.storeId,
        items: cart.items.map((item) => ({ productId: item.id, quantity: item.quantity }))
      });
      clearCart();
      router.replace(`/orders/${order.id}`);
    } catch {
      setError("Couldn't place order. Please try again.");
      setPlacing(false);
    }
  }

  return (
    <View style={styles.safe}>
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.note}>🔒 Payments are encrypted and secure.</Text>

      <Text style={styles.label}>Card number</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} value={card} onChangeText={setCard} />

      <Text style={styles.label}>Expiry</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} defaultValue="12/29" />

      <Text style={styles.label}>CVC</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} defaultValue="123" />

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
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
  label: { fontWeight: "600", marginTop: 10, marginBottom: 6, color: colors.text },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 24, marginBottom: 16 },
  totalLabel: { color: colors.text },
  totalValue: { fontWeight: "700", fontSize: 18, color: colors.text },
  error: { color: colors.danger, marginBottom: 12 },
  payButton: { backgroundColor: colors.accent, padding: 16, borderRadius: 12, alignItems: "center" },
  payText: { color: colors.accentText, fontWeight: "700" }
});
