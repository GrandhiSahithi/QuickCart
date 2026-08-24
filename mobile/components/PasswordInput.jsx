import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../theme/colors";

export default function PasswordInput({ value, onChangeText, placeholder, onBlur }) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.input}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={!visible}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
      />
      <Pressable style={styles.toggle} onPress={() => setVisible((v) => !v)}>
        <Text style={styles.toggleText}>{visible ? "Hide" : "Show"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", justifyContent: "center" },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    paddingRight: 60,
    color: colors.text
  },
  toggle: { position: "absolute", right: 10, padding: 6 },
  toggleText: { color: colors.accent, fontWeight: "700", fontSize: 12 }
});
