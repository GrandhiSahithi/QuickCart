import { useRef } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { colors } from "../theme/colors";

export default function OtpInput({ length = 6, value, onChange }) {
  const inputsRef = useRef([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  function setDigit(index, char) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join(""));
  }

  function handleChange(index, raw) {
    const digitsOnly = raw.replace(/\D/g, "");
    if (!digitsOnly) {
      setDigit(index, "");
      return;
    }
    setDigit(index, digitsOnly[digitsOnly.length - 1]);
    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index, e) {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  return (
    <View style={styles.row}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          style={styles.digit}
          keyboardType="number-pad"
          maxLength={1}
          value={digit}
          onChangeText={(raw) => handleChange(i, raw)}
          onKeyPress={(e) => handleKeyPress(i, e)}
          autoFocus={i === 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, justifyContent: "center" },
  digit: {
    width: 44,
    height: 52,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center"
  }
});
