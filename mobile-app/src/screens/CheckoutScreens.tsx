import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Card, Header, Money, PrimaryButton, Screen } from "../components/Ui";
import { api } from "../services/api";
import { useCustomerStore } from "../store/customerStore";
import { getCartOffers, getDiscountTotal, getExpectedWeight, getSubtotal, getTax, getTotal, useCartStore } from "../store/cartStore";
import { colors, shadow } from "../theme";

const receiptId = "BL20260527003209";
const cashCounterToken = "CASH5892";
const cashCartId = "CART5911";

type CashCounterRequest = {
  token: string;
  counterName: string;
  counterLocation: string;
  staffName: string;
  queueNo: string;
  status: "PENDING" | "VERIFIED";
  verifiedAt?: string;
  verifiedBy?: string;
};

type PaymentApprovalRequest = {
  token: string;
  cartId: string;
  customerName: string;
  amount: number;
  method: "UPI" | "CARD";
  reference: string;
  upiId?: string;
  counterName: string;
  counterLocation: string;
  staffName: string;
  status: "PENDING" | "APPROVED";
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
};

async function notifyAdminPaymentApproval({
  method,
  reference,
  total,
  customerName,
  upiId
}: {
  method: "UPI" | "CARD";
  reference: string;
  total: number;
  customerName: string;
  upiId?: string;
}) {
  await api.post("/payment/approval/request", {
    token: reference,
    cartId: "CART5911",
    customerName,
    amount: total,
    method,
    reference,
    upiId
  });
}

function IconButton({ name, tone = "#F3F4F6" }: { name: keyof typeof Ionicons.glyphMap; tone?: string }) {
  return <View style={[styles.iconButton, { backgroundColor: tone }]}><Ionicons name={name} size={25} color={colors.text} /></View>;
}

function ResultRow({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <View style={styles.resultRow}><Text style={styles.resultLabel}>{label}</Text><Text style={[styles.resultValue, danger && { color: colors.danger }]}>{value}</Text></View>;
}

function Tips() {
  return (
    <View style={styles.tips}>
      <Text style={styles.tipsTitle}>Tips for accurate reading:</Text>
      {["Make sure all items are scanned", "Do not add items without scanning", "Weight tolerance: ±2%", "Keep cart stable during reading"].map((tip) => <Text key={tip} style={styles.tip}>• {tip}</Text>)}
    </View>
  );
}

export function WeightStartScreen({ navigation }: any) {
  const items = useCartStore((state) => state.items);
  const verifyWeight = useCartStore((state) => state.verifyWeight);
  const expected = getExpectedWeight(items);
  const run = (multiplier: number) => navigation.replace(verifyWeight(Number((expected * multiplier).toFixed(3))) ? "WeightSuccess" : "WeightFailed");

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <Header title="Weight Verification" subtitle="Anti-fraud security check" right={<IconButton name="help-circle-outline" />} />
      <Card style={styles.scaleCard}>
        <Text style={styles.scaleIcon}>⚖️</Text>
        <Text style={styles.scaleTitle}>Place Cart on Scale</Text>
        <Text style={styles.scaleSub}>Put all items on the smart scale, then tap the button below to verify your cart weight.</Text>
      </Card>
      <Tips />
      <View style={{ height: 24 }} />
      <PrimaryButton title="Start Weight Verification" icon="scale-outline" onPress={() => run(1.002)} />
      <Pressable style={{ padding: 16, alignItems: "center" }} onPress={() => run(1.35)}><Text style={{ color: colors.warning, fontWeight: "900" }}>Simulate mismatch</Text></Pressable>
      </ScrollView>
    </Screen>
  );
}

