import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
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
  const riderPosition = {
    latitude: tracking.currentLat ?? tracking.storeLat,
    longitude: tracking.currentLng ?? tracking.storeLng
  };

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

      <MapView
        provider={PROVIDER_DEFAULT}
        userInterfaceStyle="dark"
        style={styles.map}
        initialRegion={{
          latitude: (tracking.storeLat + tracking.destLat) / 2,
          longitude: (tracking.storeLng + tracking.destLng) / 2,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06
        }}
      >
        <Marker coordinate={{ latitude: tracking.storeLat, longitude: tracking.storeLng }} title={order.storeName} pinColor={colors.accent} />
        <Marker coordinate={{ latitude: tracking.destLat, longitude: tracking.destLng }} title="Delivery address" />
        {tracking.status === "OUT_FOR_DELIVERY" && (
          <Marker coordinate={riderPosition} title="Your delivery">
            <Text style={{ fontSize: 26 }}>🛵</Text>
          </Marker>
        )}
        <Polyline
          coordinates={[
            { latitude: tracking.storeLat, longitude: tracking.storeLng },
            { latitude: tracking.destLat, longitude: tracking.destLng }
          ]}
          strokeColor={colors.accent}
          lineDashPattern={[6, 8]}
        />
      </MapView>

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
  map: { height: 320, borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  summary: { backgroundColor: colors.surface, borderRadius: 14, padding: 16 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  itemText: { color: colors.textSecondary },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border },
  totalLabel: { color: colors.text },
  totalValue: { fontWeight: "700", color: colors.text }
});
