import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { listOperationalBills, operationalBillTotals, type OperationalBill } from "../services/activityLedger.js";
import { listCashRequests } from "../services/cashCounterService.js";
import { listPaymentApprovals } from "../services/paymentApprovalService.js";
import { asyncHandler, ok } from "../utils/http.js";

const router = Router();

type DbBill = Awaited<ReturnType<typeof prisma.bill.findMany>>[number] & {
  user?: { name: string } | null;
  payment?: { method: string; reference: string; status: string; gatewayResponse: unknown } | null;
  cart?: { items?: unknown[] } | null;
};

function timeLabel(value: Date | string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function mapDbBill(bill: DbBill): OperationalBill {
  const gatewayResponse = typeof bill.payment?.gatewayResponse === "object" && bill.payment.gatewayResponse !== null && !Array.isArray(bill.payment.gatewayResponse)
    ? bill.payment.gatewayResponse as Record<string, unknown>
    : {};

  return {
    id: bill.billNo,
    customer: bill.user?.name ?? "Smart Cart Customer",
    method: bill.payment?.method === "CASH" ? "CASH" : bill.payment?.method === "CARD" ? "CARD" : "UPI",
    upiId: typeof gatewayResponse.upiId === "string" ? gatewayResponse.upiId : "-",
    reference: bill.payment?.reference ?? bill.billNo,
    total: Number(bill.total),
    status: bill.payment?.status === "PAID" ? "PAID" : "PENDING",
    time: timeLabel(bill.createdAt),
    cartId: bill.cartId,
    items: bill.cart?.items?.length ?? 0,
    paymentStatus: bill.payment?.status ?? "Success",
    exitStatus: bill.payment?.status === "PAID" ? "QR generated" : "QR locked",
    createdAt: bill.createdAt.toISOString()
  };
}

async function loadDbBills() {
  try {
    const dbBills = await prisma.bill.findMany({
      include: { user: true, payment: true, store: true, cart: { include: { items: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return dbBills.map((bill) => mapDbBill(bill));
  } catch {
    return [];
  }
}

router.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    let dbOverview = {
      todaySales: 0,
      totalTransactions: 0,
      customers: 0,
      lowStock: 0,
      fraudEvents: 0,
      activeCarts: 0,
      pendingPayments: 0
    };

    try {
      const [paidPayments, transactionCount, customers, lowStock, fraudEvents, activeCarts, pendingPayments] = await Promise.all([
        prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
        prisma.payment.count({ where: { status: "PAID" } }),
        prisma.user.count(),
        prisma.inventory.count({ where: { stock: { lt: 50 } } }),
        prisma.fraudEvent.count({ where: { status: "ACTIVE" } }),
        prisma.cart.count({ where: { status: "OPEN" } }),
        prisma.cart.count({ where: { paymentStatus: "PENDING" } })
      ]);
      dbOverview = {
        todaySales: paidPayments._sum.amount ?? 0,
        totalTransactions: transactionCount,
        customers,
        lowStock,
        fraudEvents,
        activeCarts,
        pendingPayments
      };
    } catch {
      // The dashboard can still show live approval/counter activity while database setup is pending.
    }

    const operationalTotals = operationalBillTotals();
    const pendingApprovals = listPaymentApprovals().filter((request) => request.status === "PENDING").length;
    const pendingCash = listCashRequests().filter((request) => request.status === "PENDING").length;
    const todaySales = Number((dbOverview.todaySales + operationalTotals.todaySales).toFixed(2));
    const totalTransactions = dbOverview.totalTransactions + operationalTotals.totalTransactions;

    ok(res, {
      todaySales,
      totalTransactions,
      customers: dbOverview.customers,
      averageCartValue: totalTransactions ? Math.round(todaySales / totalTransactions) : 0,
      lowStock: dbOverview.lowStock,
      fraudEvents: dbOverview.fraudEvents,
      activeCarts: dbOverview.activeCarts,
      pendingPayments: dbOverview.pendingPayments + pendingApprovals + pendingCash,
      weeklySales: [
        { day: "Mon", sales: 92000 },
        { day: "Tue", sales: 84000 },
        { day: "Wed", sales: 121000 },
        { day: "Thu", sales: 105000 },
        { day: "Fri", sales: 136000 },
        { day: "Sat", sales: 172000 },
        { day: "Sun", sales: 155000 }
      ]
    });
  })
);

router.get(
  "/billing-history",
  asyncHandler(async (_req, res) => {
    const dbBills = await loadDbBills();
    const operationalBills = listOperationalBills();
    ok(res, [...operationalBills, ...dbBills].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  })
);

router.get(
  "/customers",
  asyncHandler(async (_req, res) => {
    const customers = await prisma.user.findMany({
      include: { bills: true, carts: true },
      orderBy: { createdAt: "desc" }
    });
    ok(res, customers);
  })
);

router.get(
  "/active-carts",
  asyncHandler(async (_req, res) => {
    const carts = await prisma.cart.findMany({
      where: { status: { in: ["OPEN", "CHECKOUT"] } },
      include: { user: true, items: { include: { product: true } } },
      orderBy: { updatedAt: "desc" },
      take: 25
    });
    ok(res, carts);
  })
);

export default router;
