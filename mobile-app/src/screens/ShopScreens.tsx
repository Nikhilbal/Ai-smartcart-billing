import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions, type BarcodeType } from "expo-camera";
import { useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Keyboard, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ProductCard } from "../components/ProductCard";
import { Card, Header, Money, PrimaryButton, Screen } from "../components/Ui";
import { categories, products, type Product } from "../data/products";
import { fetchProductByBarcode } from "../services/api";
import { useCustomerStore } from "../store/customerStore";
import { getCartOffers, getDiscountTotal, getExpectedWeight, getSubtotal, getTax, getTotal, useCartStore } from "../store/cartStore";
import { colors, shadow } from "../theme";

function IconButton({ name, onPress, tone = "#F3F4F6" }: { name: keyof typeof Ionicons.glyphMap; onPress?: () => void; tone?: string }) {
  return <Pressable style={[styles.iconButton, { backgroundColor: tone }]} onPress={onPress}><Ionicons name={name} size={25} color={tone === colors.primary ? "white" : colors.text} /></Pressable>;
}

function SearchBox({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={27} color="#9CA3AF" />
      <TextInput value={value} onChangeText={onChangeText} placeholder="Search products..." placeholderTextColor="#9CA3AF" style={styles.searchInput} />
    </View>
  );
}

function SectionTitle({ title, right, icon }: { title: string; right?: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {icon ? <Ionicons name={icon} size={22} color={colors.danger} /> : null}
        <Text style={styles.sectionTitleText}>{title}</Text>
      </View>
      {right ? <Text style={styles.sectionRight}>{right}</Text> : null}
    </View>
  );
}

const supportedBarcodeTypes: BarcodeType[] = ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "code93", "itf14", "codabar", "qr"];

export function HomeScreen({ navigation }: any) {
  const [query, setQuery] = useState("");
  const customer = useCustomerStore((state) => state.customer);
  const filtered = products.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <Screen padded={false}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 22 }}>
          <Header title={customer?.name ?? "Smart Cart Customer"} subtitle="Welcome back," right={<View style={{ flexDirection: "row", gap: 12 }}><IconButton name="notifications-outline" /><IconButton name="person-outline" tone={colors.primary} /></View>} />
          <SearchBox value={query} onChangeText={setQuery} />
        </View>
        <View style={styles.band}>
          <SectionTitle title="Trending This Week" right="1,234 sold" icon="trending-up-outline" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 22 }}>
            {filtered.slice(0, 4).map((product) => <ProductCard key={product.id} product={product} onPress={() => navigation.navigate("ProductDetails", { productId: product.id })} />)}
          </ScrollView>
          <SectionTitle title="Browse by Category" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 12 }}>
            {categories.slice(0, 5).map((category, index) => (
              <Pressable key={category} style={[styles.chip, index === 0 && styles.chipActive]}>
                <Text style={[styles.chipText, index === 0 && { color: colors.primary }]}>{index === 0 ? "🏪 " : ""}{category}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={{ flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 22, paddingTop: 24 }}>
            {products.slice(0, 6).map((product) => <ProductCard key={product.id} product={product} onPress={() => navigation.navigate("ProductDetails", { productId: product.id })} />)}
          </View>
        </View>
      </ScrollView>
      <Pressable style={styles.floatingScan} onPress={() => navigation.navigate("Scanner")}><Ionicons name="scan" size={28} color="white" /><Text style={styles.floatingScanText}>Scan</Text></Pressable>
    </Screen>
  );
}

export function BrowseScreen({ navigation }: any) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const filtered = useMemo(() => products.filter((product) => (category === "All" || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase())), [category, query]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Header title="Browse" subtitle="Find products by category" right={<IconButton name="filter-outline" />} />
        <SearchBox value={query} onChangeText={setQuery} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 22 }}>
          {categories.map((item) => <Pressable key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}><Text style={[styles.chipText, category === item && { color: colors.primary }]}>{item}</Text></Pressable>)}
        </ScrollView>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>{filtered.map((product) => <ProductCard key={product.id} product={product} onPress={() => navigation.navigate("ProductDetails", { productId: product.id })} />)}</View>
      </ScrollView>
    </Screen>
  );
}

