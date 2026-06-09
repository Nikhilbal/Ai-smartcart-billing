import axios from "axios";
import crypto from "node:crypto";

type RazorpayOrderInput = {
  amount: number;
  receipt: string;
  notes?: Record<string, string>;
};

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

export function razorpayKeyId() {
  return process.env.RAZORPAY_KEY_ID;
}

export async function createRazorpayOrder(input: RazorpayOrderInput) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error("Razorpay keys are not configured");

  const amountInPaise = Math.round(input.amount * 100);
  const { data } = await axios.post(
    "https://api.razorpay.com/v1/orders",
    {
      amount: amountInPaise,
      currency: "INR",
      receipt: input.receipt,
      notes: input.notes ?? {}
    },
    {
      auth: {
        username: keyId,
        password: keySecret
      },
      timeout: 12_000
    }
  );

  return data;
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error("Razorpay key secret is not configured");

  const expected = crypto.createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signature);

  return expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
