import type { Product } from "../data/mock";

export type ReorderStatus = "REQUESTED" | "APPROVED" | "ORDERED" | "RECEIVED";

export type ReorderRequest = {
  id: string;
  productId: string;
  productName: string;
  barcode: string;
  supplier: string;
  supplierPhone: string;
  image: string;
  currentStock: number;
  minStock: number;
  orderQuantity: number;
  unitCost: number;
  estimatedTotal: number;
  priority: "NORMAL" | "URGENT";
  status: ReorderStatus;
  requestedBy: string;
  requestedAt: string;
  expectedDelivery: string;
  notes: string;
};

export function recommendedReorderQuantity(product: Product) {
  const targetStock = product.min * 4;
  return Math.max(50, targetStock - product.stock);
}

export function makeReorderRequest(product: Product, orderQuantity: number, priority: "NORMAL" | "URGENT", notes: string, supplierName = product.supplier, supplierPhone = product.supplierPhone ?? ""): ReorderRequest {
  const now = new Date();
  const delivery = new Date(now);
  delivery.setDate(now.getDate() + (priority === "URGENT" ? 1 : 3));

  return {
    id: `PO${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getTime()).slice(-5)}`,
    productId: product.id,
    productName: product.name,
    barcode: product.barcode,
    supplier: supplierName,
    supplierPhone,
    image: product.image,
    currentStock: product.stock,
    minStock: product.min,
    orderQuantity,
    unitCost: product.price,
    estimatedTotal: orderQuantity * product.price,
    priority,
    status: "REQUESTED",
    requestedBy: "Priya Singh",
    requestedAt: now.toISOString(),
    expectedDelivery: delivery.toISOString(),
    notes
  };
}
