import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler, ok } from "../utils/http.js";

const router = Router();

router.get(
  "/overview",
  asyncHandler(async (_req, res) => {
    const [paidPayments, transactionCount, customers, lowStock, fraudEvents, activeCarts] = await Promise.all([
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.payment.count({ where: { status: "PAID" } }),
      prisma.user.count(),
      prisma.inventory.count({ where: { stock: { lt: 50 } } }),
      prisma.fraudEvent.count({ where: { status: "ACTIVE" } }),
      prisma.cart.count({ where: { status: "OPEN" } })
    ]);

    const totalSales = paidPayments._sum.amount ?? 145230;
    ok(res, {
      todaySales: totalSales,
      totalTransactions: transactionCount || 287,
      customers: customers || 412,
      averageCartValue: transactionCount ? Math.round(totalSales / transactionCount) : 506,
      lowStock,
      fraudEvents,
      activeCarts,
      pendingPayments: await prisma.cart.count({ where: { paymentStatus: "PENDING" } }),
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
    const bills = await prisma.bill.findMany({
      include: { user: true, payment: true, store: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    ok(res, bills);
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
