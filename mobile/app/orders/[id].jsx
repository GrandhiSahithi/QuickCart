import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { orderApi } from "../../services/api";
import { colors } from "../../theme/colors";

const STATUS_STEPS = ["PLACED", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"];
const STATUS_LABELS = {
  PLACED: "Order placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered"
};

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);

  useEffect(() => {
    orderApi.get(id).then(setOrder);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    let timer;

    async function poll() {
      try {
        const data = await orderApi.tracking(id);
        if (cancelled) return;
        setTracking(data);
        if (data.status !== "DELIVERED" && data.status !== "CANCELLED") {
          timer = setTimeout(poll, 2000);
        }
      } catch {
        if (!cancelled) timer = setTimeout(poll, 3000);
      }
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (!order || !tracking) {
    return <ActivityIndicator style={{ marginTop: 80 }} color={colors.accent} />;
  }

  const currentIndex = STATUS_STEPS.indexOf(tracking.status);
  const isOutForDelivery = tracking.status === "OUT_FOR_DELIVERY";
  const isDelivered = tracking.status === "DELIVERED";

  return (
    <View style={styles.safe}>
      <Text style={styles.title}>Order #{order.id}</Text>
      <Text style={styles.storeName}>From {order.storeName}</Text>

      <View style={styles.timeline}>
        {STATUS_STEPS.map((step, i) => (
          <View key={step} style={styles.stepWrap}>
            <View style={[styles.dot, i <= currentIndex && styles.dotDone]} />
            <Text style={[styles.stepLabel, i <= currentIndex && styles.stepLabelDone]}>{STATUS_LABELS[step]}</Text>
          </View>
        ))}
      </View>

      <View style={styles.routeCard}>
        <View style={styles.routePoint}>
          <Text style={styles.routeIcon}>🏬</Text>
          <Text style={styles.routeLabel}>{order.storeName}</Text>
        </View>

        <View style={styles.routeConnector}>
          <View style={styles.routeLine} />
          {isOutForDelivery && <Text style={styles.routeRiderIcon}>🛵</Text>}
          <View style={styles.routeLine} />
        </View>

        <View style={styles.routePoint}>
          <Text style={styles.routeIcon}>{isDelivered ? "✅" : "📍"}</Text>
          <Text style={styles.routeLabel}>Delivery address</Text>
        </View>
      </View>

      <View style={styles.summary}>
        {order.items.map((item) => (
          <View key={item.productId} style={styles.itemRow}>
            <Text style={styles.itemText}>{item.quantity} × {item.productName}</Text>
            <Text style={styles.itemText}>${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${order.totalAmount.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 18 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  storeName: { color: colors.textSecondary, marginBottom: 12 },
  timeline: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  stepWrap: { flex: 1, alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border, marginBottom: 6 },
  dotDone: { backgroundColor: colors.accent },
  stepLabel: { fontSize: 10, color: colors.textMuted, textAlign: "center" },
  stepLabelDone: { color: colors.accent, fontWeight: "700" },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center"
  },
  routePoint: { alignItems: "center", gap: 6 },
  routeIcon: { fontSize: 28 },
  routeLabel: { color: colors.text, fontWeight: "700", fontSize: 13 },
  routeConnector: { alignItems: "center", paddingVertical: 6 },
  routeLine: { width: 2, height: 18, backgroundColor: colors.border },
  routeRiderIcon: { fontSize: 22, marginVertical: 2 },
  summary: { backgroundColor: colors.surface, borderRadius: 14, padding: 16 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  itemText: { color: colors.textSecondary },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { color: colors.text },
  totalValue: { fontWeight: "700", color: colors.text }
});
