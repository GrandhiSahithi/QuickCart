import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { storeApi } from "../../services/api";
import { useCart } from "../../context/CartContext";
import { colors } from "../../theme/colors";

function groupByCategory(products) {
  const map = new Map();
  for (const product of products) {
    const key = product.category || "Menu";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(product);
  }
  return [...map.entries()].map(([title, data]) => ({ title, data }));
}

export default function StoreDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { addItem, total, count } = useCart();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([storeApi.get(id), storeApi.products(id)])
      .then(([s, p]) => {
        if (!cancelled) {
          setStore(s);
          setProducts(p);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading || !store) {
    return <ActivityIndicator style={{ marginTop: 80 }} color={colors.accent} />;
  }

  const sections = groupByCategory(products);

  return (
    <View style={styles.safe}>
      <Stack.Screen options={{ title: store.name, headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.text }} />

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled
        ListHeaderComponent={<Image source={{ uri: store.imageUrl }} style={styles.header} />}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.productRow}>
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
            </View>
            <Pressable style={styles.addButton} onPress={() => addItem(store.id, store.name, item)}>
              <Text style={styles.addButtonText}>ADD</Text>
            </Pressable>
          </View>
        )}
      />

      {count > 0 && (
        <Pressable style={styles.floatingCart} onPress={() => router.push("/cart")}>
          <Text style={styles.floatingCartText}>View cart ({count}) · ${total.toFixed(2)}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { width: "100%", height: 160, backgroundColor: colors.surfaceAlt },
  list: { paddingHorizontal: 18, paddingBottom: 100 },
  sectionHeader: { backgroundColor: colors.background, paddingVertical: 12 },
  sectionHeaderText: { fontSize: 17, fontWeight: "800", color: colors.text },
  productRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: 14, padding: 12, marginBottom: 12, gap: 12 },
  productImage: { width: 56, height: 56, borderRadius: 10, backgroundColor: colors.surfaceAlt },
  productInfo: { flex: 1 },
  productName: { fontWeight: "700", color: colors.text },
  productPrice: { color: colors.textSecondary, marginTop: 4 },
  addButton: { backgroundColor: colors.accent, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  addButtonText: { color: colors.accentText, fontWeight: "700" },
  floatingCart: { position: "absolute", bottom: 24, left: 24, right: 24, backgroundColor: colors.accent, padding: 16, borderRadius: 30, alignItems: "center" },
  floatingCartText: { color: colors.accentText, fontWeight: "700" }
});
