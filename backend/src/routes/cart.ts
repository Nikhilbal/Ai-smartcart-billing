import { FraudType, RiskLevel } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { recalculateCart, getCart } from "../services/cartService.js";
import { createFraudEvent } from "../services/fraudService.js";
import { emitAdmin, emitCart } from "../services/realtime.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";

const router = Router();

async function resolveStoreId(storeId?: string) {
  if (storeId) return storeId;
  const store = await prisma.store.findFirst({ where: { code: process.env.STORE_ID ?? "mumbai-vile-parle" } });
  if (!store) throw new HttpError(500, "No store configured");
  return store.id;
}

router.post(
  "/create",
  asyncHandler(async (req, res) => {
    const body = z.object({ userId: z.string(), storeId: z.string().optional() }).parse(req.body);
    const cart = await prisma.cart.create({
      data: {
        userId: body.userId,
        storeId: await resolveStoreId(body.storeId)
      }
    });
    emitAdmin("cart:created", cart);
    ok(res, await getCart(cart.id), 201);
  })
);

router.post(
  "/add-item",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        cartId: z.string(),
        productId: z.string().optional(),
        barcode: z.string().optional(),
        quantity: z.number().int().positive().default(1)
      })
      .parse(req.body);

    const product = body.productId
      ? await prisma.product.findUnique({ where: { id: body.productId }, include: { inventory: true } })
      : await prisma.product.findUnique({ where: { barcode: body.barcode ?? "" }, include: { inventory: true } });

    if (!product || !product.isActive) throw new HttpError(404, "Product not found");
    if (!product.inventory || product.inventory.stock < body.quantity) throw new HttpError(409, "Insufficient stock");

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: body.cartId, productId: product.id } }
    });

    const cartItem = existing
      ? await prisma.cartItem.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + body.quantity,
            scans: { increment: 1 },
            status: "SCANNED"
          }
        })
      : await prisma.cartItem.create({
          data: {
            cartId: body.cartId,
            productId: product.id,
            quantity: body.quantity,
            unitPrice: product.price,
            weightKg: product.weightKg
          }
        });

    if (existing && existing.scans >= 5) {
      await createFraudEvent({
        cartId: body.cartId,
        type: FraudType.DUPLICATE_BARCODE,
        risk: RiskLevel.MEDIUM,
        title: "Duplicate barcode misuse suspected",
        description: `${product.name} scanned repeatedly in the same cart.`,
        metadata: { productId: product.id, scans: existing.scans + 1 }
      });
    }

    const cart = await recalculateCart(body.cartId);
    emitCart(body.cartId, "cart:updated", cart);
    emitAdmin("cart:item-scanned", { cartId: body.cartId, cartItem });
    ok(res, cart);
  })
);

router.put(
  "/update-item",
  asyncHandler(async (req, res) => {
    const body = z.object({ cartItemId: z.string(), quantity: z.number().int().min(0) }).parse(req.body);
    const current = await prisma.cartItem.findUnique({ where: { id: body.cartItemId } });
    if (!current) throw new HttpError(404, "Cart item not found");

    if (body.quantity === 0) {
      await prisma.cartItem.delete({ where: { id: current.id } });
    } else {
      await prisma.cartItem.update({
        where: { id: current.id },
        data: {
          quantity: body.quantity,
          removeCount: body.quantity < current.quantity ? { increment: 1 } : undefined
        }
      });
    }

    if (current.removeCount >= 3) {
      await createFraudEvent({
        cartId: current.cartId,
        type: FraudType.SCAN_REMOVE_ABUSE,
        risk: RiskLevel.MEDIUM,
        title: "Repeated scan/remove pattern",
        description: "Customer repeatedly added and removed the same item.",
        metadata: { cartItemId: current.id, removeCount: current.removeCount + 1 }
      });
    }

    const cart = await recalculateCart(current.cartId);
    emitCart(current.cartId, "cart:updated", cart);
    ok(res, cart);
  })
);

router.delete(
  "/remove-item",
  asyncHandler(async (req, res) => {
    const body = z.object({ cartItemId: z.string() }).parse(req.body);
    const current = await prisma.cartItem.findUnique({ where: { id: body.cartItemId } });
    if (!current) throw new HttpError(404, "Cart item not found");
    await prisma.cartItem.delete({ where: { id: current.id } });
    const cart = await recalculateCart(current.cartId);
    emitCart(current.cartId, "cart:updated", cart);
    ok(res, cart);
  })
);

router.get(
  "/:cartId",
  asyncHandler(async (req, res) => {
    const cart = await getCart(req.params.cartId);
    if (!cart) throw new HttpError(404, "Cart not found");
    ok(res, cart);
  })
);

export default router;