export function ScannerScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [manualBarcode, setManualBarcode] = useState("");
  const manualBarcodeRef = useRef("");
  const submittingBarcodeRef = useRef(false);
  const [submittingBarcode, setSubmittingBarcode] = useState(false);
  const [scanResult, setScanResult] = useState<{ type: "success" | "error"; title: string; message: string; product?: Product } | null>(null);
  const add = useCartStore((state) => state.add);
  const cameraReady = permission?.granted;

  function normalizeBarcode(data: string) {
    return String(data).replace(/\D/g, "");
  }

  function updateManualBarcode(value: string) {
    const barcode = normalizeBarcode(value);
    manualBarcodeRef.current = barcode;
    setManualBarcode(barcode);
    if (scanResult?.type === "error") setScanResult(null);
  }

  async function requestCameraAccess() {
    setRequestingPermission(true);
    try {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera access needed",
          result.canAskAgain
            ? "Please choose Allow so Smart Cart can scan product barcodes."
            : "Camera permission is blocked. Open your phone settings and allow camera access for Smart Cart."
        );
      }
    } catch {
      Alert.alert("Camera unavailable", "Could not open camera permission. You can still enter the barcode manually below.");
    } finally {
      setRequestingPermission(false);
    }
  }

  async function handleBarcode(data: string) {
    const barcode = normalizeBarcode(data);
    if (!/^\d{8,14}$/.test(barcode)) {
      setScanResult({
        type: "error",
        title: "Invalid barcode",
        message: "Enter or scan the 8 to 14 digit number printed below the product bars."
      });
      return false;
    }

    if (submittingBarcodeRef.current) return false;
    submittingBarcodeRef.current = true;
    setSubmittingBarcode(true);
    setScanned(true);
    setScanResult(null);
    let product: Product | undefined;

    try {
      product = products.find((item) => normalizeBarcode(item.barcode) === barcode);

      if (!product) {
        try {
          product = await fetchProductByBarcode(barcode);
        } catch {
          product = undefined;
        }
      }

      if (!product) {
        setScanResult({
          type: "error",
          title: "Product not found",
          message: `Barcode ${barcode} is not in inventory yet. Add it in admin inventory before selling.`
        });
        return false;
      }

      add(product);
      updateManualBarcode("");
      setScanResult({
        type: "success",
        title: "Added to cart",
        message: `${product.name} · ₹${product.price} · ${product.weightKg} kg`,
        product
      });
      return true;
    } finally {
      submittingBarcodeRef.current = false;
      setSubmittingBarcode(false);
    }
  }

  async function handleManualBarcode(input = manualBarcodeRef.current || manualBarcode) {
    const code = normalizeBarcode(input);
    if (!/^\d{8,14}$/.test(code)) {
      setScanResult({
        type: "error",
        title: "Invalid barcode",
        message: "Enter the 8 to 14 digit barcode printed below the product bars."
      });
      return false;
    }
    return handleBarcode(code);
  }

  async function handleManualSubmitAndOpenCart() {
    Keyboard.dismiss();
    const code = manualBarcodeRef.current || manualBarcode;
    const added = await handleManualBarcode(code);
    if (added) navigation.navigate("Cart");
  }

  /*
    Keep this block below the main submit helpers so scanner, keyboard Enter,
    and the visible arrow all route through the same barcode lookup path.
  */
  function renderScanResult() {
    if (!scanResult) return null;

    return (
      <Card style={[styles.scanResultCard, scanResult.type === "success" ? styles.scanResultSuccess : styles.scanResultError]}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Ionicons name={scanResult.type === "success" ? "checkmark-circle-outline" : "alert-circle-outline"} size={28} color={scanResult.type === "success" ? colors.success : colors.danger} />
          <View style={{ flex: 1 }}>
            <Text style={styles.scanResultTitle}>{scanResult.title}</Text>
            <Text style={styles.scanResultMessage}>{scanResult.message}</Text>
          </View>
        </View>
        <View style={styles.scanResultActions}>
          <Pressable style={styles.scanAgainButton} onPress={() => { setScanned(false); setScanResult(null); }}>
            <Text style={styles.scanAgainText}>Scan More</Text>
          </Pressable>
          {scanResult.type === "success" ? (
            <Pressable style={styles.viewCartButton} onPress={() => navigation.navigate("Cart")}>
              <Text style={styles.viewCartText}>View Cart</Text>
            </Pressable>
          ) : null}
        </View>
      </Card>
    );
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={{ paddingBottom: 26 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 22 }}><Header title="Scan Barcode" subtitle="Point camera at product code" right={<IconButton name="flash-outline" />} /></View>
        <View style={styles.cameraWrap}>
          {cameraReady ? <CameraView style={StyleSheet.absoluteFill} barcodeScannerSettings={{ barcodeTypes: supportedBarcodeTypes }} onBarcodeScanned={scanned || submittingBarcode ? undefined : ({ data }) => handleBarcode(data)} /> : (
            <View style={styles.cameraFallback}>
              {requestingPermission ? <ActivityIndicator size="large" color={colors.primary} /> : <Ionicons name="camera-outline" size={64} color={colors.primary} />}
              <Text style={styles.cameraTitle}>{requestingPermission ? "Requesting camera access" : "Camera permission required"}</Text>
              <Text style={styles.cameraSub}>Allow camera access to scan real product barcodes like 8906032018513.</Text>
              <PrimaryButton title={requestingPermission ? "Waiting..." : "Allow Camera"} onPress={requestCameraAccess} color={requestingPermission ? "#93C5FD" : colors.primary} />
              {permission && !permission.granted && !permission.canAskAgain ? (
                <Pressable style={styles.settingsButton} onPress={() => Linking.openSettings().catch(() => Alert.alert("Open settings", "Open phone settings and allow camera access for Smart Cart."))}>
                  <Text style={styles.settingsText}>Open App Settings</Text>
                </Pressable>
              ) : null}
            </View>
          )}
          {cameraReady ? <View style={styles.scanFrame} /> : null}
        </View>
        <View style={{ padding: 22, gap: 12 }}>
          {cameraReady ? <Text style={styles.scanHint}>Keep the full barcode inside the green frame. If camera detection is slow, enter the printed number below.</Text> : null}
          <Text style={styles.muted}>Enter barcode manually</Text>
          <View style={styles.manualEntry}>
            <TextInput
              keyboardType="number-pad"
              maxLength={18}
              value={manualBarcode}
              onChangeText={updateManualBarcode}
              onKeyPress={(event) => {
                if (event.nativeEvent.key === "Enter") handleManualSubmitAndOpenCart();
              }}
              onSubmitEditing={(event) => handleManualSubmitAndOpenCart()}
              placeholder="8906032018513"
              placeholderTextColor="#9CA3AF"
              returnKeyType="done"
              style={styles.manualInput}
            />
            <Pressable accessibilityRole="button" hitSlop={14} style={[styles.manualSubmit, submittingBarcode && { backgroundColor: "#93C5FD" }]} onPress={handleManualSubmitAndOpenCart}>
              {submittingBarcode ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="arrow-forward" size={22} color="white" />}
            </Pressable>
          </View>
          <Pressable style={[styles.manualAddButton, !manualBarcode && styles.manualAddButtonDisabled]} onPress={handleManualSubmitAndOpenCart}>
            <Text style={styles.manualAddButtonText}>{submittingBarcode ? "Checking barcode..." : "Add Product from Barcode"}</Text>
          </Pressable>
          {renderScanResult()}
          <Text style={styles.muted}>Registered barcodes</Text>
          {products.slice(0, 5).map((product) => <Pressable key={product.id} style={styles.manualBarcode} onPress={() => handleBarcode(product.barcode)}><Text style={styles.manualName}>{product.name}</Text><Text style={styles.manualCode}>{product.barcode}</Text></Pressable>)}
        </View>
      </ScrollView>
    </Screen>
  );
}

