import { CartItemStatus, PaymentStatus, ProductStatus, WeightStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";

export const GST_RATE = 0.05;

export async function recalculateCart(cartId: string) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: { product: true }
  });

  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const expectedWeightKg = items.reduce((sum, item) => sum + item.weightKg * item.quantity, 0);
  const tax = Number((subtotal * GST_RATE).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  return prisma.cart.update({
    where: { id: cartId },
    data: {
      subtotal,
      tax,
      total,
      expectedWeightKg: Number(expectedWeightKg.toFixed(3))
    },
    include: cartInclude
  });
}

export const cartInclude = {
  user: true,
  store: true,
  items: {
    include: {
      product: {
        include: {
          category: true,
          inventory: true
        }
      }
    },
    orderBy: { createdAt: "asc" as const }
  },
  weightVerifications: {
    orderBy: { createdAt: "desc" as const },
    take: 1
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 1
  }
};

export async function getCart(cartId: string) {
  return prisma.cart.findUnique({
    where: { id: cartId },
    include: cartInclude
  });
}

export function getInventoryStatus(stock: number, minStock = 50) {
  if (stock <= 0) return ProductStatus.OUT_OF_STOCK;
  if (stock < minStock) return ProductStatus.LOW_STOCK;
  return ProductStatus.ACTIVE;
}

export async function markCartPaid(cartId: string) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { items: { include: { product: { include: { inventory: true } } } } }
  });

  if (!cart) throw new Error("Cart not found");
  if (cart.weightStatus !== WeightStatus.VERIFIED) throw new Error("Weight verification is required before billing");

  await prisma.$transaction(async (tx) => {
    await tx.cartItem.updateMany({
      where: { cartId },
      data: { status: CartItemStatus.BILLED }
    });

    for (const item of cart.items) {
      const inventory = item.product.inventory;
      if (!inventory) continue;
      const nextStock = Math.max(0, inventory.stock - item.quantity);
      await tx.inventory.update({
        where: { productId: item.productId },
        data: { stock: nextStock, status: getInventoryStatus(nextStock, inventory.minStock) }
      });
      await tx.product.update({
        where: { id: item.productId },
        data: { status: getInventoryStatus(nextStock, inventory.minStock) }
      });
    }

    await tx.cart.update({
      where: { id: cartId },
      data: { paymentStatus: PaymentStatus.PAID, status: "CHECKOUT" }
    });
  });
}