export function WeightSuccessScreen({ navigation }: any) {
  const items = useCartStore((state) => state.items);
  const expected = getExpectedWeight(items);
  const actual = useCartStore((state) => state.lastActualWeight);
  const variance = useCartStore((state) => state.lastVariance);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <Header title="Weight Verified" subtitle="Cart is ready for billing" right={<IconButton name="checkmark-circle-outline" tone="#ECFDF5" />} />
      <Card style={[styles.resultCard, { borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" }]}>
        <Ionicons name="checkmark-circle-outline" size={96} color={colors.success} />
        <Text style={[styles.resultTitle, { color: "#065F46" }]}>Verification Successful</Text>
        <ResultRow label="Expected Weight" value={`${expected.toFixed(2)} kg`} />
        <ResultRow label="Actual Weight" value={`${actual.toFixed(2)} kg`} />
        <ResultRow label="Variance" value={`${variance.toFixed(2)}%`} />
      </Card>
      <View style={{ height: 24 }} />
      <PrimaryButton title="Select Payment" onPress={() => navigation.navigate("PaymentSelection")} />
      <View style={{ height: 26 }} />
      </ScrollView>
    </Screen>
  );
}

export function WeightFailedScreen({ navigation }: any) {
  const items = useCartStore((state) => state.items);
  const expected = getExpectedWeight(items);
  const actual = useCartStore((state) => state.lastActualWeight);
  const variance = useCartStore((state) => state.lastVariance);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <Header title="Weight Verification" subtitle="Anti-fraud security check" right={<IconButton name="help-circle-outline" />} />
      <Card style={styles.resultCard}>
        <Text style={styles.blockTitle}>Verification Results</Text>
        <ResultRow label="Expected Weight" value={`${expected.toFixed(2)} kg`} />
        <ResultRow label="Actual Weight" value={`${actual.toFixed(2)} kg`} />
        <ResultRow label="Variance" value={`${variance.toFixed(2)}% ×`} danger />
        <ResultRow label="Status" value="VERIFICATION FAILED" danger />
        <View style={styles.warningBox}><Ionicons name="warning-outline" size={26} color={colors.warning} /><Text style={styles.warningText}>Please review your items. Extra items may be in cart.</Text></View>
      </Card>
      <Tips />
      <View style={{ height: 24 }} />
      <View style={{ flexDirection: "row", gap: 14 }}>
        <Pressable style={[styles.secondaryButton, { flex: 1 }]} onPress={() => navigation.navigate("Scanner")}><Text style={styles.secondaryButtonText}>Rescan Items</Text></Pressable>
        <Pressable style={[styles.retryButton, { flex: 1 }]} onPress={() => navigation.replace("WeightStart")}><Text style={styles.retryText}>Retry Scale</Text></Pressable>
      </View>
      <View style={{ height: 26 }} />
      </ScrollView>
    </Screen>
  );
}

export function PaymentSelectionScreen({ navigation }: any) {
  const items = useCartStore((state) => state.items);
  const total = getTotal(items);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <Header title="Select Payment" subtitle={`Total: ₹${total.toFixed(2)}`} right={<IconButton name="wallet-outline" />} />
      <LinearGradient colors={[colors.primary, "#2F49D8"]} style={styles.amountCard}>
        <Text style={styles.amountLabel}>Total Amount Due</Text>
        <Text style={styles.amountValue}>₹{total.toFixed(2)}</Text>
        <Text style={styles.amountVerified}>✓ Weight verified · {items.length} items</Text>
      </LinearGradient>
      <Text style={styles.paymentPrompt}>Choose how you want to pay:</Text>
      <PaymentOption icon="phone-portrait-outline" title="UPI Payment" subtitle="Google Pay, PhonePe, BHIM" badge="Fastest" onPress={() => navigation.navigate("UpiPayment")} />
      <PaymentOption icon="card-outline" title="Debit / Credit Card" subtitle="Visa, Mastercard, Rupay" onPress={() => navigation.navigate("CardPayment")} />
      <PaymentOption icon="cash-outline" title="Cash at Counter" subtitle="Pay at the billing counter" onPress={() => navigation.navigate("CashPayment")} />
      </ScrollView>
    </Screen>
  );
}

function PaymentOption({ icon, title, subtitle, badge, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; badge?: string; onPress: () => void }) {
  return (
    <Pressable style={styles.paymentOption} onPress={onPress}>
      <View style={styles.paymentIcon}><Ionicons name={icon} color={colors.primary} size={32} /></View>
      <View style={{ flex: 1 }}><Text style={styles.paymentTitle}>{title}</Text><Text style={styles.paymentSub}>{subtitle}</Text></View>
      {badge ? <Text style={styles.paymentBadge}>{badge}</Text> : <Ionicons name="chevron-forward" size={24} color={colors.muted} />}
    </Pressable>
  );
}

export function UpiPaymentScreen({ navigation }: any) {
  const [upi, setUpi] = useState("raj123@okaxis");
  const [showQr, setShowQr] = useState(false);
  const items = useCartStore((state) => state.items);
  const customer = useCustomerStore((state) => state.customer);
  const total = getTotal(items);
  const pay = useCartStore((state) => state.pay);
  const upiPayload = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent("Smart Supermarket")}&am=${total.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Smart Cart bill ${receiptId}`)}`;

  async function submitUpiPayment() {
    const customerName = customer?.name ?? "Smart Cart Customer";
    pay("UPI", { amount: total, customerName, upiId: upi });
    const payment = useCartStore.getState().payment;
    if (payment) {
      try {
        await notifyAdminPaymentApproval({
          method: "UPI",
          reference: payment.reference,
          total,
          customerName,
          upiId: upi
        });
      } catch {
        // The pending state remains locked; customer can retry status check when backend/admin is online.
      }
    }
    navigation.replace("PaymentSuccess");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
        <Header title="UPI Payment" subtitle={`Pay ₹${total.toFixed(2)}`} right={<IconButton name="phone-portrait-outline" />} />
        <Card style={{ padding: 24 }}>
          <Text style={styles.label}>UPI ID</Text>
          <Pressable style={styles.upiTapCard} onPress={() => setShowQr(true)}>
            <View style={styles.upiTapIcon}><Ionicons name="qr-code-outline" size={28} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.upiTapTitle}>{upi}</Text>
              <Text style={styles.upiTapSub}>Tap UPI ID to show payment QR</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.muted} />
          </Pressable>
          <TextInput value={upi} onChangeText={(value) => { setUpi(value); setShowQr(false); }} style={styles.upiInput} placeholder="UPI ID" />
          <View style={styles.secureRow}><Text style={styles.secureMini}>✓ Instant</Text><Text style={styles.secureMini}>✓ Secure</Text><Text style={styles.secureMini}>✓ Verified Cart</Text></View>
        </Card>
        {showQr ? (
          <Card style={styles.upiQrCard}>
            <QRCode value={upiPayload} size={230} color={colors.text} backgroundColor="white" />
            <Text style={styles.upiQrTitle}>Scan QR with any UPI app</Text>
            <Text style={styles.upiQrSub}>Amount ₹{total.toFixed(2)} · {upi}</Text>
          </Card>
        ) : (
          <Pressable style={styles.showQrButton} onPress={() => setShowQr(true)}>
            <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
            <Text style={styles.showQrText}>Show UPI QR Code</Text>
          </Pressable>
        )}
        <View style={{ height: 24 }} />
        <PrimaryButton title={`I Paid ₹${total.toFixed(2)}`} onPress={submitUpiPayment} icon="checkmark" />
        <View style={{ height: 26 }} />
      </ScrollView>
    </Screen>
  );
}

