import axios from "axios";

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api",
  timeout: 7000
});

export async function requestOtp(mobile: string) {
  const { data } = await api.post("/auth/customer-login", { mobile });
  return data.data;
}

export async function verifyOtp(mobile: string, otp: string) {
  const { data } = await api.post("/auth/verify-otp", { mobile, otp });
  return data.data;
}
