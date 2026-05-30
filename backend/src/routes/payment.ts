import { PaymentMethod, PaymentStatus, Prisma, WeightStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { markCartPaid } from "../services/cartService.js";
import { emitAdmin, emitCart } from "../services/realtime.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";

const router = Router();

async function createPayment(cartId: string, method: PaymentMethod, status: PaymentStatus, metadata: Record<string, unknown>) {
  const cart = await prisma.cart.findUnique({ where: { id: cartId }, include: { user: true } });
  if (!cart) throw new HttpError(404, "Cart not found");
  if (cart.weightStatus !== WeightStatus.VERIFIED) throw new HttpError(409, "Weight verification must pass before payment");

  const reference = `${method}${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const payment = await prisma.payment.create({
    data: {
      cartId,
      userId: cart.userId,
      method,
      amount: cart.total,
      status,
      reference,
      gatewayResponse: metadata as Prisma.InputJsonValue
    }
  });

  if (status === PaymentStatus.PAID) {
    await markCartPaid(cartId);
  } else {
    await prisma.cart.update({ where: { id: cartId }, data: { paymentStatus: status } });
  }

  emitCart(cartId, "payment:updated", payment);
  emitAdmin("payment:updated", payment);
  return payment;
}

router.post(
  "/upi",
  asyncHandler(async (req, res) => {
    const body = z.object({ cartId: z.string(), upiId: z.string().min(3) }).parse(req.body);
    ok(res, await createPayment(body.cartId, PaymentMethod.UPI, PaymentStatus.PAID, { upiId: body.upiId, simulated: true }), 201);
  })
);

router.post(
  "/card",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        cartId: z.string(),
        last4: z.string().length(4),
        network: z.string().default("Rupay")
      })
      .parse(req.body);
    ok(res, await createPayment(body.cartId, PaymentMethod.CARD, PaymentStatus.PAID, { last4: body.last4, network: body.network, simulated: true }), 201);
  })
);

router.post(
  "/cash",
  asyncHandler(async (req, res) => {
    const body = z.object({ cartId: z.string(), received: z.boolean().default(false) }).parse(req.body);
    const status = body.received ? PaymentStatus.PAID : PaymentStatus.CASH_PENDING;
    ok(res, await createPayment(body.cartId, PaymentMethod.CASH, status, { counter: "C1", simulated: true }), 201);
  })
);

router.put(
  "/cash/:paymentId/confirm",
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: { cart: true }
    });
    if (!payment) throw new HttpError(404, "Payment not found");
    if (payment.method !== PaymentMethod.CASH) throw new HttpError(409, "Only cash payments can be counter-confirmed");
    if (payment.status === PaymentStatus.PAID) return ok(res, payment);
    if (payment.status !== PaymentStatus.CASH_PENDING) throw new HttpError(409, "Cash payment is not pending counter verification");

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        gatewayResponse: {
          counter: "C1",
          verifiedBy: "counter-staff",
          verifiedAt: new Date().toISOString()
        }
      }
    });

    await markCartPaid(payment.cartId);
    emitCart(payment.cartId, "payment:cash-confirmed", updated);
    emitAdmin("payment:cash-confirmed", updated);
    ok(res, updated);
  })
);

router.get(
  "/status/:paymentId",
  asyncHandler(async (req, res) => {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.paymentId } });
    if (!payment) throw new HttpError(404, "Payment not found");
    ok(res, payment);
  })
);

export default router;