export function ProductDetailsScreen({ route, navigation }: any) {
  const product = products.find((item) => item.id === route.params.productId) ?? products[0];
  const add = useCartStore((state) => state.add);
  return (
    <Screen padded={false}>
      <ScrollView>
        <Image source={{ uri: product.image }} style={styles.detailsImage} />
        <View style={{ padding: 22 }}>
          <IconButton name="arrow-back" onPress={() => navigation.goBack()} />
          <Text style={styles.detailsTitle}>{product.name}</Text>
          <Text style={styles.muted}>{product.category} · {product.supplier}</Text>
          <View style={styles.detailsPriceRow}><Money value={product.price} size={34} /><Text style={styles.mrp}>MRP ₹{product.mrp}</Text></View>
          <Card style={{ padding: 22, marginTop: 20 }}>
            <Text style={styles.muted}>{product.description}</Text>
            <Spec label="Barcode" value={product.barcode} />
            <Spec label="Weight" value={`${product.weightKg} kg`} />
            <Spec label="Stock" value={`${product.stock} units`} danger={product.stock < 50} />
          </Card>
        </View>
      </ScrollView>
      <View style={styles.stickyFooter}><PrimaryButton title="Add to Cart" icon="cart-outline" onPress={() => { add(product); navigation.navigate("Cart"); }} /></View>
    </Screen>
  );
}

