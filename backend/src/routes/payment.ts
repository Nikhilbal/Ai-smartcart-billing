import { PaymentMethod, PaymentStatus, Prisma, WeightStatus } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { markCartPaid } from "../services/cartService.js";
import { approvePaymentApproval, getPaymentApproval, listPaymentApprovals, upsertPaymentApproval } from "../services/paymentApprovalService.js";
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
    const payment = await createPayment(body.cartId, PaymentMethod.UPI, PaymentStatus.PENDING, { upiId: body.upiId, simulated: true, requiresAdminApproval: true });
    emitAdmin("payment:approval-requested", payment);
    ok(res, payment, 201);
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
    const payment = await createPayment(body.cartId, PaymentMethod.CARD, PaymentStatus.PENDING, { last4: body.last4, network: body.network, simulated: true, requiresAdminApproval: true });
    emitAdmin("payment:approval-requested", payment);
    ok(res, payment, 201);
  })
);

router.post(
  "/approval/request",
  asyncHandler(async (req, res) => {
    const body = z
      .object({
        token: z.string().min(3),
        cartId: z.string().default("demo-cart"),
        customerName: z.string().default("Smart Cart Customer"),
        amount: z.number().positive(),
        method: z.enum(["UPI", "CARD"]),
        reference: z.string().optional(),
        upiId: z.string().optional()
      })
      .parse(req.body);

    const request = upsertPaymentApproval(body);
    emitAdmin("payment:approval-requested", request);
    ok(res, request, 201);
  })
);

router.get(
  "/approval/pending",
  asyncHandler(async (_req, res) => {
    ok(res, listPaymentApprovals());
  })
);

router.get(
  "/approval/:token",
  asyncHandler(async (req, res) => {
    const request = getPaymentApproval(req.params.token);
    if (!request) throw new HttpError(404, "Payment approval request not found");
    ok(res, request);
  })
);

router.put(
  "/approval/:token/approve",
  asyncHandler(async (req, res) => {
    const body = z.object({ approvedBy: z.string().default("admin") }).parse(req.body);
    const request = approvePaymentApproval(req.params.token, body.approvedBy);
    if (!request) throw new HttpError(404, "Payment approval request not found");
    emitAdmin("payment:approval-approved", request);
    emitCart(request.cartId, "payment:approval-approved", request);
    ok(res, request);
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

router.put(
  "/:paymentId/approve",
  asyncHandler(async (req, res) => {
    const body = z.object({ approvedBy: z.string().default("admin") }).parse(req.body);
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: { cart: true }
    });
    if (!payment) throw new HttpError(404, "Payment not found");
    if (payment.status === PaymentStatus.PAID) return ok(res, payment);
    if (payment.status === PaymentStatus.FAILED) throw new HttpError(409, "Failed payments cannot be approved");

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PAID,
        gatewayResponse: {
          ...(typeof payment.gatewayResponse === "object" && payment.gatewayResponse !== null && !Array.isArray(payment.gatewayResponse) ? payment.gatewayResponse : {}),
          approvedBy: body.approvedBy,
          approvedAt: new Date().toISOString()
        }
      }
    });

    await markCartPaid(payment.cartId);
    emitCart(payment.cartId, "payment:approved", updated);
    emitAdmin("payment:approved", updated);
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
