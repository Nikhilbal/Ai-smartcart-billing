import { useCallback, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import { activeCarts, bills as fallbackBills, customers, fraudEvents, products, weeklySales } from "../data/mock";
import { api } from "../lib/api";

export type AdminBill = {
  id: string;
  customer: string;
  method: "UPI" | "CARD" | "CASH";
  upiId: string;
  reference: string;
  total: number;
  status: string;
  time: string;
  cartId: string;
  items: number;
  paymentStatus: string;
  exitStatus: string;
  createdAt?: string;
};

export type AdminOverview = {
  todaySales: number;
  totalTransactions: number;
  customers: number;
  averageCartValue: number;
  lowStock: number;
  fraudEvents: number;
  activeCarts: number;
  pendingPayments: number;
  weeklySales: typeof weeklySales;
};

const socketBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/api").replace(/\/api\/?$/, "");

function withCreatedAt(bill: (typeof fallbackBills)[number], index: number): AdminBill {
  return {
    ...bill,
    method: bill.method as AdminBill["method"],
    createdAt: `2026-05-27T${String(12 + index).padStart(2, "0")}:00:00.000Z`
  };
}

function normalizeBill(raw: unknown, index: number): AdminBill {
  const bill = raw as Partial<AdminBill> & {
    billNo?: string;
    user?: { name?: string };
    payment?: { method?: string; reference?: string; status?: string; gatewayResponse?: Record<string, unknown> };
    cart?: { id?: string; items?: unknown[] };
  };

  return {
    id: bill.id ?? bill.billNo ?? `BL-LIVE-${index + 1}`,
    customer: bill.customer ?? bill.user?.name ?? "Smart Cart Customer",
    method: bill.method === "CASH" || bill.method === "CARD" || bill.method === "UPI" ? bill.method : bill.payment?.method === "CASH" || bill.payment?.method === "CARD" ? bill.payment.method : "UPI",
    upiId: bill.upiId ?? (typeof bill.payment?.gatewayResponse?.upiId === "string" ? bill.payment.gatewayResponse.upiId : "-"),
    reference: bill.reference ?? bill.payment?.reference ?? bill.billNo ?? `PAY-${Date.now()}`,
    total: Number(bill.total ?? 0),
    status: bill.status ?? (bill.payment?.status === "PAID" ? "PAID" : "PENDING"),
    time: bill.time ?? new Date(bill.createdAt ?? Date.now()).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    cartId: bill.cartId ?? bill.cart?.id ?? "CART-LIVE",
    items: Number(bill.items ?? bill.cart?.items?.length ?? 1),
    paymentStatus: bill.paymentStatus ?? bill.payment?.status ?? "Success",
    exitStatus: bill.exitStatus ?? (bill.status === "PAID" || bill.payment?.status === "PAID" ? "QR generated" : "QR locked"),
    createdAt: bill.createdAt ?? new Date().toISOString()
  };
}

function fallbackOverview(): AdminOverview {
  const paidBills = fallbackBills.filter((bill) => bill.status === "PAID");
  const todaySales = paidBills.reduce((sum, bill) => sum + bill.total, 0);
  return {
    todaySales,
    totalTransactions: paidBills.length,
    customers: customers.length,
    averageCartValue: paidBills.length ? Math.round(todaySales / paidBills.length) : 0,
    lowStock: products.filter((product) => product.stock < product.min).length,
    fraudEvents: fraudEvents.filter((event) => event.status === "BLOCKED").length,
    activeCarts: activeCarts.length,
    pendingPayments: fallbackBills.filter((bill) => bill.status !== "PAID").length,
    weeklySales
  };
}

export function useOperationalData() {
  const fallback = useMemo(fallbackOverview, []);
  const [overview, setOverview] = useState<AdminOverview>(fallback);
  const [bills, setBills] = useState<AdminBill[]>(() => fallbackBills.map(withCreatedAt));
  const [source, setSource] = useState<"backend" | "demo">("demo");

  const refresh = useCallback(async () => {
    try {
      const [{ data: overviewResponse }, { data: billsResponse }] = await Promise.all([
        api.get("/admin/overview"),
        api.get("/admin/billing-history")
      ]);
      const remoteOverview = overviewResponse.data as Partial<AdminOverview>;
      const remoteBills = Array.isArray(billsResponse.data) ? billsResponse.data.map(normalizeBill) : [];
      setOverview({
        todaySales: Number(remoteOverview.todaySales ?? 0),
        totalTransactions: Number(remoteOverview.totalTransactions ?? 0),
        customers: Number(remoteOverview.customers ?? 0),
        averageCartValue: Number(remoteOverview.averageCartValue ?? 0),
        lowStock: Number(remoteOverview.lowStock ?? 0),
        fraudEvents: Number(remoteOverview.fraudEvents ?? 0),
        activeCarts: Number(remoteOverview.activeCarts ?? 0),
        pendingPayments: Number(remoteOverview.pendingPayments ?? 0),
        weeklySales: remoteOverview.weeklySales ?? weeklySales
      });
      setBills(remoteBills);
      setSource("backend");
    } catch {
      setOverview(fallback);
      setBills(fallbackBills.map(withCreatedAt));
      setSource("demo");
    }
  }, [fallback]);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, 3000);
    const socket = io(socketBaseUrl, { reconnectionAttempts: 3 });
    socket.emit("admin:join");
    socket.on("admin:activity-updated", refresh);
    socket.on("payment:approval-approved", refresh);
    socket.on("counter:cash-verified", refresh);
    socket.on("payment:approved", refresh);
    socket.on("payment:cash-confirmed", refresh);
    return () => {
      window.clearInterval(timer);
      socket.disconnect();
    };
  }, [refresh]);

  return { overview, bills, source, refresh };
}
