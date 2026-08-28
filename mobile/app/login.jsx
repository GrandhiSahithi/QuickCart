import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import PasswordInput from "../components/PasswordInput";
import OtpInput from "../components/OtpInput";

const RESEND_COOLDOWN = 30;

export default function LoginScreen() {
  const { login, verifyOtp, resendOtp } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handlePasswordSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      setStep("otp");
      setCode("");
      setInfo(`We sent a 6-digit code to ${email}.`);
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOtpSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await verifyOtp(email, code);
      router.replace("/");
    } catch {
      setError("That code is invalid or has expired.");
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    setError(null);
    try {
      await resendOtp(email);
      setInfo("We sent you a new code.");
      setCooldown(RESEND_COOLDOWN);
    } catch {
      setError("Couldn't resend the code. Please try again shortly.");
    }
  }

  function backToPassword() {
    setStep("password");
    setCode("");
    setError(null);
    setInfo(null);
  }

  if (step === "otp") {
    return (
      <View style={styles.safe}>
        <Text style={styles.logo}>QuickCart</Text>
        <Text style={styles.title}>Enter your code</Text>
        {info && <Text style={styles.subtitle}>{info}</Text>}

        <OtpInput value={code} onChange={setCode} />

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.button, (submitting || code.length !== 6) && styles.buttonDisabled]}
          onPress={handleOtpSubmit}
          disabled={submitting || code.length !== 6}
        >
          {submitting ? <ActivityIndicator color={colors.accentText} /> : <Text style={styles.buttonText}>Verify & continue</Text>}
        </Pressable>

        <View style={styles.otpActions}>
          <Pressable onPress={handleResend} disabled={cooldown > 0}>
            <Text style={[styles.link, cooldown > 0 && styles.linkDisabled]}>
              {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
            </Text>
          </Pressable>
          <Pressable onPress={backToPassword}>
            <Text style={styles.link}>Use a different email</Text>
          </Pressable>
        </View>
      </View>
    );
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

      <Pressable style={styles.button} onPress={handlePasswordSubmit} disabled={submitting}>
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
  subtitle: { color: colors.textSecondary, textAlign: "center", marginBottom: 20 },
  label: { fontWeight: "600", marginBottom: 6, marginTop: 10, color: colors.text },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text },
  error: { color: colors.danger, marginTop: 12, textAlign: "center" },
  button: { backgroundColor: colors.accent, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 20 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.accentText, fontWeight: "700" },
  link: { color: colors.accent, textAlign: "center", marginTop: 16, fontWeight: "600" },
  linkDisabled: { color: colors.textMuted },
  otpActions: { marginTop: 4 }
});
