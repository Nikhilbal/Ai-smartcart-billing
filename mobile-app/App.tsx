import "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { RootStackParamList, TabParamList } from "./src/navigation/types";
import { SplashScreen, OnboardingScreen, LoginScreen, OtpScreen } from "./src/screens/AuthScreens";
import { BrowseScreen, CartScreen, CartTabScreen, HomeScreen, OrderHistoryScreen, ProductDetailsScreen, ProfileScreen, ScannerScreen } from "./src/screens/ShopScreens";
import { CardPaymentScreen, CashPaymentScreen, ExitQRScreen, PaymentSelectionScreen, PaymentSuccessScreen, ReceiptScreen, UpiPaymentScreen, WeightFailedScreen, WeightStartScreen, WeightSuccessScreen } from "./src/screens/CheckoutScreens";
import { useCartStore } from "./src/store/cartStore";
import { colors } from "./src/theme";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function Tabs() {
  const itemCount = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { height: 96, borderTopWidth: 0, backgroundColor: "white", paddingTop: 12, paddingBottom: 18 },
        tabBarLabelStyle: { fontSize: 13, fontWeight: "900" },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ focused, color }) => {
          const icons = { Home: "scan", Browse: "search", CartTab: "cart-outline", Profile: "person-outline" } as const;
          return <Ionicons name={icons[route.name]} size={focused ? 30 : 27} color={focused ? "white" : color} style={{ backgroundColor: focused ? colors.primary : "#F3F4F6", padding: 14, borderRadius: 26, overflow: "hidden" }} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Scan" }} />
      <Tab.Screen name="Browse" component={BrowseScreen} />
      <Tab.Screen
        name="CartTab"
        component={CartTabScreen}
        options={{
          title: "Cart",
          tabBarBadge: itemCount > 0 ? itemCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger, color: "white", fontWeight: "900" }
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="OTP" component={OtpScreen} />
        <Stack.Screen name="Main" component={Tabs} />
        <Stack.Screen name="Scanner" component={ScannerScreen} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
        <Stack.Screen name="Cart" component={CartScreen} />
        <Stack.Screen name="WeightStart" component={WeightStartScreen} />
        <Stack.Screen name="WeightSuccess" component={WeightSuccessScreen} />
        <Stack.Screen name="WeightFailed" component={WeightFailedScreen} />
        <Stack.Screen name="PaymentSelection" component={PaymentSelectionScreen} />
        <Stack.Screen name="UpiPayment" component={UpiPaymentScreen} />
        <Stack.Screen name="CardPayment" component={CardPaymentScreen} />
        <Stack.Screen name="CashPayment" component={CashPaymentScreen} />
        <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
        <Stack.Screen name="Receipt" component={ReceiptScreen} />
        <Stack.Screen name="ExitQR" component={ExitQRScreen} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