export function CardPaymentScreen({ navigation }: any) {
  const [card, setCard] = useState("4111 1111 1111 1234");
  const items = useCartStore((state) => state.items);
  const customer = useCustomerStore((state) => state.customer);
  const pay = useCartStore((state) => state.pay);
  const total = getTotal(items);

  async function submitCardPayment() {
    const customerName = customer?.name ?? "Smart Cart Customer";
    pay("CARD", { amount: total, customerName });
    const payment = useCartStore.getState().payment;
    if (payment) {
      try {
        await notifyAdminPaymentApproval({
          method: "CARD",
          reference: payment.reference,
          total,
          customerName
        });
      } catch {
        // The payment stays locked until admin approval can be checked.
      }
    }
    navigation.replace("PaymentSuccess");
  }

  return <PaymentForm title="Card Payment" input={card} setInput={setCard} placeholder="Card number" icon="card-outline" onPay={submitCardPayment} />;
}

export function CashPaymentScreen({ navigation }: any) {
  const pay = useCartStore((state) => state.pay);
  const confirmCashPayment = useCartStore((state) => state.confirmCashPayment);
  const payment = useCartStore((state) => state.payment);
  const items = useCartStore((state) => state.items);
  const customer = useCustomerStore((state) => state.customer);
  const total = getTotal(items);
  const [notified, setNotified] = useState(false);
  const [counterRequest, setCounterRequest] = useState<CashCounterRequest | null>(null);
  const [counterStatus, setCounterStatus] = useState<"PENDING" | "VERIFIED">("PENDING");
  const [counterMessage, setCounterMessage] = useState("Sending cash request to counter worker...");
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const completed = useRef(false);

  useEffect(() => {
    if (payment?.method !== "CASH") {
      pay("CASH");
    }
  }, [pay, payment?.method]);

  function completeCashPayment() {
    if (completed.current) return;
    completed.current = true;
    setCounterStatus("VERIFIED");
    confirmCashPayment();
    navigation.replace("PaymentSuccess");
  }

  async function notifyCounter(showAlert = false) {
    try {
      const { data } = await api.post("/counter/cash/request", {
        token: cashCounterToken,
        cartId: cashCartId,
        customerName: customer?.name ?? "Smart Cart Customer",
        amount: total
      });
      const request = data.data as CashCounterRequest;
      setCounterRequest(request);
      setNotified(true);
      setCounterMessage(`Go to ${request.counterName} (${request.counterLocation}). ${request.staffName} will collect and verify your cash.`);
      if (showAlert) Alert.alert("Counter notified", `${request.counterName} · ${request.staffName}\nToken ${request.token}\nAmount ₹${total.toFixed(2)}`);
    } catch {
      setCounterMessage("Counter queue is offline. Ask staff to open Admin > Cash Counter and refresh after backend starts.");
      if (showAlert) Alert.alert("Counter queue offline", "Backend is not reachable yet, so live approval cannot sync to this phone.");
    }
  }

  async function checkCounterStatus(showAlert = false) {
    try {
      const { data } = await api.get(`/counter/cash/${cashCounterToken}`);
      const request = data.data as CashCounterRequest;
      const checkedAt = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setCounterRequest(request);
      setNotified(true);
      setCounterStatus(request.status);
      setLastCheckedAt(checkedAt);
      if (request.status === "VERIFIED") {
        setCounterMessage(`Cash verified by ${request.verifiedBy ?? request.staffName}. Receipt and exit QR are ready.`);
        if (showAlert) {
          Alert.alert(
            "Cash verified",
            `Status: VERIFIED\nVerified by: ${request.verifiedBy ?? request.staffName}\nCounter: ${request.counterName}\nQueue: ${request.queueNo}\nExit QR: ENABLED`,
            [{ text: "Continue", onPress: completeCashPayment }]
          );
        } else {
          completeCashPayment();
        }
        return;
      }
      setCounterMessage(`${request.staffName} at ${request.counterName} has not verified cash yet.`);
      if (showAlert) {
        Alert.alert(
          "Cash verification pending",
          `Status: PENDING\nToken: ${request.token}\nCounter: ${request.counterName} · ${request.queueNo}\nStaff: ${request.staffName}\nAmount: ₹${total.toFixed(2)}\nExit QR: LOCKED\nLast checked: ${checkedAt}`
        );
      }
    } catch {
      const checkedAt = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setLastCheckedAt(checkedAt);
      setCounterMessage("Waiting for counter system. Keep this screen open after paying cash.");
      if (showAlert) Alert.alert("Verification status unavailable", `Status: NOT FOUND / OFFLINE\nToken: ${cashCounterToken}\nExit QR: LOCKED\nLast checked: ${checkedAt}`);
    }
  }

  useEffect(() => {
    notifyCounter();
    const timer = setInterval(() => checkCounterStatus(), 2500);
    return () => clearInterval(timer);
  }, [total]);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 34 }} showsVerticalScrollIndicator={false}>
        <Header title="Cash at Counter" subtitle="Worker verification required" right={<IconButton name="cash-outline" />} />
        <Card style={{ padding: 24, alignItems: "center" }}>
          <Ionicons name="receipt-outline" size={86} color={colors.warning} />
          <Text style={styles.resultTitle}>Counter Payment Token</Text>
          <Text style={styles.formSub}>Pay cash at the counter. Only a worker can approve this token before receipt and exit QR are generated.</Text>
          <Text style={styles.cashToken}>{cashCounterToken}</Text>
          <View style={styles.cashStatusBox}>
            <ResultRow label="Amount Due" value={`₹${total.toFixed(2)}`} />
            <ResultRow label="Assigned Counter" value={counterRequest ? `${counterRequest.counterName} · ${counterRequest.queueNo}` : "ASSIGNING"} />
            <ResultRow label="Counter Staff" value={counterRequest?.staffName ?? "WAITING"} />
            <ResultRow label="Worker Status" value={counterStatus === "VERIFIED" ? "CASH VERIFIED" : notified ? "WAITING FOR WORKER" : "NOTIFYING COUNTER"} />
            <ResultRow label="Last Checked" value={lastCheckedAt || "AUTO CHECKING"} />
            <ResultRow label="Exit QR" value={counterStatus === "VERIFIED" ? "ENABLED" : "LOCKED"} />
          </View>
          <View style={styles.cashAlertBox}>
            <Ionicons name={counterStatus === "VERIFIED" ? "checkmark-circle-outline" : "time-outline"} size={24} color={counterStatus === "VERIFIED" ? colors.success : colors.warning} />
            <Text style={styles.cashAlertText}>{counterMessage}</Text>
          </View>
        </Card>
        <View style={{ height: 24 }} />
        <PrimaryButton title={notified ? "Notify Counter Again" : "Notify Cash Counter"} color={colors.warning} icon="notifications-outline" onPress={() => notifyCounter(true)} />
        <Pressable style={{ padding: 16, alignItems: "center" }} onPress={() => checkCounterStatus(true)}>
          <Text style={{ color: colors.warning, fontWeight: "900" }}>Check worker verification status</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function PaymentForm({ title, input, setInput, placeholder, icon, onPay }: { title: string; input: string; setInput: (value: string) => void; placeholder: string; icon: keyof typeof Ionicons.glyphMap; onPay: () => void }) {
  const items = useCartStore((state) => state.items);
  const total = getTotal(items);
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <Header title={title} subtitle={`Pay ₹${total.toFixed(2)}`} right={<IconButton name={icon} />} />
      <Card style={{ padding: 24 }}>
        <Text style={styles.label}>{placeholder}</Text>
        <TextInput value={input} onChangeText={setInput} style={styles.upiInput} placeholder={placeholder} />
        <View style={styles.secureRow}><Text style={styles.secureMini}>✓ Instant</Text><Text style={styles.secureMini}>✓ Secure</Text><Text style={styles.secureMini}>✓ Verified Cart</Text></View>
      </Card>
      <View style={{ height: 24 }} />
      <PrimaryButton title={`Pay ₹${total.toFixed(2)}`} onPress={onPay} icon="arrow-forward" />
      <View style={{ height: 26 }} />
      </ScrollView>
    </Screen>
  );
}

