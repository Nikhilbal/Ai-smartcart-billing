import { FraudStatus, FraudType, Prisma, RiskLevel } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { emitAdmin } from "./realtime.js";

type FraudInput = {
  cartId?: string;
  userId?: string;
  type: FraudType;
  risk?: RiskLevel;
  title: string;
  description: string;
  expectedWeightKg?: number;
  actualWeightKg?: number;
  variancePercent?: number;
  metadata?: Record<string, unknown>;
};

export async function createFraudEvent(input: FraudInput) {
  const event = await prisma.fraudEvent.create({
    data: {
      cartId: input.cartId,
      userId: input.userId,
      type: input.type,
      risk: input.risk ?? RiskLevel.MEDIUM,
      status: FraudStatus.ACTIVE,
      title: input.title,
      description: input.description,
      expectedWeightKg: input.expectedWeightKg,
      actualWeightKg: input.actualWeightKg,
      variancePercent: input.variancePercent,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue
    }
  });
  emitAdmin("fraud:event", event);
  return event;
}
