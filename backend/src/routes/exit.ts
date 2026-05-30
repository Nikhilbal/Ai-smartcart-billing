import QRCode from "qrcode";
import { FraudType, PaymentStatus, RiskLevel, WeightStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { createFraudEvent } from "../services/fraudService.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";

const router = Router();

router.post(
  "/verify",
  asyncHandler(async (req, res) => {
    const body = z.object({ token: z.string() }).parse(req.body);
    const exit = await prisma.exitVerification.findUnique({
      where: { token: body.token },
      include: { bill: { include: { cart: true, user: true, payment: true } } }
    });

    if (!exit) throw new HttpError(404, "Invalid exit token");
    const allowed = exit.bill.payment.status === PaymentStatus.PAID && exit.bill.cart.weightStatus === WeightStatus.VERIFIED;

    if (!allowed) {
      await createFraudEvent({
        cartId: exit.bill.cartId,
        userId: exit.bill.userId,
        type: FraudType.PAYMENT_EXIT_ATTEMPT,
        risk: RiskLevel.HIGH,
        title: "Exit attempted without valid paid and verified cart",
        description: "Exit QR was scanned, but payment or weight verification was not valid.",
        metadata: { billId: exit.billId }
      });
      await prisma.exitVerification.update({ where: { id: exit.id }, data: { status: "BLOCKED" } });
      throw new HttpError(409, "Exit blocked. Admin review required.");
    }

    const updated = await prisma.exitVerification.update({
      where: { id: exit.id },
      data: { status: "USED", verifiedAt: new Date() },
      include: { bill: true }
    });
    ok(res, { exit: updated, message: "Exit verified. Thank you for shopping." });
  })
);

router.get(
  "/qr/:billId",
  asyncHandler(async (req, res) => {
    const exit = await prisma.exitVerification.findUnique({
      where: { billId: req.params.billId },
      include: { bill: true }
    });
    if (!exit) throw new HttpError(404, "Exit QR not found");
    ok(res, {
      token: exit.token,
      billNo: exit.bill.billNo,
      qrPayload: exit.bill.qrPayload,
      qrDataUrl: await QRCode.toDataURL(exit.bill.qrPayload)
    });
  })
);

export default router;
