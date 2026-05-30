import { AlertTriangle, Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { alerts, weeklySales } from "../data/mock";
import { inr } from "../lib/utils";
import { Badge, Button, Card } from "../components/ui";
import type { BillingFilter } from "../App";
import type { PageKey } from "../components/Sidebar";
import type { Product } from "../data/mock";
import type { ReorderRequest } from "../types/reorder";

const metrics = [
  { label: "Today's Sales", value: "₹1,45,230", icon: "💰", badge: "+12% vs YD", tone: "bg-emerald-50 text-success", page: "sales" as PageKey },
  { label: "Transactions", value: "287", icon: "📦", badge: "+8 this hour", tone: "bg-blue-50 text-brand", page: "billing" as PageKey, filter: "all" as BillingFilter },
  { label: "Customers", value: "412", icon: "👥", badge: "Target: 80%", tone: "bg-purple-50 text-purple", page: "customers" as PageKey },
  { label: "Avg Cart Value", value: "₹506", icon: "🛒", badge: "↑ ₹23 today", tone: "bg-orange-50 text-warning", page: "carts" as PageKey }
];

type Props = {
  onNavigate: (page: PageKey, filter?: BillingFilter) => void;
  onReorder: (product: Product) => void;
  reorderRequests: ReorderRequest[];
};

export function DashboardOverview({ onNavigate, onReorder, reorderRequests }: Props) {
  const openReorders = reorderRequests.filter((request) => request.status !== "RECEIVED");

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => (
          <motion.button key={metric.label} type="button" className="text-left" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} onClick={() => onNavigate(metric.page, metric.filter)}>
            <Card className="h-full p-6 transition hover:-translate-y-1 hover:border-brand/30 hover:shadow-soft">
              <div className="mb-10 flex items-start justify-between">
                <span className="text-3xl">{metric.icon}</span>
                <Badge className={metric.tone}>{metric.badge}</Badge>
              </div>
              <div className="font-mono text-3xl font-black text-ink">{metric.value}</div>
              <div className="mt-3 text-base font-bold text-gray-500">{metric.label}</div>
            </Card>
          </motion.button>
        ))}
      </div>

      <Card className="p-7">
        <div className="mb-7 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">Alerts & Notifications</h2>
          <Badge className="bg-danger text-white">15 unread</Badge>
        </div>
        <div className="space-y-4">
          {alerts.slice(0, 3).map((alert) => {
            const existingRequest = openReorders.find((request) => request.productId === alert.product.id);
            return (
            <div key={alert.id} className="flex items-center gap-5 rounded-[18px] border border-red-200 bg-red-50 p-4 text-red-800">
              <img src={alert.product.image} className="h-16 w-16 rounded-2xl object-cover" alt={alert.product.name} />
              <AlertTriangle size={22} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-lg font-extrabold">{alert.text}</div>
                <div className="mt-1 text-sm font-semibold">Minimum: 50 · Supplier: {alert.product.supplier}</div>
                {existingRequest ? <div className="mt-1 font-mono text-xs font-black text-brand">PO active: {existingRequest.id} · {existingRequest.status}</div> : null}
              </div>
              {existingRequest ? (
                <Button className="bg-brand text-white" onClick={() => onNavigate("reorders")}>Track PO</Button>
              ) : (
                <Button className="bg-danger text-white" onClick={() => onReorder(alert.product)}>Reorder</Button>
              )}
            </div>
            );
          })}
          <button type="button" onClick={() => onNavigate("fraud")} className="flex w-full items-center gap-5 rounded-[18px] border border-yellow-300 bg-yellow-50 p-5 text-left text-amber-800 transition hover:-translate-y-0.5">
            <AlertTriangle size={24} />
            <div className="flex-1">
              <div className="text-lg font-extrabold">Fraud Flag: Cart #5892 — Weight mismatch 45%</div>
              <div className="mt-1 text-sm font-bold">Customer: Raj Kumar · 08:53 AM</div>
            </div>
            <span className="rounded-2xl bg-success px-4 py-2 text-sm font-bold text-white">Allow</span>
            <span className="rounded-2xl bg-danger px-4 py-2 text-sm font-bold text-white">Flag</span>
          </button>
        </div>
      </Card>

      <Card className="p-7">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold">Weekly Sales (₹)</h2>
          <Badge className="bg-blue-50 text-brand">
            <TrendingUp size={16} /> +12% this week
          </Badge>
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
        <button type="button" onClick={() => onNavigate("carts")} className="text-left">
        <Card className="bg-blue-50 p-7 text-center transition hover:-translate-y-1 hover:border-brand/30">
          <ShoppingCart className="mx-auto mb-2 text-brand" />
          <div className="text-4xl font-black text-brand">12</div>
          <div className="mt-2 font-bold text-gray-500">Active Carts</div>
        </Card>
        </button>
        <button type="button" onClick={() => onNavigate("counter")} className="text-left">
        <Card className="bg-yellow-50 p-7 text-center transition hover:-translate-y-1 hover:border-warning/30">
          <Package className="mx-auto mb-2 text-warning" />
          <div className="text-4xl font-black text-warning">2</div>
          <div className="mt-2 font-bold text-gray-500">Pending Payments</div>
        </Card>
        </button>
        <button type="button" onClick={() => onNavigate("fraud")} className="text-left">
        <Card className="bg-emerald-50 p-7 text-center transition hover:-translate-y-1 hover:border-success/30">
          <Users className="mx-auto mb-2 text-success" />
          <div className="text-4xl font-black text-success">0</div>
          <div className="mt-2 font-bold text-gray-500">Fraud Detections</div>
        </Card>
        </button>
      </div>
    </div>
  );
}
