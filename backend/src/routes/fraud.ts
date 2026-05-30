import { FraudStatus, FraudType, RiskLevel } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { createFraudEvent } from "../services/fraudService.js";
import { emitAdmin } from "../services/realtime.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";

const router = Router();

router.post(
  "/check",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        cartId: z.string().optional(),
        userId: z.string().optional(),
        type: z.nativeEnum(FraudType),
        title: z.string(),
        description: z.string(),
        risk: z.nativeEnum(RiskLevel).default(RiskLevel.MEDIUM),
        expectedWeightKg: z.number().optional(),
        actualWeightKg: z.number().optional(),
        variancePercent: z.number().optional(),
        metadata: z.record(z.unknown()).optional()
      })
      .parse(req.body);

    ok(res, await createFraudEvent(body), 201);
  })
);

router.get(
  "/events",
  asyncHandler(async (_req, res) => {
    const events = await prisma.fraudEvent.findMany({
      include: { user: true, cart: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    ok(res, events);
  })
);

router.put(
  "/:id/resolve",
  asyncHandler(async (req, res) => {
    const body = z.object({ status: z.nativeEnum(FraudStatus).default(FraudStatus.RESOLVED) }).parse(req.body);
    const event = await prisma.fraudEvent.findUnique({ where: { id: req.params.id } });
    if (!event) throw new HttpError(404, "Fraud event not found");
    const updated = await prisma.fraudEvent.update({
      where: { id: event.id },
      data: { status: body.status, resolvedAt: new Date() }
    });
    emitAdmin("fraud:resolved", updated);
    ok(res, updated);
  })
);

export default router;
