import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import { colors, shadow } from "../theme";

export function Screen({ children, padded = true }: { children: ReactNode; padded?: boolean }) {
  return <View style={[styles.screen, padded && styles.padded]}>{children}</View>;
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle | ViewStyle[] }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  title,
  onPress,
  color = colors.primary,
  icon = "arrow-forward"
}: {
  title: string;
  onPress: () => void;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.button, { backgroundColor: color, transform: [{ scale: pressed ? 0.98 : 1 }] }]} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
      <Ionicons name={icon} color="white" size={25} />
    </Pressable>
  );
}

export function Header({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

export function Money({ value, size = 24, color = colors.primary }: { value: number; size?: number; color?: string }) {
  return <Text style={{ color, fontSize: size, fontWeight: "900", fontFamily: "Courier" }}>₹{value.toFixed(value % 1 ? 2 : 0)}</Text>;
}

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  padded: {
    paddingHorizontal: 22
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow
  },
  button: {
    minHeight: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 22,
    ...shadow
  },
  buttonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "900"
  },
  header: {
    paddingTop: 66,
    paddingBottom: 26,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  headerTitle: {
    color: colors.text,
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: 0
  },
  headerSubtitle: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 18,
    fontWeight: "700"
  }
});
