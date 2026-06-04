export type PaymentApprovalStatus = "PENDING" | "APPROVED";
export type ApprovalPaymentMethod = "UPI" | "CARD";

export type PaymentApprovalRequest = {
  token: string;
  cartId: string;
  customerName: string;
  amount: number;
  method: ApprovalPaymentMethod;
  reference: string;
  upiId?: string;
  counterId: string;
  counterName: string;
  counterLocation: string;
  staffId: string;
  staffName: string;
  status: PaymentApprovalStatus;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
};

export type PaymentApprovalInput = {
  token: string;
  cartId: string;
  customerName: string;
  amount: number;
  method: ApprovalPaymentMethod;
  reference?: string;
  upiId?: string;
};

const requests = new Map<string, PaymentApprovalRequest>();

const approvalDesk = {
  counterId: "P1",
  counterName: "Payment Desk 1",
  counterLocation: "Exit billing desk",
  staffId: "STF201",
  staffName: "Priya Singh"
};

export function upsertPaymentApproval(input: PaymentApprovalInput) {
  const existing = requests.get(input.token);
  if (existing?.status === "APPROVED") return existing;

  const request: PaymentApprovalRequest = {
    token: input.token,
    cartId: input.cartId,
    customerName: input.customerName,
    amount: input.amount,
    method: input.method,
    reference: input.reference ?? input.token,
    upiId: input.upiId,
    ...approvalDesk,
    status: "PENDING",
    requestedAt: existing?.requestedAt ?? new Date().toISOString()
  };

  requests.set(input.token, request);
  return request;
}

export function listPaymentApprovals() {
  return Array.from(requests.values()).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

export function getPaymentApproval(token: string) {
  return requests.get(token);
}

export function approvePaymentApproval(token: string, approvedBy = "admin") {
  const existing = requests.get(token);
  if (!existing) return null;

  const updated: PaymentApprovalRequest = {
    ...existing,
    status: "APPROVED",
    approvedAt: new Date().toISOString(),
    approvedBy
  };
  requests.set(token, updated);
  return updated;
}
