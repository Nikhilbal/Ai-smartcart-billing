import { Router } from "express";
import { z } from "zod";
import { recordCashVerificationBill } from "../services/activityLedger.js";
import { getCashRequest, listCashRequests, listCounterStations, upsertCashRequest, verifyCashRequest } from "../services/cashCounterService.js";
import { emitAdmin, emitCart } from "../services/realtime.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";

const router = Router();

router.post(
  "/cash/request",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        token: z.string().min(3),
        cartId: z.string().default("demo-cart"),
        customerName: z.string().default("Raj Kumar"),
        amount: z.number().positive(),
        counterId: z.string().optional()
      })
      .parse(req.body);

    const request = upsertCashRequest(body);
    emitAdmin("counter:cash-requested", request);
    ok(res, request, 201);
  })
);

router.get(
  "/cash/counters",
  asyncHandler(async (_req, res) => {
    ok(res, listCounterStations());
  })
);

router.get(
  "/cash/pending",
  asyncHandler(async (_req, res) => {
    ok(res, listCashRequests());
  })
);

router.get(
  "/cash/:token",
  asyncHandler(async (req, res) => {
    const request = getCashRequest(req.params.token);
    if (!request) throw new HttpError(404, "Cash verification request not found");
    ok(res, request);
  })
);

router.put(
  "/cash/:token/verify",
  asyncHandler(async (req, res) => {
    const body = z.object({ verifiedBy: z.string().default("counter-staff") }).parse(req.body);
    const request = verifyCashRequest(req.params.token, body.verifiedBy);
    if (!request) throw new HttpError(404, "Cash verification request not found");
    const bill = recordCashVerificationBill(request);
    emitAdmin("counter:cash-verified", request);
    emitAdmin("admin:activity-updated", bill);
    emitCart(request.cartId, "counter:cash-verified", request);
    ok(res, request);
  })
);

export default router;
