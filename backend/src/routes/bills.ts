import QRCode from "qrcode";
import { PaymentStatus, WeightStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { prisma } from "../config/prisma.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";

const router = Router();

function billNo() {
  const stamp = new Date().toISOString().slice(2, 10).replaceAll("-", "");
  return `BL20${stamp}${Math.floor(100000 + Math.random() * 900000)}`;
}

router.post(
  "/generate",
  asyncHandler(async (req, res) => {
    const body = z.object({ cartId: z.string() }).parse(req.body);
    const cart = await prisma.cart.findUnique({
      where: { id: body.cartId },
      include: {
        user: true,
        store: true,
        items: { include: { product: true } },
        payments: { where: { status: PaymentStatus.PAID }, orderBy: { createdAt: "desc" }, take: 1 },
        weightVerifications: { where: { status: WeightStatus.VERIFIED }, orderBy: { createdAt: "desc" }, take: 1 },
        bill: true
      }
    });
    if (!cart) throw new HttpError(404, "Cart not found");
    if (cart.bill) return ok(res, cart.bill);
    if (cart.paymentStatus !== PaymentStatus.PAID || cart.payments.length === 0) throw new HttpError(409, "Paid payment is required before bill generation");
    if (cart.weightStatus !== WeightStatus.VERIFIED || cart.weightVerifications.length === 0) throw new HttpError(409, "Verified weight is required before bill generation");

    const token = uuid();
    const payload = JSON.stringify({
      billNo: billNo(),
      cartId: cart.id,
      userId: cart.userId,
      total: cart.total,
      token
    });

    const bill = await prisma.$transaction(async (tx) => {
      const created = await tx.bill.create({
        data: {
          cartId: cart.id,
          userId: cart.userId,
          storeId: cart.storeId,
          paymentId: cart.payments[0].id,
          weightVerificationId: cart.weightVerifications[0].id,
          billNo: JSON.parse(payload).billNo,
          subtotal: cart.subtotal,
          tax: cart.tax,
          discount: cart.discount,
          total: cart.total,
          qrPayload: payload
        }
      });

      await tx.exitVerification.create({
        data: {
          billId: created.id,
          token
        }
      });

      await tx.cart.update({ where: { id: cart.id }, data: { status: "COMPLETED" } });
      return created;
    });

    ok(res, {
      ...bill,
      qrDataUrl: await QRCode.toDataURL(payload)
    }, 201);
  })
);

router.get(
  "/:billId",
  asyncHandler(async (req, res) => {
    const bill = await prisma.bill.findUnique({
      where: { id: req.params.billId },
      include: {
        user: true,
        store: true,
        payment: true,
        cart: { include: { items: { include: { product: true } }, weightVerifications: { orderBy: { createdAt: "desc" }, take: 1 } } },
        exitVerification: true
      }
    });
    if (!bill) throw new HttpError(404, "Bill not found");
    ok(res, {
      ...bill,
      qrDataUrl: await QRCode.toDataURL(bill.qrPayload)
    });
  })
);

export default router;
