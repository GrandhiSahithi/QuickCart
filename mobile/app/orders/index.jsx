import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { orderApi } from "../../services/api";
import { colors } from "../../theme/colors";

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    orderApi.mine().then(setOrders).finally(() => setLoading(false));
  }, []);

  if (loading) return <ActivityIndicator style={{ marginTop: 80 }} color={colors.accent} />;

  if (!orders.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptyText}>Your order history will show up here.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.safe}
      data={orders}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/orders/${item.id}`)}>
          <View>
            <Text style={styles.storeName}>{item.storeName}</Text>
            <Text style={styles.meta}>
              {new Date(item.createdAt).toLocaleString()} · {item.items.length} item(s)
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.status}>{item.status.replace(/_/g, " ")}</Text>
            <Text style={styles.total}>${item.totalAmount.toFixed(2)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40, backgroundColor: colors.background },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  emptyText: { color: colors.textSecondary, marginTop: 8, textAlign: "center" },
  list: { padding: 18 },
  row: { flexDirection: "row", justifyContent: "space-between", backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12 },
  storeName: { fontWeight: "700", color: colors.text },
  meta: { color: colors.textSecondary, marginTop: 4, fontSize: 12 },
  right: { alignItems: "flex-end" },
  status: { fontWeight: "700", color: colors.accent, fontSize: 12, textTransform: "capitalize" },
  total: { fontWeight: "700", marginTop: 6, color: colors.text }
});