function Spec({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <View style={styles.specRow}><Text style={styles.specLabel}>{label}</Text><Text style={[styles.specValue, danger && { color: colors.danger }]}>{value}</Text></View>;
}

export function CartScreen({ navigation }: any) {
  const items = useCartStore((state) => state.items);
  const add = useCartStore((state) => state.add);
  const remove = useCartStore((state) => state.remove);
  const changeQuantity = useCartStore((state) => state.changeQuantity);
  const subtotal = getSubtotal(items);
  const offers = getCartOffers(items);
  const discount = getDiscountTotal(items);
  const tax = getTax(items);
  const total = getTotal(items);
  const weight = getExpectedWeight(items);
  const suggestions = [products[5], products[6]];
  const empty = items.length === 0;

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 22 }}><Header title="Your Cart" subtitle={`${items.length} items · ${weight.toFixed(2)} kg`} right={<View style={styles.totalPill}><Money value={total} size={20} /></View>} /></View>
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 190 }} showsVerticalScrollIndicator={false}>
        {empty ? (
          <Card style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={74} color={colors.primary} />
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptySub}>Scan a barcode or browse products to start shopping.</Text>
            <View style={{ flexDirection: "row", gap: 12, marginTop: 20 }}>
              <Pressable style={[styles.emptyAction, { backgroundColor: colors.primary }]} onPress={() => navigation.navigate("Scanner")}><Text style={styles.emptyActionText}>Scan</Text></Pressable>
              <Pressable style={styles.emptyActionSecondary} onPress={() => navigation.navigate("Main")}><Text style={[styles.emptyActionText, { color: colors.primary }]}>Browse</Text></Pressable>
            </View>
          </Card>
        ) : (
        <>
        <Card style={styles.suggestCard}>
          <Text style={styles.suggestTitle}>✦ Suggested Add-ons</Text>
          {suggestions.map((product) => (
            <View key={product.id} style={styles.suggestRow}>
              <Image source={{ uri: product.image }} style={styles.suggestImage} />
              <View style={{ flex: 1 }}><Text style={styles.suggestName}>{product.name}</Text><Text style={styles.suggestReason}>{product.id === "p6" ? "Perfect with your Bread" : "Best seller this week"}</Text></View>
              <Money value={product.price} color={colors.purple} />
              <Pressable style={styles.addSmall} onPress={() => add(product)}><Text style={styles.addSmallText}>+ Add</Text></Pressable>
            </View>
          ))}
        </Card>
        <Text style={styles.blockTitle}>Your Items</Text>
        {items.map((item) => (
          <Card key={item.product.id} style={styles.cartItem}>
            <Image source={{ uri: item.product.image }} style={styles.cartImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cartName}>{item.product.name}</Text>
              <Text style={styles.mutedSmall}>{item.product.weightKg}kg × {item.quantity} = {(item.product.weightKg * item.quantity).toFixed(2)}kg</Text>
              <View style={styles.qtyRow}>
                <Pressable style={styles.qtyButton} onPress={() => changeQuantity(item.product.id, -1)}><Text style={styles.qtyText}>−</Text></Pressable>
                <Text style={styles.qtyNumber}>{item.quantity}</Text>
                <Pressable style={[styles.qtyButton, { backgroundColor: colors.primary }]} onPress={() => changeQuantity(item.product.id, 1)}><Text style={[styles.qtyText, { color: "white" }]}>+</Text></Pressable>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 20 }}><Money value={item.product.price * item.quantity} size={20} /><Pressable onPress={() => remove(item.product.id)}><Ionicons name="trash-outline" size={24} color={colors.danger} /></Pressable></View>
          </Card>
        ))}
        <Card style={styles.priceCard}>
          <Text style={styles.blockTitle}>Price Breakdown</Text>
          <Price label="Subtotal" value={subtotal} />
          {offers.length > 0 ? (
            <View style={styles.offerBox}>
              <Text style={styles.offerTitle}>Offers Applied</Text>
              {offers.map((offer) => (
                <View key={offer.id} style={styles.offerRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.offerName}>{offer.title}</Text>
                    <Text style={styles.offerDesc}>{offer.description}</Text>
                  </View>
                  <Text style={styles.offerDiscount}>-₹{offer.discount.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          ) : null}
          <View style={styles.priceRow}><Text style={styles.priceLabel}>Discount</Text><Text style={styles.discountText}>-₹{discount.toFixed(2)}</Text></View>
          <Price label="GST (5%)" value={tax} />
          <Price label="Total" value={total} large />
        </Card>
        </>
        )}
      </ScrollView>
      <View style={styles.cartFooter}>
        <PrimaryButton title="Proceed to Weight Verification" color={empty ? "#BFDBFE" : colors.primary} onPress={() => empty ? Alert.alert("Cart is empty", "Please add at least one product before weight verification.") : navigation.navigate("WeightStart")} />
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Main")}><Text style={styles.secondaryButtonText}>Continue Shopping</Text></Pressable>
      </View>
    </Screen>
  );
}

