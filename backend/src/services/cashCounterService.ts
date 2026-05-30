export type CashCounterStatus = "PENDING" | "VERIFIED";

export type CounterStation = {
  id: string;
  name: string;
  location: string;
  staffId: string;
  staffName: string;
  status: "ACTIVE" | "PAUSED";
};

export type CashCounterRequest = {
  token: string;
  cartId: string;
  customerName: string;
  amount: number;
  counterId: string;
  counterName: string;
  counterLocation: string;
  staffId: string;
  staffName: string;
  queueNo: string;
  status: CashCounterStatus;
  notifiedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
};

export type CashCounterInput = {
  token: string;
  cartId: string;
  customerName: string;
  amount: number;
  counterId?: string;
};

const counterStations: CounterStation[] = [
  { id: "C1", name: "Counter 1", location: "Near Exit Gate", staffId: "STF101", staffName: "Ramesh Patil", status: "ACTIVE" },
  { id: "C2", name: "Counter 2", location: "Cash & UPI Help Desk", staffId: "STF102", staffName: "Sana Khan", status: "ACTIVE" },
  { id: "C3", name: "Counter 3", location: "Reserve Counter", staffId: "STF103", staffName: "Amit Verma", status: "PAUSED" }
];

const requests = new Map<string, CashCounterRequest>();
let counterCursor = 0;
let queueSequence = 24;

function assignCounter(preferredCounterId?: string) {
  const activeCounters = counterStations.filter((counter) => counter.status === "ACTIVE");
  const preferredCounter = activeCounters.find((counter) => counter.id === preferredCounterId);
  const counter = preferredCounter ?? activeCounters[counterCursor % activeCounters.length] ?? counterStations[0];
  counterCursor += 1;
  return counter;
}

export function upsertCashRequest(input: CashCounterInput) {
  const existing = requests.get(input.token);
  if (existing?.status === "VERIFIED") return existing;
  const assignedCounter = existing ? undefined : assignCounter(input.counterId);

  const request: CashCounterRequest = {
    token: input.token,
    cartId: input.cartId,
    customerName: input.customerName,
    amount: input.amount,
    counterId: existing?.counterId ?? assignedCounter?.id ?? "C1",
    counterName: existing?.counterName ?? assignedCounter?.name ?? "Counter 1",
    counterLocation: existing?.counterLocation ?? assignedCounter?.location ?? "Near Exit Gate",
    staffId: existing?.staffId ?? assignedCounter?.staffId ?? "STF101",
    staffName: existing?.staffName ?? assignedCounter?.staffName ?? "Ramesh Patil",
    queueNo: existing?.queueNo ?? `Q${queueSequence++}`,
    status: "PENDING",
    notifiedAt: existing?.notifiedAt ?? new Date().toISOString()
  };
  requests.set(input.token, request);
  return request;
}

export function listCashRequests() {
  return Array.from(requests.values()).sort((a, b) => b.notifiedAt.localeCompare(a.notifiedAt));
}

export function getCashRequest(token: string) {
  return requests.get(token);
}

export function listCounterStations() {
  return counterStations;
}

export function verifyCashRequest(token: string, verifiedBy = "counter-staff") {
  const existing = requests.get(token);
  if (!existing) return null;

  const updated: CashCounterRequest = {
    ...existing,
    status: "VERIFIED",
    verifiedAt: new Date().toISOString(),
    verifiedBy
  };
  requests.set(token, updated);
  return updated;
}
