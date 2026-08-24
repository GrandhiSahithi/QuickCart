import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import PasswordInput from "../components/PasswordInput";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.safe}>
      <Text style={styles.logo}>QuickCart</Text>
      <Text style={styles.title}>Welcome back</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
      />

      <Text style={styles.label}>Password</Text>
      <PasswordInput value={password} onChangeText={setPassword} placeholder="Password" />

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.buttonText}>Login</Text>}
      </Pressable>

      <Pressable onPress={() => router.push("/signup")}>
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 22, justifyContent: "center" },
  logo: { fontSize: 20, fontWeight: "800", color: colors.accent, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 20, color: colors.text, textAlign: "center" },
  label: { fontWeight: "600", marginBottom: 6, marginTop: 10, color: colors.text },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text },
  error: { color: colors.danger, marginTop: 12 },
  button: { backgroundColor: colors.accent, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 20 },
  buttonText: { color: colors.accentText, fontWeight: "700" },
  link: { color: colors.accent, textAlign: "center", marginTop: 16, fontWeight: "600" }
});
