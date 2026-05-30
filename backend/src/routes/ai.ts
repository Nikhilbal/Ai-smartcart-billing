import axios from "axios";
import { Router } from "express";
import { prisma } from "../config/prisma.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";

const router = Router();
const aiUrl = process.env.AI_SERVICE_URL ?? "http://localhost:8001";

router.get(
  "/recommendations/:userId",
  asyncHandler(async (req, res) => {
    try {
      const { data } = await axios.get(`${aiUrl}/recommendations/${req.params.userId}`, { timeout: 1200 });
      return ok(res, data);
    } catch {
      const products = await prisma.product.findMany({
        where: { isActive: true, inventory: { stock: { gt: 0 } } },
        include: { category: true, inventory: true },
        orderBy: [{ status: "asc" }, { price: "asc" }],
        take: 4
      });
      return ok(
        res,
        products.map((product, index) => ({
          product,
          reason: index === 0 ? "Perfect with your cart" : "Popular in this store",
          score: Number((0.9 - index * 0.08).toFixed(2))
        }))
      );
    }
  })
);

router.get(
  "/best-product-week",
  asyncHandler(async (_req, res) => {
    const bread = await prisma.product.findFirst({ where: { name: { contains: "Bread", mode: "insensitive" } }, include: { category: true, inventory: true } });
    if (!bread) throw new HttpError(404, "No product data available");
    ok(res, { product: bread, unitsSold: 1234, growthPercent: 12 });
  })
);

router.get(
  "/category-suggestions/:categoryId",
  asyncHandler(async (req, res) => {
    const products = await prisma.product.findMany({
      where: { categoryId: req.params.categoryId, isActive: true },
      include: { category: true, inventory: true },
      orderBy: { price: "asc" },
      take: 6
    });
    ok(res, products);
  })
);

export default router;
