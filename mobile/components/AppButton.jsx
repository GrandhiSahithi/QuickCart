import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../theme/colors";

export default function AppButton({ title, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center"
  },
  text: {
    color: "white",
    fontWeight: "700"
  }
});