export function PaymentSuccessScreen({ navigation }: any) {
  const items = useCartStore((state) => state.items);
  const payment = useCartStore((state) => state.payment);
  const customer = useCustomerStore((state) => state.customer);
  const approvePayment = useCartStore((state) => state.approvePayment);
  const total = getTotal(items);
  const [approvalRequest, setApprovalRequest] = useState<PaymentApprovalRequest | null>(null);
  const [approvalMessage, setApprovalMessage] = useState("Waiting for admin to confirm this payment in the approval queue.");
  const [lastCheckedAt, setLastCheckedAt] = useState("");
  const needsAdminApproval = payment?.status === "PENDING_ADMIN";

  async function resendAdminApprovalRequest() {
    if (!payment?.reference || payment.method === "CASH") return null;
    const { data } = await api.post("/payment/approval/request", {
      token: payment.reference,
      cartId: "CART5911",
      customerName: payment.customerName ?? customer?.name ?? "Smart Cart Customer",
      amount: payment.amount ?? total,
      method: payment.method,
      reference: payment.reference,
      upiId: payment.upiId
    });
    const request = data.data as PaymentApprovalRequest;
    setApprovalRequest(request);
    setApprovalMessage(`Approval request sent to ${request.counterName}. ${request.staffName} must approve it in Admin > Payment Approvals.`);
    return request;
  }

  async function checkAdminApproval(showAlert = false) {
    if (!payment?.reference || !needsAdminApproval) return;
    const checkedAt = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLastCheckedAt(checkedAt);
    try {
      const { data } = await api.get(`/payment/approval/${payment.reference}`);
      const request = data.data as PaymentApprovalRequest;
      setApprovalRequest(request);

      if (request.status === "APPROVED") {
        approvePayment();
        setApprovalMessage(`Approved by ${request.approvedBy ?? request.staffName}. Receipt and exit QR are unlocked.`);
        if (showAlert) Alert.alert("Payment approved", `Approved by: ${request.approvedBy ?? request.staffName}\nExit QR: ENABLED`);
        return;
      }

      setApprovalMessage(`${request.staffName} has not approved ${request.method} payment yet.`);
      if (showAlert) {
        Alert.alert(
          "Payment approval pending",
          `Status: PENDING\nReference: ${request.reference}\nDesk: ${request.counterName}\nStaff: ${request.staffName}\nAmount: ₹${total.toFixed(2)}\nExit QR: LOCKED\nLast checked: ${checkedAt}`
        );
      }
    } catch {
      try {
        const request = await resendAdminApprovalRequest();
        if (showAlert && request) {
          Alert.alert(
            "Approval request sent",
            `Reference: ${request.reference}\nDesk: ${request.counterName}\nStaff: ${request.staffName}\nAmount: ₹${(payment.amount ?? total).toFixed(2)}\nExit QR: LOCKED until admin approves.`
          );
        }
      } catch {
        setApprovalMessage("Admin approval queue is offline. Start the backend, then tap this button again to send the request to Admin > Payment Approvals.");
        if (showAlert) Alert.alert("Approval status unavailable", `Status: NOT FOUND / OFFLINE\nReference: ${payment.reference}\nExit QR: LOCKED\nLast checked: ${checkedAt}`);
      }
    }
  }

  useEffect(() => {
    if (!needsAdminApproval) return;
    checkAdminApproval();
    const timer = setInterval(() => checkAdminApproval(), 2500);
    return () => clearInterval(timer);
  }, [needsAdminApproval, payment?.reference]);

  if (needsAdminApproval) {
    return (
      <Screen>
        <Header title="Payment Approval" subtitle={`Total: ₹${total.toFixed(2)}`} right={<IconButton name="shield-checkmark-outline" />} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.successCenter}>
            <Ionicons name="time-outline" size={126} color={colors.warning} />
            <Text style={[styles.successTitle, { color: "#92400E" }]}>Waiting for Admin Approval</Text>
            <Text style={styles.formSub}>Your exit QR will be generated only after staff confirms this payment.</Text>
          </View>
          <Card style={[styles.paymentResult, { backgroundColor: "#FFFBEB", borderColor: "#FCD34D" }]}>
            <ResultRow label="Amount" value={`₹${total.toFixed(2)}`} />
            <ResultRow label="Method" value={payment?.method ?? "UPI"} />
            <ResultRow label="Reference" value={payment?.reference ?? "PENDING"} />
            <ResultRow label="Approval Desk" value={approvalRequest ? `${approvalRequest.counterName}` : "ADMIN QUEUE"} />
            <ResultRow label="Admin Status" value="WAITING" />
            <ResultRow label="Last Checked" value={lastCheckedAt || "AUTO CHECKING"} />
            <ResultRow label="Exit QR" value="LOCKED" />
          </Card>
          <View style={styles.cashAlertBox}>
            <Ionicons name="lock-closed-outline" size={24} color={colors.warning} />
            <Text style={styles.cashAlertText}>{approvalMessage}</Text>
          </View>
          <Card style={styles.qrPreview}>
            <Text style={styles.paymentTitle}>Exit QR Locked</Text>
            <View style={styles.qrPlaceholder}><Ionicons name="lock-closed-outline" size={42} color="#9CA3AF" /></View>
            <Text style={styles.formSub}>Admin approval is required before receipt and exit QR are created.</Text>
          </Card>
        </ScrollView>
        <View style={styles.stickyFooter}><PrimaryButton title="Check admin approval status" color={colors.warning} icon="refresh-outline" onPress={() => checkAdminApproval(true)} /></View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Payment Successful!" subtitle={`Total: ₹${total.toFixed(2)}`} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.successCenter}><Ionicons name="checkmark-circle-outline" size={138} color={colors.success} /><Text style={styles.successTitle}>Payment Received!</Text><Text style={styles.formSub}>Your bill has been successfully created.</Text></View>
        <Card style={[styles.paymentResult, { backgroundColor: "#ECFDF5", borderColor: "#A7F3D0" }]}>
          <ResultRow label="Amount Paid" value={`₹${total.toFixed(2)}`} />
          <ResultRow label="Method" value={payment?.method ?? "UPI"} />
          <ResultRow label="Reference" value={payment?.reference ?? "UPI2026052587477"} />
          <ResultRow label="Status" value="ADMIN CONFIRMED" />
        </Card>
        <Card style={styles.qrPreview}><Text style={styles.paymentTitle}>Scan QR to Exit Store</Text><View style={styles.qrPlaceholder}><Text style={{ color: "#9CA3AF", fontWeight: "800", textAlign: "center" }}>QR Code{"\n"}{receiptId}</Text></View></Card>
      </ScrollView>
      <View style={styles.stickyFooter}><PrimaryButton title="View Receipt" onPress={() => navigation.navigate("Receipt")} /></View>
    </Screen>
  );
}

