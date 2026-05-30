import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Alert, Image, ImageBackground, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Header, PrimaryButton, Screen } from "../components/Ui";
import { onboarding } from "../data/products";
import { useCustomerStore } from "../store/customerStore";
import { colors, shadow } from "../theme";

export function SplashScreen({ navigation }: any) {
  const loadCustomer = useCustomerStore((state) => state.loadCustomer);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    loadCustomer().finally(() => {
      timer = setTimeout(() => navigation.replace("Onboarding"), 900);
    });
    return () => clearTimeout(timer);
  }, [loadCustomer, navigation]);

  return (
    <ImageBackground source={{ uri: onboarding[1].image }} style={{ flex: 1 }}>
      <LinearGradient colors={["rgba(37,99,235,0.78)", "rgba(17,24,39,0.78)"]} style={styles.splash}>
        <View style={styles.splashLogo}><Ionicons name="cart-outline" size={58} color="white" /></View>
        <Text style={styles.splashTitle}>Smart Cart</Text>
        <Text style={styles.splashSub}>Smart Supermarket Billing System</Text>
      </LinearGradient>
    </ImageBackground>
  );
}

export function OnboardingScreen({ navigation }: any) {
  const [index, setIndex] = useState(0);
  const customer = useCustomerStore((state) => state.customer);
  const slide = onboarding[index];
  const last = index === onboarding.length - 1;
  const continueRoute = customer ? "Main" : "Login";

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.onboarding}>
        <View style={styles.topRow}>
          <View style={styles.progressRow}>
            {onboarding.map((item, i) => <View key={item.title} style={[styles.progress, { width: i === index ? 58 : 16, backgroundColor: i === index ? slide.color : "#E5E7EB" }]} />)}
          </View>
          <Pressable style={styles.skip} onPress={() => navigation.replace(continueRoute)}><Text style={styles.skipText}>Skip</Text></Pressable>
        </View>
        <View style={styles.hero}>
          <Image source={{ uri: slide.image }} style={styles.heroImage} />
          <View style={[styles.heroIcon, { backgroundColor: slide.color }]}>
            <Ionicons name={slide.icon as keyof typeof Ionicons.glyphMap} size={42} color="white" />
          </View>
          <View style={styles.count}><Text style={[styles.countText, { color: slide.color }]}>{index + 1} / 4</Text></View>
        </View>
        <Text style={[styles.tag, { color: slide.color, backgroundColor: `${slide.color}12` }]}>{slide.tag}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
        {index === 0 ? (
          <View style={styles.featureRow}>
            {[
              ["flash-outline", "< 2 min\ncheckout"],
              ["lock-closed-outline", "Fraud\nprotected"],
              ["sparkles-outline", "AI-powered"]
            ].map(([icon, label]) => (
              <View key={label} style={styles.feature}>
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={28} color={slide.color} />
                <Text style={styles.featureText}>{label}</Text>
              </View>
            ))}
          </View>
        ) : null}
        <View style={styles.dots}>
          {onboarding.map((item, i) => <View key={item.title} style={[styles.dot, { width: i === index ? 48 : 14, backgroundColor: i === index ? slide.color : "#DDE2EA" }]} />)}
        </View>
        <PrimaryButton title={last ? "Get Started" : "Next"} color={slide.color} onPress={() => last ? navigation.replace(continueRoute) : setIndex(index + 1)} />
      </ScrollView>
    </Screen>
  );
}

export function LoginScreen({ navigation }: any) {
  const [mobile, setMobile] = useState("");
  const valid = /^[6-9]\d{9}$/.test(mobile);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <Screen padded={false}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <ImageBackground source={{ uri: onboarding[1].image }} style={styles.loginHero}>
          <LinearGradient colors={["rgba(37,99,235,0.72)", "rgba(17,24,39,0.72)"]} style={styles.loginOverlay}>
            <View style={styles.loginLogo}><Ionicons name="cart-outline" size={44} color="white" /></View>
            <Text style={styles.loginTitle}>Smart Cart</Text>
            <Text style={styles.loginSub}>Smart Supermarket Billing System</Text>
          </LinearGradient>
        </ImageBackground>
        <View style={styles.loginBody}>
          <Text style={styles.formTitle}>Welcome Back!</Text>
          <Text style={styles.formSub}>Enter your registered mobile number to continue</Text>
          <Text style={styles.label}>Mobile Number</Text>
          <View style={styles.phone}>
            <Ionicons name="call-outline" size={24} color={colors.muted} />
            <Text style={styles.prefix}>+91</Text>
            <View style={styles.divider} />
            <TextInput keyboardType="number-pad" maxLength={10} value={mobile} onChangeText={setMobile} placeholder="Enter 10-digit number" placeholderTextColor="#9CA3AF" style={styles.phoneText} />
          </View>
          <PrimaryButton title="Send OTP" color={valid ? colors.primary : "#BFDBFE"} onPress={() => valid && navigation.navigate("OTP", { mobile })} />
          <View style={styles.or}><View style={styles.line} /><Text style={styles.orText}>or</Text><View style={styles.line} /></View>
          <Pressable style={styles.admin} onPress={() => Alert.alert("Admin Dashboard", "Open http://localhost:5173")}>
            <Ionicons name="lock-closed-outline" size={24} color="#374151" />
            <Text style={styles.adminText}>Admin / Staff Login</Text>
          </Pressable>
          <Text style={styles.demo}>Demo: any 10-digit number works</Text>
          <Text style={styles.secure}>256-bit SSL encrypted & secure</Text>
        </View>
        </ScrollView>
      </Screen>
    </KeyboardAvoidingView>
  );
}

