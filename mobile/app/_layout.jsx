import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { colors } from "../theme/colors";

function AuthGate({ children }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthScreen = segments[0] === "login" || segments[0] === "signup";
    if (!user && !inAuthScreen) {
      router.replace("/login");
    }
  }, [user, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return children;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="light" />
          <AuthGate>
            <Stack
              screenOptions={{
                headerTitle: "QuickCart",
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.text,
                contentStyle: { backgroundColor: colors.background }
              }}
            />
          </AuthGate>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
