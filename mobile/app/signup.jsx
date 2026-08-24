import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { getPasswordChecks, getPasswordStrength, isPasswordValid } from "../utils/password";
import { colors } from "../theme/colors";
import PasswordInput from "../components/PasswordInput";

const RULES = [
  { key: "length", label: "At least 8 characters" },
  { key: "upper", label: "One uppercase letter" },
  { key: "lower", label: "One lowercase letter" },
  { key: "number", label: "One number" },
  { key: "special", label: "One special character" }
];

const STRENGTH_COLORS = { 0: colors.border, 1: colors.danger, 2: colors.danger, 3: colors.warning, 4: colors.warning, 5: colors.success };

export default function SignupScreen() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const checks = getPasswordChecks(password);
  const strength = getPasswordStrength(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit = name && email && isPasswordValid(password) && passwordsMatch;

  async function handleSubmit() {
    setError(null);

    if (!isPasswordValid(password)) {
      setError("Password doesn't meet all the requirements below.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await signup(name, email, password);
      router.replace("/");
    } catch (err) {
      if (err?.response?.status === 409) {
        setError("That email is already registered.");
      } else if (err?.response?.status === 400) {
        setError("Please check your details and try again.");
      } else {
        setError("Couldn't create your account.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.safe}>
      <Text style={styles.title}>Create Account</Text>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} placeholder="Full name" />

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

      {password.length > 0 && (
        <View style={styles.strengthWrap}>
          <View style={styles.strengthBarTrack}>
            <View style={[styles.strengthBarFill, { width: `${(strength.score / 5) * 100}%`, backgroundColor: STRENGTH_COLORS[strength.score] }]} />
          </View>
          <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[strength.score] }]}>{strength.label}</Text>
        </View>
      )}

      <View style={styles.rules}>
        {RULES.map((rule) => (
          <Text key={rule.key} style={[styles.ruleText, checks[rule.key] && styles.ruleMet]}>
            {checks[rule.key] ? "✓" : "•"} {rule.label}
          </Text>
        ))}
      </View>

      <Text style={styles.label}>Re-enter Password</Text>
      <PasswordInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Re-enter password" />
      {confirmPassword.length > 0 && !passwordsMatch && <Text style={styles.error}>Passwords don't match</Text>}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={[styles.button, !canSubmit && styles.buttonDisabled]} onPress={handleSubmit} disabled={submitting || !canSubmit}>
        {submitting ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.buttonText}>Sign Up</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 22, justifyContent: "center" },
  title: { fontSize: 26, fontWeight: "800", marginBottom: 20, color: colors.text },
  label: { fontWeight: "600", marginBottom: 6, marginTop: 10, color: colors.text },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text },
  strengthWrap: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  strengthBarTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.surfaceAlt, overflow: "hidden" },
  strengthBarFill: { height: 6, borderRadius: 3 },
  strengthLabel: { fontSize: 12, fontWeight: "700" },
  rules: { marginTop: 10 },
  ruleText: { fontSize: 12, color: colors.textSecondary, marginVertical: 2 },
  ruleMet: { color: colors.success },
  error: { color: colors.danger, marginTop: 12 },
  button: { backgroundColor: colors.accent, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 20 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.accentText, fontWeight: "700" }
});
