import { AlertTriangle, CheckCircle2, CreditCard, Package, ShieldAlert, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { DetailDrawer, DetailGrid } from "../components/DetailDrawer";
import { Badge, Button, Card } from "../components/ui";
import { activeCarts, alerts, bills, customers, fraudEvents, weeklySales } from "../data/mock";
import { inr } from "../lib/utils";
import type { BillingFilter } from "../App";
import type { PageKey } from "../components/Sidebar";
import type { Product } from "../data/mock";
import type { ReorderRequest } from "../types/reorder";

type DrilldownKey = "sales" | "transactions" | "customers" | "avgCart" | "activeCarts" | "pendingPayments" | "fraud" | null;

const metrics: Array<{
  label: string;
  value: string;
  icon: string;
  badge: string;
  tone: string;
  detail: Exclude<DrilldownKey, null>;
}> = [
  { label: "Today's Sales", value: "₹1,45,230", icon: "💰", badge: "+12% vs YD", tone: "bg-emerald-50 text-success", detail: "sales" },
  { label: "Transactions", value: "287", icon: "📦", badge: "+8 this hour", tone: "bg-blue-50 text-brand", detail: "transactions" },
  { label: "Customers", value: "412", icon: "👥", badge: "Target: 80%", tone: "bg-purple-50 text-purple", detail: "customers" },
  { label: "Avg Cart Value", value: "₹506", icon: "🛒", badge: "↑ ₹23 today", tone: "bg-orange-50 text-warning", detail: "avgCart" }
];

type Props = {
  onNavigate: (page: PageKey, filter?: BillingFilter) => void;
  onReorder: (product: Product) => void;
  reorderRequests: ReorderRequest[];
};

function statusBadge(status: string) {
  if (status === "PAID" || status === "Verified" || status === "RESOLVED") return "bg-emerald-50 text-success";
  if (status === "Mismatch" || status === "BLOCKED" || status === "CRITICAL") return "bg-red-50 text-danger";
  return "bg-yellow-50 text-warning";
}

export function DashboardOverview({ onNavigate, onReorder, reorderRequests }: Props) {
  const [drilldown, setDrilldown] = useState<DrilldownKey>(null);
  const openReorders = reorderRequests.filter((request) => request.status !== "RECEIVED");
  const paidBills = bills.filter((bill) => bill.status === "PAID");
  const pendingBills = bills.filter((bill) => bill.status !== "PAID");
  const billedTotal = useMemo(() => bills.reduce((sum, bill) => sum + bill.total, 0), []);
  const avgBill = billedTotal / bills.length;

  function closeDrilldown() {
    setDrilldown(null);
  }

  function go(page: PageKey, filter: BillingFilter = "all") {
    closeDrilldown();
    onNavigate(page, filter);
  }

  const drilldownTitle =
    drilldown === "sales"
      ? "Today's Sales Details"
      : drilldown === "transactions"
        ? "Transaction Details"
        : drilldown === "customers"
          ? "Customer Details"
          : drilldown === "avgCart"
            ? "Average Cart Value"
            : drilldown === "activeCarts"
              ? "Active Cart Details"
              : drilldown === "pendingPayments"
                ? "Pending Payment Details"
                : drilldown === "fraud"
                  ? "Fraud Detection Details"
                  : "Dashboard Details";

  return (
    <>
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <motion.button
              key={metric.label}
              type="button"
              className="text-left"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setDrilldown(metric.detail)}
            >
              <Card className="min-h-[210px] p-8 transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-soft">
                <div className="mb-14 flex items-start justify-between">
                  <span className="text-3xl">{metric.icon}</span>
                  <Badge className={metric.tone}>{metric.badge}</Badge>
                </div>
                <div className="font-mono text-4xl font-black text-ink">{metric.value}</div>
                <div className="mt-4 text-lg font-extrabold text-gray-500">{metric.label}</div>
              </Card>
            </motion.button>
          ))}
        </div>

        <Card className="p-8">
          <div className="mb-7 flex items-center justify-between">
            <h2 className="text-3xl font-extrabold">Alerts & Notifications</h2>
            <Badge className="bg-danger px-5 py-2 text-base text-white">15 unread</Badge>
          </div>
          <div className="space-y-5">
            {alerts.slice(0, 3).map((alert) => {
              const existingRequest = openReorders.find((request) => request.productId === alert.product.id);
              return (
                <div key={alert.id} className="flex items-center gap-6 rounded-[22px] border border-red-200 bg-red-50 p-5 text-red-800">
                  <img src={alert.product.image} className="h-20 w-20 rounded-2xl object-cover" alt={alert.product.name} />
                  <AlertTriangle size={28} />
                  <div className="min-w-0 flex-1">
                    <button type="button" className="truncate text-left text-xl font-extrabold" onClick={() => go("inventory")}>{alert.text}</button>
                    <div className="mt-2 text-base font-semibold">Minimum: 50 · Supplier: {alert.product.supplier}</div>
                    {existingRequest ? <div className="mt-1 font-mono text-xs font-black text-brand">PO active: {existingRequest.id} · {existingRequest.status}</div> : null}
                  </div>
                  {existingRequest ? (
                    <Button className="bg-brand px-6 py-3 text-white" onClick={() => go("reorders")}>Track PO</Button>
                  ) : (
                    <Button className="bg-danger px-6 py-3 text-white" onClick={() => onReorder(alert.product)}>Reorder</Button>
                  )}
                </div>
              );
            })}
            <button type="button" onClick={() => setDrilldown("fraud")} className="flex w-full items-center gap-5 rounded-[22px] border border-yellow-300 bg-yellow-50 p-5 text-left text-amber-800 transition hover:-translate-y-0.5">
              <AlertTriangle size={28} />
              <div className="flex-1">
                <div className="text-xl font-extrabold">Fraud Flag: Cart #5892 — Weight mismatch 45%</div>
                <div className="mt-1 text-base font-bold">Customer: Raj Kumar · 08:53 AM</div>
              </div>
              <span className="rounded-2xl bg-success px-5 py-3 text-sm font-bold text-white">Allow</span>
              <span className="rounded-2xl bg-danger px-5 py-3 text-sm font-bold text-white">Flag</span>
            </button>
          </div>
        </Card>

        <Card className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold">Weekly Sales (₹)</h2>
            <button type="button" onClick={() => setDrilldown("sales")}>
              <Badge className="bg-blue-50 text-brand">
                <TrendingUp size={16} /> +12% this week
              </Badge>
            </button>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySales}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontWeight: 700, fill: "#6B7280" }} />
                <Tooltip formatter={(value) => inr(Number(value))} cursor={{ fill: "#EFF6FF" }} />
                <Bar dataKey="sales" fill="#2563EB" radius={[10, 10, 0, 0]} barSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-3">
          <button type="button" onClick={() => setDrilldown("activeCarts")} className="text-left">
            <Card className="bg-blue-50 p-8 text-center transition hover:-translate-y-1 hover:border-brand/30">
              <ShoppingCart className="mx-auto mb-2 text-brand" />
              <div className="text-5xl font-black text-brand">12</div>
              <div className="mt-2 font-bold text-gray-500">Active Carts</div>
            </Card>
          </button>
          <button type="button" onClick={() => setDrilldown("pendingPayments")} className="text-left">
            <Card className="bg-yellow-50 p-8 text-center transition hover:-translate-y-1 hover:border-warning/30">
              <Package className="mx-auto mb-2 text-warning" />
              <div className="text-5xl font-black text-warning">2</div>
              <div className="mt-2 font-bold text-gray-500">Pending Payments</div>
            </Card>
          </button>
          <button type="button" onClick={() => setDrilldown("fraud")} className="text-left">
            <Card className="bg-emerald-50 p-8 text-center transition hover:-translate-y-1 hover:border-success/30">
              <Users className="mx-auto mb-2 text-success" />
              <div className="text-5xl font-black text-success">0</div>
              <div className="mt-2 font-bold text-gray-500">Fraud Detections</div>
            </Card>
          </button>
        </div>
      </div>

      <DetailDrawer open={Boolean(drilldown)} onClose={closeDrilldown} title={drilldownTitle} subtitle="Drilldown from Dashboard Overview" wide>
        {drilldown === "sales" ? (
          <div className="space-y-6">
            <DetailGrid rows={[["Dashboard Sales", "₹1,45,230"], ["Seeded Bill Total", inr(billedTotal)], ["Paid Bills", paidBills.length], ["Weekly Total", inr(weeklySales.reduce((sum, day) => sum + day.sales, 0))]]} />
            <RecordSection title="Sales Records" action={<Button className="bg-brand text-white" onClick={() => go("sales")}>View Sales Analytics</Button>}>
              {bills.map((bill) => (
                <RecordRow key={bill.id} title={`${bill.id} · ${bill.customer}`} meta={`${bill.time} · ${bill.method} · ${bill.items} items`} value={inr(bill.total)} badge={bill.status} />
              ))}
            </RecordSection>
          </div>
        ) : null}

        {drilldown === "transactions" ? (
          <RecordSection title="All Transactions" action={<Button className="bg-brand text-white" onClick={() => go("billing", "all")}>Open Billing History</Button>}>
            {bills.map((bill) => (
              <RecordRow key={bill.id} title={bill.id} meta={`${bill.customer} · ${bill.method} · ${bill.reference}`} value={inr(bill.total)} badge={bill.status} />
            ))}
          </RecordSection>
        ) : null}

        {drilldown === "customers" ? (
          <RecordSection title="Customer Records" action={<Button className="bg-brand text-white" onClick={() => go("customers")}>Open Customers</Button>}>
            {customers.map((customer) => (
              <RecordRow key={customer.id} title={`${customer.name} · ${customer.id}`} meta={`${customer.mobile} · ${customer.visits} visits · ${customer.loyalty} pts`} value={inr(customer.spend)} badge={customer.risk === "Normal" ? "Normal" : "Review"} />
            ))}
          </RecordSection>
        ) : null}

        {drilldown === "avgCart" ? (
          <div className="space-y-6">
            <DetailGrid rows={[["Dashboard Avg Cart", "₹506"], ["Current Bill Average", inr(avgBill)], ["Highest Cart", inr(Math.max(...bills.map((bill) => bill.total)))], ["Lowest Cart", inr(Math.min(...bills.map((bill) => bill.total)))]]} />
            <RecordSection title="Cart Value Records" action={<Button className="bg-brand text-white" onClick={() => go("billing", "all")}>View Transactions</Button>}>
              {bills.map((bill) => (
                <RecordRow key={bill.id} title={bill.cartId} meta={`${bill.customer} · ${bill.items} items · ${bill.method}`} value={inr(bill.total)} badge={bill.status} />
              ))}
            </RecordSection>
          </div>
        ) : null}

        {drilldown === "activeCarts" ? (
          <RecordSection title="Active Smart Carts" action={<Button className="bg-brand text-white" onClick={() => go("carts")}>Open Live Carts</Button>}>
            {activeCarts.map((cart) => (
              <RecordRow key={cart.id} title={`${cart.id} · ${cart.customer}`} meta={`${cart.items} items · ${cart.weight} actual · ${cart.location}`} value={inr(cart.total)} badge={cart.status} />
            ))}
          </RecordSection>
        ) : null}

        {drilldown === "pendingPayments" ? (
          <RecordSection title="Pending Payment Queue" action={<Button className="bg-brand text-white" onClick={() => go("counter")}>Open Payment Approvals</Button>}>
            {pendingBills.map((bill) => (
              <RecordRow key={bill.id} title={`${bill.reference} · ${bill.customer}`} meta={`${bill.method} · ${bill.paymentStatus} · ${bill.exitStatus}`} value={inr(bill.total)} badge={bill.status} />
            ))}
            {pendingBills.length === 0 ? <EmptyState title="No pending payments" body="All visible payment records are already approved." /> : null}
          </RecordSection>
        ) : null}

        {drilldown === "fraud" ? (
          <RecordSection title="Fraud Incidents" action={<Button className="bg-brand text-white" onClick={() => go("fraud")}>Open Fraud Detection</Button>}>
            {fraudEvents.map((event) => (
              <RecordRow key={event.id} title={`${event.id} · ${event.type}`} meta={`${event.customer} · ${event.detail}`} value={event.risk} badge={event.status} />
            ))}
          </RecordSection>
        ) : null}
      </DetailDrawer>
    </>
  );
}

function RecordSection({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-[22px] border border-border bg-white">
      <div className="flex flex-col gap-3 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
        <h3 className="text-xl font-extrabold text-ink">{title}</h3>
        {action}
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </div>
  );
}

function RecordRow({ title, meta, value, badge }: { title: string; meta: string; value: string; badge: string }) {
  return (
    <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="truncate text-base font-extrabold text-ink">{title}</div>
        <div className="mt-1 text-sm font-bold text-gray-500">{meta}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-lg font-black text-brand">{value}</span>
        <Badge className={statusBadge(badge)}>
          {badge === "PAID" || badge === "Verified" || badge === "RESOLVED" ? <CheckCircle2 size={14} /> : badge === "Mismatch" || badge === "BLOCKED" ? <ShieldAlert size={14} /> : <CreditCard size={14} />}
          {badge}
        </Badge>
      </div>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-7 text-center">
      <div className="font-extrabold text-ink">{title}</div>
      <div className="mt-2 text-sm font-bold text-gray-500">{body}</div>
    </div>
  );
}