function Price({ label, value, large }: { label: string; value: number; large?: boolean }) {
  return <View style={styles.priceRow}><Text style={styles.priceLabel}>{label}</Text><Money value={value} color={large ? colors.primary : colors.text} size={large ? 28 : 22} /></View>;
}

export function CartTabScreen({ navigation }: any) {
  return <CartScreen navigation={navigation} />;
}

export function ProfileScreen({ navigation }: any) {
  const customer = useCustomerStore((state) => state.customer);
  const profile = customer ?? { name: "Smart Cart Customer", mobile: "0000000000", email: "customer@smartcart.local", loyalty: 0, visits: 0 };

  return (
    <Screen>
      <Header title="Profile" subtitle={profile.name} right={<IconButton name="person-outline" />} />
      <Card style={{ padding: 24 }}>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.muted}>+91 {profile.mobile} · {profile.email}</Text>
        <View style={styles.profileStats}><View><Text style={styles.stat}>{profile.loyalty}</Text><Text style={styles.muted}>Loyalty pts</Text></View><View><Text style={styles.stat}>{profile.visits}</Text><Text style={styles.muted}>Visits</Text></View></View>
      </Card>
      <Pressable style={styles.profileRow} onPress={() => navigation.navigate("OrderHistory")}><Text style={styles.profileRowText}>Order History</Text><Ionicons name="chevron-forward" size={24} /></Pressable>
      <Pressable style={styles.profileRow}><Text style={styles.profileRowText}>Payment Methods</Text><Ionicons name="chevron-forward" size={24} /></Pressable>
      <Pressable style={styles.profileRow}><Text style={styles.profileRowText}>Help & Support</Text><Ionicons name="chevron-forward" size={24} /></Pressable>
    </Screen>
  );
}

export function OrderHistoryScreen() {
  return (
    <Screen>
      <Header title="Order History" subtitle="Recent Smart Cart bills" />
      {[
        ["BL20260527003209", "₹94.50", "27 May 2026"],
        ["BL20260521005672", "₹506.00", "21 May 2026"],
        ["BL20260512001744", "₹270.00", "12 May 2026"]
      ].map(([id, amount, date]) => <Card key={id} style={styles.historyCard}><View><Text style={styles.cartName}>{id}</Text><Text style={styles.mutedSmall}>{date}</Text></View><Text style={styles.historyAmount}>{amount}</Text></Card>)}
    </Screen>
  );
}