export function OtpScreen({ route, navigation }: any) {
  const [otp, setOtp] = useState("123456");
  const loginWithMobile = useCustomerStore((state) => state.loginWithMobile);

  async function verifyAndContinue() {
    if (otp.length !== 6) return;
    await loginWithMobile(route.params.mobile);
    navigation.replace("Main");
  }

  return (
    <Screen>
      <Header title="Verify OTP" subtitle={`Sent to +91 ${route.params.mobile}`} />
      <View style={styles.otpCard}>
        <Text style={styles.formTitle}>Enter OTP</Text>
        <Text style={styles.formSub}>Use 123456 for the demo build.</Text>
        <TextInput keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} style={styles.otp} />
      </View>
      <View style={{ flex: 1 }} />
      <PrimaryButton title="Verify & Continue" icon="checkmark" onPress={verifyAndContinue} />
      <View style={{ height: 26 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
  splashLogo: { width: 120, height: 120, borderRadius: 34, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  splashTitle: { marginTop: 26, color: "white", fontSize: 40, fontWeight: "900" },
  splashSub: { marginTop: 12, color: "rgba(255,255,255,0.82)", fontSize: 19, fontWeight: "800" },
  onboarding: { minHeight: "100%", paddingTop: 58, paddingHorizontal: 24, paddingBottom: 30, backgroundColor: "white" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  progressRow: { flexDirection: "row", gap: 10 },
  progress: { height: 12, borderRadius: 99 },
  skip: { backgroundColor: "#F3F4F6", borderRadius: 28, paddingHorizontal: 24, paddingVertical: 14 },
  skipText: { color: "#6B7280", fontSize: 20, fontWeight: "900" },
  hero: { height: 520, borderRadius: 28, overflow: "hidden", marginBottom: 34 },
  heroImage: { width: "100%", height: "100%" },
  heroIcon: { position: "absolute", left: 32, top: 32, width: 96, height: 96, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  count: { position: "absolute", left: 32, bottom: 32, borderRadius: 22, backgroundColor: "white", paddingHorizontal: 20, paddingVertical: 10 },
  countText: { fontSize: 24, fontWeight: "900" },
  tag: { alignSelf: "flex-start", overflow: "hidden", borderRadius: 999, paddingHorizontal: 18, paddingVertical: 8, fontSize: 18, fontWeight: "800" },
  title: { marginTop: 28, color: colors.text, fontSize: 34, fontWeight: "900" },
  body: { marginTop: 22, color: colors.muted, fontSize: 25, lineHeight: 40, fontWeight: "700" },
  featureRow: { flexDirection: "row", gap: 16, marginTop: 34 },
  feature: { flex: 1, minHeight: 120, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#F8FAFC" },
  featureText: { marginTop: 10, textAlign: "center", color: colors.muted, fontSize: 16, fontWeight: "800", lineHeight: 24 },
  dots: { marginVertical: 34, flexDirection: "row", justifyContent: "center", gap: 12 },
  dot: { height: 14, borderRadius: 99 },
  loginHero: { height: 310 },
  loginOverlay: { flex: 1, alignItems: "center", justifyContent: "center" },
  loginLogo: { width: 86, height: 86, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.18)" },
  loginTitle: { marginTop: 16, color: "white", fontSize: 34, fontWeight: "900" },
  loginSub: { marginTop: 8, color: "rgba(255,255,255,0.82)", fontSize: 18, fontWeight: "800" },
  loginBody: { flex: 1, backgroundColor: "white", padding: 30 },
  formTitle: { color: colors.text, fontSize: 30, fontWeight: "900" },
  formSub: { marginTop: 10, color: colors.muted, fontSize: 19, lineHeight: 28, fontWeight: "700" },
  label: { marginTop: 26, marginBottom: 12, color: "#374151", fontSize: 18, fontWeight: "900" },
  phone: { height: 68, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: "#F8FAFC", flexDirection: "row", alignItems: "center", paddingHorizontal: 18 },
  prefix: { marginLeft: 12, fontSize: 20, fontWeight: "800", color: "#374151" },
  divider: { width: 1, height: 32, marginHorizontal: 18, backgroundColor: colors.border },
  phoneText: { flex: 1, fontSize: 20, fontWeight: "800", color: colors.text },
  or: { flexDirection: "row", alignItems: "center", gap: 20, marginVertical: 28 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { color: "#9CA3AF", fontSize: 18, fontWeight: "900" },
  admin: { height: 64, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 14 },
  adminText: { color: "#374151", fontSize: 18, fontWeight: "900" },
  demo: { marginTop: 36, textAlign: "center", color: "#9CA3AF", fontWeight: "800", fontSize: 16 },
  secure: { marginTop: 20, textAlign: "center", color: "#9CA3AF", fontWeight: "800", fontSize: 16 },
  otpCard: { borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: "white", padding: 24, ...shadow },
  otp: { marginTop: 22, height: 74, borderWidth: 1, borderColor: colors.border, borderRadius: 22, textAlign: "center", fontSize: 28, letterSpacing: 8, fontWeight: "900" }
});
