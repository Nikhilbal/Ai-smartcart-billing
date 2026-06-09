import axios from "axios";
import crypto from "node:crypto";

type OtpDelivery = {
  provider: string;
  delivered: boolean;
};

function otpProvider() {
  return (process.env.OTP_PROVIDER ?? "demo").trim().toLowerCase();
}

function fillTemplate(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((result, [key, value]) => result.replaceAll(`{${key}}`, value), template);
}

export function otpTtlMs() {
  const seconds = Number(process.env.OTP_TTL_SECONDS ?? 300);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 300_000;
}

export function generateOtp() {
  if (otpProvider() === "demo") return "123456";
  return String(crypto.randomInt(100000, 1000000));
}

export function shouldExposeOtpInResponse() {
  return otpProvider() === "demo" || process.env.OTP_EXPOSE_DEMO_OTP === "true";
}

export async function sendOtp(mobile: string, otp: string): Promise<OtpDelivery> {
  const provider = otpProvider();

  if (provider === "demo") {
    console.info(`[otp:demo] +91${mobile} -> ${otp}`);
    return { provider, delivered: false };
  }

  if (provider !== "http") {
    throw new Error(`Unsupported OTP_PROVIDER "${provider}". Use "demo" or "http".`);
  }

  const rawUrl = process.env.OTP_HTTP_URL;
  if (!rawUrl) throw new Error("OTP_HTTP_URL is required when OTP_PROVIDER=http");

  const values = { mobile, mobileWithCountryCode: `91${mobile}`, otp };
  const method = (process.env.OTP_HTTP_METHOD ?? "POST").toUpperCase();
  const headers: Record<string, string> = {};
  const authHeader = process.env.OTP_HTTP_AUTH_HEADER;
  const authValue = process.env.OTP_HTTP_AUTH_VALUE;

  if (authHeader && authValue) {
    headers[authHeader] = fillTemplate(authValue, values);
  }

  let data: unknown;
  if (method !== "GET") {
    const bodyTemplate = process.env.OTP_HTTP_BODY ?? '{"mobile":"{mobileWithCountryCode}","otp":"{otp}"}';
    const filledBody = fillTemplate(bodyTemplate, values);
    headers["Content-Type"] = "application/json";
    try {
      data = JSON.parse(filledBody);
    } catch {
      data = filledBody;
      headers["Content-Type"] = "text/plain";
    }
  }

  await axios.request({
    url: fillTemplate(rawUrl, values),
    method,
    headers,
    data,
    timeout: 10_000
  });

  return { provider, delivered: true };
}
