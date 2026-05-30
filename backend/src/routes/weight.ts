import { Router } from "express";
import { z } from "zod";
import { getWeightReading } from "../services/sensorService.js";
import { verifyCartWeight } from "../services/weightService.js";
import { prisma } from "../config/prisma.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";

const router = Router();

router.post(
  "/verify",
  asyncHandler(async (req, res) => {
    const body = z.object({ cartId: z.string(), actualWeightKg: z.number().positive().optional() }).parse(req.body);
    const sensorReading = getWeightReading(body.cartId);
    const actualWeightKg = body.actualWeightKg ?? sensorReading?.weightKg;
    if (actualWeightKg === undefined) throw new HttpError(422, "No actual weight provided or received from sensor");
    ok(res, await verifyCartWeight(body.cartId, actualWeightKg));
  })
);

router.get(
  "/result/:cartId",
  asyncHandler(async (req, res) => {
    const result = await prisma.weightVerification.findFirst({
      where: { cartId: req.params.cartId },
      orderBy: { createdAt: "desc" }
    });
    if (!result) throw new HttpError(404, "No verification result found");
    ok(res, result);
  })
);

export default router;
