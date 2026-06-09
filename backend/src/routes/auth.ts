import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../config/prisma.js";
import { signToken } from "../middleware/auth.js";
import { generateOtp, otpTtlMs, sendOtp, shouldExposeOtpInResponse } from "../services/otpService.js";
import { asyncHandler, HttpError, ok } from "../utils/http.js";

const router = Router();
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

router.post(
  "/customer-login",
  asyncHandler(async (req, res) => {
    const body = z.object({ mobile: z.string().regex(/^[6-9]\d{9}$/) }).parse(req.body);
    const otp = generateOtp();
    const delivery = await sendOtp(body.mobile, otp);
    otpStore.set(body.mobile, { otp, expiresAt: Date.now() + otpTtlMs() });
    ok(res, {
      mobile: body.mobile,
      message: "OTP sent successfully",
      provider: delivery.provider,
      delivered: delivery.delivered,
      ...(shouldExposeOtpInResponse() ? { demoOtp: otp } : {})
    });
  })
);

router.post(
  "/verify-otp",
  asyncHandler(async (req, res) => {
    const body = z.object({ mobile: z.string(), otp: z.string().length(6) }).parse(req.body);
    const record = otpStore.get(body.mobile);
    if (!record || record.expiresAt < Date.now() || body.otp !== record.otp) {
      throw new HttpError(401, "Invalid OTP");
    }
    otpStore.delete(body.mobile);

    const user = await prisma.user.upsert({
      where: { mobile: body.mobile },
      update: {},
      create: {
        mobile: body.mobile,
        name: body.mobile === "9876543210" ? "Raj Kumar" : "Smart Cart Customer"
      }
    });

    ok(res, {
      user,
      token: signToken({ sub: user.id, role: "CUSTOMER" })
    });
  })
);

router.post(
  "/admin-login",
  asyncHandler(async (req, res) => {
    const body = z.object({ email: z.string().email(), password: z.string().min(6) }).parse(req.body);
    const admin = await prisma.admin.findUnique({ where: { email: body.email }, include: { store: true } });
    if (!admin || !(await bcrypt.compare(body.password, admin.passwordHash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    ok(res, {
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        store: admin.store
      },
      token: signToken({ sub: admin.id, role: "ADMIN", storeId: admin.storeId })
    });
  })
);

export default router;
