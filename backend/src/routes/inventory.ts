import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { getInventoryStatus } from "../services/cartService.js";
import { emitAdmin } from "../services/realtime.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const inventory = await prisma.inventory.findMany({
      include: { product: { include: { category: true } } },
      orderBy: { product: { name: "asc" } }
    });
    ok(res, inventory);
  })
);

router.get(
  "/low-stock",
  asyncHandler(async (_req, res) => {
    const inventory = await prisma.inventory.findMany({
      where: { stock: { lt: 50 } },
      include: { product: { include: { category: true } } },
      orderBy: { stock: "asc" }
    });
    ok(res, inventory);
  })
);

router.put(
  "/:productId",
  asyncHandler(async (req, res) => {
    const body = z.object({ stock: z.number().int().nonnegative(), minStock: z.number().int().positive().default(50) }).parse(req.body);
    const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
    if (!product) throw new HttpError(404, "Product not found");
    const status = getInventoryStatus(body.stock, body.minStock);
    const inventory = await prisma.inventory.upsert({
      where: { productId: product.id },
      update: { stock: body.stock, minStock: body.minStock, status },
      create: { productId: product.id, stock: body.stock, minStock: body.minStock, status },
      include: { product: true }
    });
    await prisma.product.update({ where: { id: product.id }, data: { status } });
    if (body.stock < body.minStock) {
      emitAdmin("inventory:low-stock", inventory);
    }
    ok(res, inventory);
  })
);

export default router;
