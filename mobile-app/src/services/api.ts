import axios from "axios";
import type { Product } from "../data/products";

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

type ApiProduct = {
  id: string;
  name: string;
  barcode: string;
  description?: string | null;
  price: number | string;
  mrp: number | string;
  weightKg: number | string;
  imageUrl: string;
  supplier: string;
  category?: { name: string } | null;
  inventory?: { stock: number } | null;
};

export function mapApiProduct(product: ApiProduct): Product {
  return {
    id: product.id,
    name: product.name,
    category: product.category?.name ?? "Uncategorized",
    barcode: product.barcode,
    price: Number(product.price),
    mrp: Number(product.mrp),
    weightKg: Number(product.weightKg),
    stock: product.inventory?.stock ?? 0,
    image: product.imageUrl,
    description: product.description ?? "",
    supplier: product.supplier
  };
}

export async function fetchProductByBarcode(barcode: string) {
  const { data } = await api.get(`/products/barcode/${encodeURIComponent(barcode)}`);
  return mapApiProduct(data.data);
}