const styles = StyleSheet.create({
  iconButton: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  search: { height: 76, borderRadius: 28, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#F3F4F6", paddingHorizontal: 22 },
  searchInput: { flex: 1, color: colors.text, fontSize: 21, fontWeight: "800" },
  band: { marginTop: 30, paddingTop: 28, backgroundColor: colors.background },
  sectionTitle: { paddingHorizontal: 22, marginBottom: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitleText: { color: colors.text, fontSize: 25, fontWeight: "900" },
  sectionRight: { color: colors.muted, fontSize: 18, fontWeight: "800" },
  chip: { height: 50, borderRadius: 25, paddingHorizontal: 24, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  chipActive: { borderColor: colors.primary, backgroundColor: "#EFF6FF" },
  chipText: { color: "#374151", fontSize: 17, fontWeight: "900" },
  floatingScan: { position: "absolute", left: 24, bottom: 28, width: 96, height: 76, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", ...shadow },
  floatingScanText: { marginTop: 4, color: "white", fontWeight: "900" },
  cameraWrap: { height: 420, marginHorizontal: 22, borderRadius: 32, overflow: "hidden", backgroundColor: "#111827" },
  cameraFallback: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#EFF6FF" },
  cameraTitle: { marginVertical: 20, color: colors.text, fontSize: 22, fontWeight: "900" },
  cameraSub: { marginBottom: 18, color: colors.muted, textAlign: "center", fontSize: 16, lineHeight: 24, fontWeight: "800" },
  settingsButton: { marginTop: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.primary, paddingHorizontal: 18, paddingVertical: 10, backgroundColor: "white" },
  settingsText: { color: colors.primary, fontSize: 15, fontWeight: "900" },
  scanFrame: { position: "absolute", left: 58, right: 58, top: 115, bottom: 115, borderWidth: 4, borderColor: colors.success, borderRadius: 28 },
  scanHint: { color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: "800" },
  manualEntry: { height: 64, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: "white", flexDirection: "row", alignItems: "center", paddingLeft: 18, paddingRight: 8 },
  manualInput: { flex: 1, color: colors.text, fontSize: 19, fontFamily: "Courier", fontWeight: "900" },
  manualSubmit: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  manualAddButton: { minHeight: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary },
  manualAddButtonDisabled: { backgroundColor: "#BFDBFE" },
  manualAddButtonText: { color: "white", fontSize: 16, fontWeight: "900" },
  scanResultCard: { padding: 18, gap: 16 },
  scanResultSuccess: { borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" },
  scanResultError: { borderColor: "#FECACA", backgroundColor: "#FEF2F2" },
  scanResultTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  scanResultMessage: { marginTop: 4, color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: "800" },
  scanResultActions: { flexDirection: "row", gap: 12 },
  scanAgainButton: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: colors.border, alignItems: "center", paddingVertical: 12, backgroundColor: "white" },
  scanAgainText: { color: colors.text, fontSize: 15, fontWeight: "900" },
  viewCartButton: { flex: 1, borderRadius: 16, alignItems: "center", paddingVertical: 12, backgroundColor: colors.primary },
  viewCartText: { color: "white", fontSize: 15, fontWeight: "900" },
  manualBarcode: { borderRadius: 18, padding: 16, backgroundColor: "white", flexDirection: "row", justifyContent: "space-between" },
  manualName: { color: colors.text, fontWeight: "900" },
  manualCode: { color: colors.muted, fontFamily: "Courier", fontWeight: "800" },
  muted: { marginTop: 8, color: colors.muted, fontSize: 18, lineHeight: 28, fontWeight: "700" },
  mutedSmall: { marginTop: 6, color: colors.muted, fontSize: 16, fontWeight: "800" },
  detailsImage: { height: 360, width: "100%" },
  detailsTitle: { marginTop: 24, color: colors.text, fontSize: 34, fontWeight: "900" },
  detailsPriceRow: { marginTop: 18, flexDirection: "row", alignItems: "flex-end", gap: 16 },
  mrp: { color: "#9CA3AF", fontSize: 18, fontWeight: "800", textDecorationLine: "line-through" },
  specRow: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border, flexDirection: "row", justifyContent: "space-between" },
  specLabel: { color: colors.muted, fontSize: 17, fontWeight: "800" },
  specValue: { color: colors.text, fontSize: 17, fontWeight: "900" },
  stickyFooter: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 22, backgroundColor: "rgba(248,250,252,0.96)" },
  totalPill: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: "#EFF6FF" },
  emptyCart: { minHeight: 360, alignItems: "center", justifyContent: "center", padding: 28 },
  emptyTitle: { marginTop: 18, color: colors.text, fontSize: 26, fontWeight: "900" },
  emptySub: { marginTop: 10, color: colors.muted, textAlign: "center", fontSize: 17, lineHeight: 25, fontWeight: "800" },
  emptyAction: { minWidth: 112, borderRadius: 18, alignItems: "center", paddingHorizontal: 18, paddingVertical: 12 },
  emptyActionSecondary: { minWidth: 112, borderRadius: 18, borderWidth: 1, borderColor: colors.primary, alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, backgroundColor: "#EFF6FF" },
  emptyActionText: { color: "white", fontSize: 16, fontWeight: "900" },
  suggestCard: { borderColor: "#DDD6FE", backgroundColor: "#F5F3FF", paddingVertical: 18, marginBottom: 28 },
  suggestTitle: { paddingHorizontal: 20, paddingBottom: 14, color: colors.purple, fontSize: 22, fontWeight: "900" },
  suggestRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 14 },
  suggestImage: { width: 62, height: 62, borderRadius: 18 },
  suggestName: { color: colors.text, fontSize: 18, fontWeight: "900" },
  suggestReason: { marginTop: 4, color: colors.purple, fontSize: 15, fontWeight: "800" },
  addSmall: { borderRadius: 18, backgroundColor: colors.purple, paddingHorizontal: 16, paddingVertical: 10 },
  addSmallText: { color: "white", fontSize: 16, fontWeight: "900" },
  blockTitle: { marginBottom: 16, color: "#374151", fontSize: 25, fontWeight: "900" },
  cartItem: { marginBottom: 18, padding: 16, flexDirection: "row", gap: 16 },
  cartImage: { width: 92, height: 92, borderRadius: 22 },
  cartName: { color: colors.text, fontSize: 20, fontWeight: "900" },
  qtyRow: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 16 },
  qtyButton: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  qtyText: { color: colors.text, fontSize: 26, fontWeight: "900" },
  qtyNumber: { color: colors.text, fontSize: 22, fontWeight: "900" },
  priceCard: { padding: 22 },
  offerBox: { marginVertical: 12, borderRadius: 18, borderWidth: 1, borderColor: "#A7F3D0", backgroundColor: "#ECFDF5", padding: 14 },
  offerTitle: { color: "#047857", fontSize: 16, fontWeight: "900", marginBottom: 8 },
  offerRow: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 8 },
  offerName: { color: colors.text, fontSize: 15, fontWeight: "900" },
  offerDesc: { marginTop: 3, color: "#047857", fontSize: 13, fontWeight: "800" },
  offerDiscount: { color: colors.success, fontFamily: "Courier", fontSize: 16, fontWeight: "900" },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13 },
  priceLabel: { color: colors.muted, fontSize: 18, fontWeight: "800" },
  discountText: { color: colors.success, fontFamily: "Courier", fontSize: 22, fontWeight: "900" },
  cartFooter: { position: "absolute", left: 0, right: 0, bottom: 0, gap: 14, padding: 22, backgroundColor: "rgba(255,255,255,0.97)" },
  secondaryButton: { minHeight: 58, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  secondaryButtonText: { color: "#374151", fontSize: 18, fontWeight: "900" },
  profileName: { color: colors.text, fontSize: 30, fontWeight: "900" },
  profileStats: { marginTop: 26, flexDirection: "row", justifyContent: "space-around" },
  stat: { color: colors.primary, fontFamily: "Courier", fontSize: 34, fontWeight: "900", textAlign: "center" },
  profileRow: { marginTop: 14, minHeight: 64, borderRadius: 20, backgroundColor: "white", paddingHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  profileRowText: { color: colors.text, fontSize: 18, fontWeight: "900" },
  historyCard: { padding: 20, marginBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  historyAmount: { color: colors.primary, fontFamily: "Courier", fontSize: 22, fontWeight: "900" }
});