export function ReceiptScreen({ navigation }: any) {
  const items = useCartStore((state) => state.items);
  const payment = useCartStore((state) => state.payment);
  const customer = useCustomerStore((state) => state.customer);
  const expected = getExpectedWeight(items);
  const actual = useCartStore((state) => state.lastActualWeight) || expected;
  const offers = getCartOffers(items);
  const discount = getDiscountTotal(items);
  const total = getTotal(items);
  const paymentApproved = payment?.status === "CONFIRMED";

  function openExitQr() {
    if (!paymentApproved) {
      Alert.alert("Exit QR locked", "Admin payment approval is required before exit QR can be generated.");
      navigation.navigate("PaymentSuccess");
      return;
    }
    navigation.navigate("ExitQR");
  }

  return (
    <Screen padded={false}>
      <View style={{ paddingHorizontal: 22 }}><Header title="Bill Receipt" right={<Text style={paymentApproved ? styles.paidPill : styles.lockedPill}>{paymentApproved ? "✓ PAID" : "LOCKED"}</Text>} /></View>
      <ScrollView contentContainerStyle={{ paddingBottom: 190 }} showsVerticalScrollIndicator={false}>
        <View style={styles.receipt}>
          <LinearGradient colors={[colors.primary, "#2F49D8"]} style={styles.receiptHead}>
            <Text style={{ fontSize: 38 }}>🛒</Text>
            <Text style={styles.receiptStore}>SMART SUPERMARKET</Text>
            <Text style={styles.receiptArea}>Mumbai - Vile Parle</Text>
            <View style={styles.receiptInfo}><View><Text style={styles.receiptLabel}>Bill ID</Text><Text style={styles.receiptValue}>{receiptId}</Text></View><View><Text style={styles.receiptLabel}>Date & Time</Text><Text style={styles.receiptValue}>27-05-2026 · 06:17 pm</Text></View></View>
          </LinearGradient>
          <View style={styles.receiptBody}>
            <ResultRow label="Customer" value={`${customer?.name ?? "Smart Cart Customer"} (${customer?.id ?? "CUST0000"})`} />
            <Text style={styles.receiptSection}>ITEMS PURCHASED</Text>
            {items.map((item, index) => <View key={item.product.id} style={styles.receiptItem}><Text style={styles.receiptIndex}>{index + 1}.</Text><Image source={{ uri: item.product.image }} style={styles.receiptImage} /><View style={{ flex: 1 }}><Text style={styles.itemName}>{item.product.name}</Text><Text style={styles.formSub}>×{item.quantity}</Text></View><Money value={item.product.price * item.quantity} color={colors.text} /></View>)}
            <Text style={styles.receiptSection}>BILLING SUMMARY</Text>
            <ResultRow label="Subtotal" value={`₹${getSubtotal(items).toFixed(2)}`} />
            {offers.map((offer) => (
              <ResultRow key={offer.id} label={offer.title} value={`-₹${offer.discount.toFixed(2)}`} />
            ))}
            <ResultRow label="Tax (GST 5%)" value={`+₹${getTax(items).toFixed(2)}`} />
            <ResultRow label="Discount" value={`-₹${discount.toFixed(2)}`} />
            <ResultRow label="Total Paid" value={`₹${total.toFixed(2)}`} />
            <Text style={styles.receiptSection}>PAYMENT</Text>
            <ResultRow label="Method" value={payment?.method ?? "UPI"} />
            <ResultRow label="Reference" value={payment?.reference ?? "UPI202605275257225"} />
            <ResultRow label="Status" value={paymentApproved ? "PAID SUCCESSFULLY" : "WAITING ADMIN APPROVAL"} />
            <Text style={styles.receiptSection}>WEIGHT VERIFICATION</Text>
            <ResultRow label="Expected" value={`${expected.toFixed(2)} kg`} />
            <ResultRow label="Actual" value={`${actual.toFixed(2)} kg`} />
            <ResultRow label="Variance" value="0.20%" />
            <ResultRow label="Status" value="VERIFIED" />
            <Text style={styles.receiptSection}>LOYALTY POINTS</Text>
            <ResultRow label="Points Earned" value="+9 pts" />
            <ResultRow label="Total Balance" value="249 pts" />
            <Text style={styles.thankYou}>Thank you for shopping at Smart Supermarket!</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.receiptFooter}>
        <View style={styles.receiptActions}>{[["mail-outline", "Email", colors.primary], ["print-outline", "Print", colors.text], ["share-social-outline", "Share", colors.purple]].map(([icon, label, color]) => <Pressable key={label} style={styles.receiptAction}><Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={30} color={color as string} /><Text style={[styles.receiptActionText, { color: color as string }]}>{label}</Text></Pressable>)}</View>
        <PrimaryButton title={paymentApproved ? "Exit Store" : "Exit QR Locked"} color={paymentApproved ? colors.success : colors.muted} icon={paymentApproved ? "exit-outline" : "lock-closed-outline"} onPress={openExitQr} />
      </View>
    </Screen>
  );
}

