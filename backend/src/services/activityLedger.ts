import type { PaymentMethod } from "@prisma/client";
import type { CashCounterRequest } from "./cashCounterService.js";
import type { PaymentApprovalRequest } from "./paymentApprovalService.js";

export type OperationalBillStatus = "PAID" | "CASH_PENDING" | "PENDING";

export type OperationalBill = {
  id: string;
  customer: string;
  method: "UPI" | "CARD" | "CASH";
  upiId: string;
  reference: string;
  total: number;
  status: OperationalBillStatus;
  time: string;
  cartId: string;
  items: number;
  paymentStatus: string;
  exitStatus: string;
  createdAt: string;
};

type BillInput = {
  cartId: string;
  customerName: string;
  amount: number;
  method: "UPI" | "CARD" | "CASH";
  reference: string;
  upiId?: string;
  itemCount?: number;
  status?: OperationalBillStatus;
  paymentStatus?: string;
  exitStatus?: string;
  createdAt?: string;
};

const bills = new Map<string, OperationalBill>();

function billNumber(reference: string) {
  const date = new Date();
  const stamp = date.toISOString().slice(2, 10).replaceAll("-", "");
  const suffix = reference.replace(/\D/g, "").slice(-6).padStart(6, "0");
  return `BL20${stamp}${suffix}`;
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function recordOperationalBill(input: BillInput) {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const bill: OperationalBill = {
    id: billNumber(input.reference),
    customer: input.customerName,
    method: input.method,
    upiId: input.upiId ?? "-",
    reference: input.reference,
    total: Number(input.amount.toFixed(2)),
    status: input.status ?? "PAID",
    time: timeLabel(createdAt),
    cartId: input.cartId,
    items: input.itemCount ?? 1,
    paymentStatus: input.paymentStatus ?? "Success",
    exitStatus: input.exitStatus ?? "QR generated",
    createdAt
  };

  bills.set(input.reference, bill);
  return bill;
}

export function recordPaymentApprovalBill(request: PaymentApprovalRequest) {
  return recordOperationalBill({
    cartId: request.cartId,
    customerName: request.customerName,
    amount: request.amount,
    method: request.method,
    reference: request.reference,
    upiId: request.upiId,
    createdAt: request.approvedAt ?? new Date().toISOString(),
    paymentStatus: `Approved by ${request.approvedBy ?? request.staffName}`,
    exitStatus: "QR generated"
  });
}

export function recordCashVerificationBill(request: CashCounterRequest) {
  return recordOperationalBill({
    cartId: request.cartId,
    customerName: request.customerName,
    amount: request.amount,
    method: "CASH",
    reference: request.token,
    createdAt: request.verifiedAt ?? new Date().toISOString(),
    paymentStatus: `Cash verified by ${request.verifiedBy ?? request.staffName}`,
    exitStatus: "QR generated"
  });
}

export function recordPaidPaymentBill(input: {
  cartId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  upiId?: string;
  itemCount?: number;
  createdAt?: string;
  approvedBy?: string;
}) {
  return recordOperationalBill({
    cartId: input.cartId,
    customerName: input.customerName,
    amount: input.amount,
    method: input.method,
    reference: input.reference,
    upiId: input.upiId,
    itemCount: input.itemCount,
    createdAt: input.createdAt,
    paymentStatus: input.approvedBy ? `Approved by ${input.approvedBy}` : "Success",
    exitStatus: "QR generated"
  });
}

export function listOperationalBills() {
  return Array.from(bills.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function operationalBillTotals() {
  const paidBills = listOperationalBills().filter((bill) => bill.status === "PAID");
  const todaySales = paidBills.reduce((sum, bill) => sum + bill.total, 0);
  return {
    todaySales: Number(todaySales.toFixed(2)),
    totalTransactions: paidBills.length,
    averageCartValue: paidBills.length ? Math.round(todaySales / paidBills.length) : 0
  };
}
