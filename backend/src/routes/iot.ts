import { Router } from "express";
import { z } from "zod";
import { emitCart } from "../services/realtime.js";
import { saveWeightReading } from "../services/sensorService.js";
import { asyncHandler, ok } from "../utils/http.js";

const router = Router();

router.post(
  "/weight",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        cartId: z.string(),
        weightKg: z.number().nonnegative(),
        deviceId: z.string().default("smart-cart-scale-01")
      })
      .parse(req.body);

    const reading = saveWeightReading(body.cartId, body.weightKg, body.deviceId);
    emitCart(body.cartId, "sensor:weight", reading);
    ok(res, reading, 201);
  })
);

export default router;