export function ExitQRScreen({ navigation }: any) {
  const clear = useCartStore((state) => state.clear);
  const payment = useCartStore((state) => state.payment);
  const payload = JSON.stringify({ billNo: receiptId, status: "PAID", weight: "VERIFIED", token: "EXIT-5892" });

  if (payment?.status !== "CONFIRMED") {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
          <Header title="Exit QR Locked" subtitle="Admin payment approval required" right={<IconButton name="lock-closed-outline" />} />
          <Card style={styles.exitCard}>
            <Ionicons name="lock-closed-outline" size={96} color={colors.warning} />
            <Text style={styles.resultTitle}>Approval Pending</Text>
            <Text style={styles.formSub}>The exit QR will be generated after admin approves the payment.</Text>
          </Card>
          <View style={{ height: 24 }} />
          <PrimaryButton title="Check Payment Approval" color={colors.warning} icon="refresh-outline" onPress={() => navigation.replace("PaymentSuccess")} />
          <View style={{ height: 26 }} />
        </ScrollView>
      </Screen>
    );
  }

  function finishExit() {
    clear();
    Alert.alert("Exit Verified", "Thank you for shopping at Smart Supermarket.");
    navigation.reset({ index: 0, routes: [{ name: "Splash" }] });
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.screenScroll} showsVerticalScrollIndicator={false}>
      <Header title="Exit QR" subtitle="Show this at the store gate" right={<IconButton name="qr-code-outline" />} />
      <Card style={styles.exitCard}>
        <QRCode value={payload} size={230} color={colors.text} backgroundColor="white" />
        <Text style={styles.exitToken}>EXIT-5892</Text>
        <Text style={styles.exitStatus}>Payment paid · Weight verified · Ready to exit</Text>
      </Card>
      <View style={{ height: 24 }} />
      <PrimaryButton title="Done" color={colors.success} icon="checkmark" onPress={finishExit} />
      <View style={{ height: 26 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenScroll: { flexGrow: 1, paddingBottom: 34 },
  iconButton: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  scaleCard: { padding: 34, minHeight: 340, alignItems: "center", justifyContent: "center", backgroundColor: "#EFF6FF", borderColor: "#BFDBFE" },
  scaleIcon: { fontSize: 74 },
  scaleTitle: { marginTop: 26, color: "#1E40AF", fontSize: 28, fontWeight: "900" },
  scaleSub: { marginTop: 14, color: "#3B82F6", textAlign: "center", fontSize: 20, lineHeight: 30, fontWeight: "800" },
  tips: { marginTop: 24, borderWidth: 1, borderColor: "#FCD34D", backgroundColor: "#FFFBEB", borderRadius: 22, padding: 22 },
  tipsTitle: { color: "#92400E", fontSize: 19, fontWeight: "900", marginBottom: 12 },
  tip: { color: "#A16207", fontSize: 17, lineHeight: 30, fontWeight: "800" },
  resultCard: { padding: 24, alignItems: "center" },
  resultTitle: { marginVertical: 16, color: colors.text, textAlign: "center", fontSize: 28, fontWeight: "900" },
  resultRow: { width: "100%", borderBottomWidth: 1, borderBottomColor: "#EEF2F7", paddingVertical: 14, flexDirection: "row", justifyContent: "space-between", gap: 16 },
  resultLabel: { color: colors.muted, fontSize: 18, fontWeight: "800" },
  resultValue: { color: "#374151", fontSize: 18, fontFamily: "Courier", fontWeight: "900" },
  blockTitle: { alignSelf: "flex-start", marginBottom: 16, color: "#374151", fontSize: 25, fontWeight: "900" },
  warningBox: { marginTop: 22, borderLeftWidth: 4, borderLeftColor: colors.warning, borderRadius: 18, backgroundColor: "#FEF3C7", padding: 18, flexDirection: "row", gap: 12 },
  warningText: { flex: 1, color: "#92400E", fontSize: 17, fontWeight: "800", lineHeight: 26 },
  secondaryButton: { minHeight: 58, borderRadius: 22, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: "white" },
  secondaryButtonText: { color: "#374151", fontSize: 18, fontWeight: "900" },
  retryButton: { minHeight: 58, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: colors.warning },
  retryText: { color: "white", fontSize: 18, fontWeight: "900" },
  amountCard: { borderRadius: 26, padding: 28, marginBottom: 26 },
  amountLabel: { color: "rgba(255,255,255,0.75)", fontSize: 18, fontWeight: "800" },
  amountValue: { marginTop: 22, color: "white", fontSize: 54, fontFamily: "Courier", fontWeight: "900" },
  amountVerified: { marginTop: 22, color: "#BBF7D0", fontSize: 18, fontWeight: "900" },
  paymentPrompt: { color: "#374151", fontSize: 21, fontWeight: "800", marginBottom: 18 },
  paymentOption: { marginBottom: 18, borderRadius: 24, backgroundColor: "white", padding: 20, flexDirection: "row", alignItems: "center", gap: 18, ...shadow },
  paymentIcon: { width: 74, height: 74, borderRadius: 24, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" },
  paymentTitle: { color: colors.text, fontSize: 21, fontWeight: "900" },
  paymentSub: { marginTop: 6, color: colors.muted, fontSize: 16, fontWeight: "800" },
  paymentBadge: { overflow: "hidden", borderRadius: 999, backgroundColor: colors.success, color: "white", paddingHorizontal: 14, paddingVertical: 8, fontWeight: "900" },
  label: { marginTop: 10, marginBottom: 12, color: "#374151", fontSize: 18, fontWeight: "900" },
  upiTapCard: { minHeight: 74, borderWidth: 1, borderColor: "#BFDBFE", borderRadius: 22, backgroundColor: "#EFF6FF", padding: 14, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  upiTapIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "white", alignItems: "center", justifyContent: "center" },
  upiTapTitle: { color: colors.text, fontSize: 19, fontFamily: "Courier", fontWeight: "900" },
  upiTapSub: { marginTop: 4, color: colors.primary, fontSize: 14, fontWeight: "800" },
  upiInput: { height: 64, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 18, fontSize: 20, fontWeight: "900", color: colors.text },
  upiQrCard: { marginTop: 20, padding: 26, alignItems: "center" },
  upiQrTitle: { marginTop: 18, color: colors.text, fontSize: 21, fontWeight: "900" },
  upiQrSub: { marginTop: 8, color: colors.muted, fontSize: 16, fontWeight: "800" },
  showQrButton: { marginTop: 18, minHeight: 62, borderRadius: 20, borderWidth: 1, borderColor: "#BFDBFE", backgroundColor: "#EFF6FF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  showQrText: { color: colors.primary, fontSize: 17, fontWeight: "900" },
  secureRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 20 },
  secureMini: { color: colors.success, fontSize: 16, fontWeight: "900" },
  formSub: { marginTop: 8, color: colors.muted, fontSize: 16, lineHeight: 24, fontWeight: "700" },
  cashToken: { marginTop: 26, padding: 18, borderRadius: 18, overflow: "hidden", backgroundColor: "#ECFDF5", color: colors.success, fontSize: 26, fontFamily: "Courier", fontWeight: "900" },
  cashStatusBox: { marginTop: 20, width: "100%", borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: "#FFFBEB", paddingHorizontal: 14 },
  cashAlertBox: { marginTop: 18, width: "100%", borderRadius: 18, borderWidth: 1, borderColor: "#FCD34D", backgroundColor: "#FFFBEB", padding: 16, flexDirection: "row", gap: 10 },
  cashAlertText: { flex: 1, color: "#92400E", fontSize: 15, lineHeight: 22, fontWeight: "800" },
  successCenter: { alignItems: "center", marginVertical: 40 },
  successTitle: { color: "#166534", fontSize: 30, fontWeight: "900" },
  paymentResult: { padding: 22, marginBottom: 22 },
  qrPreview: { padding: 26, alignItems: "center", marginBottom: 120 },
  qrPlaceholder: { marginTop: 18, width: 150, height: 150, borderRadius: 28, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  stickyFooter: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 22, backgroundColor: "rgba(248,250,252,0.96)" },
  paidPill: { overflow: "hidden", borderRadius: 999, backgroundColor: "#ECFDF5", color: "#047857", paddingHorizontal: 18, paddingVertical: 10, fontSize: 16, fontWeight: "900" },
  lockedPill: { overflow: "hidden", borderRadius: 999, backgroundColor: "#FFFBEB", color: "#92400E", paddingHorizontal: 18, paddingVertical: 10, fontSize: 16, fontWeight: "900" },
  receipt: { marginHorizontal: 22, borderRadius: 28, overflow: "hidden", backgroundColor: "white", ...shadow },
  receiptHead: { padding: 32, alignItems: "center" },
  receiptStore: { marginTop: 12, color: "white", fontSize: 24, fontWeight: "900" },
  receiptArea: { marginTop: 8, color: "#C7D2FE", fontSize: 18, fontWeight: "800" },
  receiptInfo: { marginTop: 28, paddingTop: 22, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.25)", width: "100%", flexDirection: "row", justifyContent: "space-between" },
  receiptLabel: { color: "#C7D2FE", textAlign: "center", fontSize: 14, fontWeight: "900" },
  receiptValue: { marginTop: 8, color: "white", fontFamily: "Courier", fontSize: 16, fontWeight: "900" },
  receiptBody: { padding: 22 },
  receiptSection: { marginTop: 24, marginBottom: 12, color: "#9CA3AF", fontSize: 18, letterSpacing: 2, fontWeight: "900" },
  receiptItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  receiptIndex: { color: "#9CA3AF", fontSize: 18, fontWeight: "900" },
  receiptImage: { width: 58, height: 58, borderRadius: 16 },
  itemName: { color: colors.text, fontSize: 18, fontWeight: "900" },
  thankYou: { marginVertical: 28, color: colors.muted, textAlign: "center", fontSize: 18, fontWeight: "800" },
  receiptFooter: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 22, backgroundColor: "rgba(248,250,252,0.98)" },
  receiptActions: { flexDirection: "row", gap: 12, marginBottom: 16 },
  receiptAction: { flex: 1, height: 96, borderRadius: 22, backgroundColor: "white", alignItems: "center", justifyContent: "center", ...shadow },
  receiptActionText: { marginTop: 8, fontSize: 17, fontWeight: "900" },
  exitCard: { padding: 34, alignItems: "center" },
  exitToken: { marginTop: 24, color: colors.text, fontSize: 26, fontFamily: "Courier", fontWeight: "900" },
  exitStatus: { marginTop: 12, color: colors.success, textAlign: "center", fontSize: 18, fontWeight: "900" }
});
