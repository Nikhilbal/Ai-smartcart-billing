import { CartItemStatus, FraudType, RiskLevel, WeightStatus } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { createFraudEvent } from "./fraudService.js";
import { emitAdmin, emitCart } from "./realtime.js";

export function calculateVariance(expectedWeightKg: number, actualWeightKg: number) {
  if (expectedWeightKg <= 0) return actualWeightKg <= 0 ? 0 : 100;
  return Math.abs(actualWeightKg - expectedWeightKg) / expectedWeightKg * 100;
}

export async function verifyCartWeight(cartId: string, actualWeightKg: number) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: { user: true, items: true }
  });
  if (!cart) throw new Error("Cart not found");
  if (cart.items.length === 0) throw new Error("Cart has no scanned items");

  const expectedWeightKg = Number(cart.expectedWeightKg.toFixed(3));
  const variancePercent = Number(calculateVariance(expectedWeightKg, actualWeightKg).toFixed(2));
  const status = variancePercent <= 2 ? WeightStatus.VERIFIED : WeightStatus.FAILED;

  const verification = await prisma.weightVerification.create({
    data: {
      cartId,
      expectedWeightKg,
      actualWeightKg,
      variancePercent,
      status
    }
  });

  await prisma.cart.update({
    where: { id: cartId },
    data: {
      actualWeightKg,
      weightStatus: status
    }
  });

  if (status === WeightStatus.VERIFIED) {
    await prisma.cartItem.updateMany({
      where: { cartId },
      data: { status: CartItemStatus.VERIFIED }
    });
  } else {
    await createFraudEvent({
      cartId,
      userId: cart.userId,
      type: FraudType.WEIGHT_MISMATCH,
      risk: variancePercent > 10 ? RiskLevel.HIGH : RiskLevel.MEDIUM,
      title: `Weight mismatch ${variancePercent}%`,
      description: "Actual cart weight does not match scanned item weight. Possible unscanned item.",
      expectedWeightKg,
      actualWeightKg,
      variancePercent,
      metadata: { tolerancePercent: 2 }
    });
  }

  emitCart(cartId, "weight:result", verification);
  emitAdmin("weight:verification", { cartId, verification });
  return verification;
}
