import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Product } from "../data/products";
import { useCartStore } from "../store/cartStore";
import { colors, shadow } from "../theme";
import { Money } from "./Ui";

export function ProductCard({ product, onPress }: { product: Product; onPress?: () => void }) {
  const add = useCartStore((state) => state.add);
  const lowStock = product.stock < 50;

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Image source={{ uri: product.image }} style={styles.image} />
      {lowStock ? <Text style={styles.badge}>{product.stock < 15 ? "Critical" : "Low Stock"}</Text> : null}
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.name}>{product.name}</Text>
        <Text style={styles.category}>{product.category}</Text>
        <View style={styles.footer}>
          <Money value={product.price} />
          <Pressable style={styles.add} onPress={() => add(product)}>
            <Ionicons name="add" color="white" size={24} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 170,
    borderRadius: 22,
    backgroundColor: "white",
    overflow: "hidden",
    marginRight: 16,
    marginBottom: 18,
    ...shadow
  },
  image: {
    height: 118,
    width: "100%"
  },
  badge: {
    position: "absolute",
    right: 10,
    top: 10,
    overflow: "hidden",
    borderRadius: 999,
    backgroundColor: colors.danger,
    color: "white",
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontWeight: "900"
  },
  body: {
    padding: 14
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  category: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700"
  },
  footer: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  add: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  }
});
