import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { storeApi, orderApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";

const VERTICALS = [
  { key: "FOOD", label: "Food", emoji: "🍔" },
  { key: "GROCERY", label: "Grocery", emoji: "🥦" },
  { key: "MEDICINE", label: "Medicine", emoji: "💊" },
  { key: "SHOP", label: "Shop", emoji: "🛍️" },
  { key: "ELECTRONICS", label: "Electronics", emoji: "🎧" },
  { key: "FASHION", label: "Fashion", emoji: "👕" },
  { key: "BEAUTY", label: "Beauty", emoji: "💄" },
  { key: "PETS", label: "Pet Care", emoji: "🐾" }
];

export default function HomeScreen() {
  const [vertical, setVertical] = useState("FOOD");
  const [stores, setStores] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { count } = useCart();
  const { user, logout } = useAuth();

  useEffect(() => {
    orderApi
      .mine()
      .then((data) => setRecentOrders(data.slice(0, 3)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    storeApi
      .list(vertical)
      .then((data) => {
        if (!cancelled) setStores(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vertical]);

  const firstName = user?.name?.split(" ")[0];

  return (
    <View style={styles.safe}>
      <View style={styles.topBar}>
        <Text style={styles.logo}>QuickCart</Text>
        <View style={styles.topBarActions}>
          <Pressable onPress={() => router.push("/orders")}>
            <Text style={styles.link}>Orders</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/cart")}>
            <Text style={styles.link}>Cart{count > 0 ? ` (${count})` : ""}</Text>
          </Pressable>
          <Pressable onPress={logout}>
            <Text style={styles.link}>Logout</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.delivery}>{firstName ? `Hi ${firstName}, delivery in minutes` : "Delivery in minutes"}</Text>

      <FlatList
        data={stores}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <>
            {recentOrders.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Your recent orders</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentOrdersRow}>
                  {recentOrders.map((order) => (
                    <Pressable key={order.id} style={styles.recentOrderCard} onPress={() => router.push(`/orders/${order.id}`)}>
                      <Text style={styles.recentOrderStore}>{order.storeName}</Text>
                      <Text style={styles.recentOrderStatus}>{order.status.replace(/_/g, " ")}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.sectionTitle}>What are you looking for?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
              {VERTICALS.map((v) => (
                <Pressable
                  key={v.key}
                  style={[styles.tab, v.key === vertical && styles.tabActive]}
                  onPress={() => setVertical(v.key)}
                >
                  <Text style={styles.tabEmoji}>{v.emoji}</Text>
                  <Text style={[styles.tabLabel, v.key === vertical && styles.tabLabelActive]}>{v.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {loading && <ActivityIndicator style={{ marginTop: 20, marginBottom: 10 }} color={colors.accent} />}
          </>
        }
        renderItem={({ item }) => (
          <Pressable style={styles.storeCard} onPress={() => router.push(`/store/${item.id}`)}>
            <Image source={{ uri: item.imageUrl }} style={styles.storeImage} />
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{item.name}</Text>
              <Text style={styles.storeMeta}>⭐ {item.rating} · {item.etaMinutes} min</Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 22, paddingTop: 16 },
  logo: { fontSize: 26, fontWeight: "800", color: colors.text },
  topBarActions: { flexDirection: "row", gap: 16 },
  link: { fontWeight: "700", color: colors.accent },
  delivery: { marginTop: 6, marginLeft: 22, color: colors.textSecondary },
  sectionTitle: { fontSize: 17, fontWeight: "700", marginTop: 22, marginLeft: 22, marginBottom: 10, color: colors.text },
  recentOrdersRow: { paddingLeft: 22 },
  recentOrderCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 14, marginRight: 12, minWidth: 160 },
  recentOrderStore: { fontWeight: "700", marginBottom: 6, color: colors.text },
  recentOrderStatus: { fontSize: 12, fontWeight: "700", color: colors.accent, textTransform: "capitalize" },
  tabRow: { paddingLeft: 22 },
  tab: { backgroundColor: colors.surface, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", marginRight: 10 },
  tabActive: { backgroundColor: colors.accent },
  tabEmoji: { fontSize: 22 },
  tabLabel: { marginTop: 4, fontSize: 12, fontWeight: "700", color: colors.textSecondary },
  tabLabelActive: { color: colors.accentText },
  list: { padding: 22, paddingTop: 0 },
  storeCard: { backgroundColor: colors.surface, borderRadius: 16, overflow: "hidden", marginBottom: 14 },
  storeImage: { width: "100%", height: 130, backgroundColor: colors.surfaceAlt },
  storeInfo: { padding: 14 },
  storeName: { fontWeight: "700", fontSize: 16, color: colors.text },
  storeMeta: { color: colors.textSecondary, marginTop: 4 }
});
