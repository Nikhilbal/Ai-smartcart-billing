import { Activity, AlertTriangle, Banknote, CheckCircle2, Clock3, CreditCard, Eye, LineChart, QrCode, RefreshCw, Search, ShoppingCart, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart as ReLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { io } from "socket.io-client";
import { activeCarts, bills, customers, products, weeklySales } from "../data/mock";
import { api } from "../lib/api";
import { cn, inr } from "../lib/utils";
import { Badge, Button, Card, Input } from "../components/ui";
import { DetailDrawer, DetailGrid } from "../components/DetailDrawer";
import type { BillingFilter } from "../App";
import type { PageKey } from "../components/Sidebar";

type CashRequest = {
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
  status: "PENDING" | "VERIFIED";
  notifiedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
};

const fallbackCashRequests: CashRequest[] = bills
  .filter((bill) => bill.method === "CASH")
  .map((bill) => ({
    token: bill.reference,
    cartId: bill.cartId,
    customerName: bill.customer,
    amount: bill.total,
    counterId: "C1",
    counterName: "Counter 1",
    counterLocation: "Near Exit Gate",
    staffId: "STF101",
    staffName: "Ramesh Patil",
    queueNo: "Q24",
    status: bill.status === "PAID" ? "VERIFIED" : "PENDING",
    notifiedAt: "2026-05-27T12:22:00.000Z",
    verifiedBy: bill.status === "PAID" ? "Priya Singh" : undefined
  }));

function cashTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

const socketBaseUrl = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/api").replace(/\/api\/?$/, "");

export function CartMonitoring() {
  const [selectedCart, setSelectedCart] = useState<(typeof activeCarts)[number] | null>(null);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Card className="p-7">
        <h2 className="mb-6 flex items-center gap-3 text-2xl font-extrabold"><Activity className="text-brand" /> Live Smart Carts</h2>
        <div className="space-y-4">
          {activeCarts.map((cart) => (
            <button key={cart.id} type="button" onClick={() => setSelectedCart(cart)} className="flex w-full flex-wrap items-center gap-4 rounded-[18px] border border-border p-5 text-left transition hover:-translate-y-0.5 hover:border-brand/30 hover:bg-blue-50/40">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-brand"><ShoppingCart /></div>
              <div className="min-w-[180px] flex-1">
                <div className="text-lg font-extrabold">{cart.id}</div>
                <div className="text-sm font-bold text-gray-500">{cart.customer} · {cart.updated}</div>
              </div>
              <Badge className={cn(cart.status === "Mismatch" ? "bg-red-50 text-danger" : cart.status === "Verified" ? "bg-emerald-50 text-success" : "bg-blue-50 text-brand")}>{cart.status}</Badge>
              <div className="font-mono font-black">{cart.items} items · {cart.weight}</div>
              <div className="font-mono text-lg font-black text-brand">{inr(cart.total)}</div>
              <span className="inline-flex items-center gap-2 rounded-2xl bg-gray-100 px-4 py-2 text-sm font-bold text-gray-700"><Eye size={17} /> View</span>
            </button>
          ))}
        </div>
      </Card>
      <Card className="p-7">
        <h2 className="mb-6 text-2xl font-extrabold">Weight Stream</h2>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ReLineChart data={[0.4, 0.53, 1.1, 1.7, 2.1, 5.2].map((weight, index) => ({ index, weight }))}>
              <CartesianGrid stroke="#EEF2F7" />
              <XAxis dataKey="index" hide />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#2563EB" strokeWidth={4} dot={{ r: 5 }} />
            </ReLineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <DetailDrawer open={Boolean(selectedCart)} onClose={() => setSelectedCart(null)} title={selectedCart?.id ?? "Cart Details"} subtitle={selectedCart ? `${selectedCart.customer} · ${selectedCart.updated}` : undefined}>
        {selectedCart ? (
          <div className="space-y-6">
            <DetailGrid
              rows={[
                ["Customer", selectedCart.customer],
                ["Status", <Badge className={cn(selectedCart.status === "Mismatch" ? "bg-red-50 text-danger" : selectedCart.status === "Verified" ? "bg-emerald-50 text-success" : "bg-blue-50 text-brand")}>{selectedCart.status}</Badge>],
                ["Expected Weight", selectedCart.expectedWeight],
                ["Actual Weight", selectedCart.weight],
                ["Payment", selectedCart.payment],
                ["Current Location", selectedCart.location],
                ["Cart Total", inr(selectedCart.total)]
              ]}
            />
            <div>
              <h3 className="mb-3 text-lg font-extrabold">Scanned Items</h3>
              <div className="space-y-2">
                {selectedCart.lines.map((line) => (
                  <div key={line} className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold text-gray-700">{line}</div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}

export function SalesAnalytics({ onNavigate }: { onNavigate: (page: PageKey, filter?: BillingFilter) => void }) {
  const salesCards = [
    { label: "Today", value: 145230, onClick: () => onNavigate("billing", "all") },
    { label: "This Week", value: 865000, onClick: () => onNavigate("sales") },
    { label: "UPI Share", value: 72, suffix: "%", onClick: () => onNavigate("billing", "upi") },
    { label: "Best Product", value: 1234, onClick: () => onNavigate("inventory") }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        {salesCards.map(({ label, value, suffix, onClick }) => (
          <button key={label} type="button" onClick={onClick} className="text-left">
          <Card className="h-full p-6 transition hover:-translate-y-1 hover:border-brand/30">
            <div className="text-sm font-extrabold text-gray-500">{label}</div>
            <div className="mt-4 font-mono text-3xl font-black text-ink">{value > 2000 ? inr(value) : `${value}${suffix ?? ""}`}</div>
          </Card>
          </button>
        ))}
      </div>
      <Card className="p-7">
        <h2 className="mb-6 flex items-center gap-3 text-2xl font-extrabold"><LineChart className="text-brand" /> Weekly Sales Chart</h2>
        <div className="h-[420px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklySales}>
              <CartesianGrid stroke="#EEF2F7" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} tickLine={false} axisLine={false} />
              <Tooltip formatter={(value) => inr(Number(value))} />
              <Bar dataKey="sales" fill="#10B981" radius={[12, 12, 0, 0]} barSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

export function CustomerManagement() {
  const [selectedCustomer, setSelectedCustomer] = useState<(typeof customers)[number] | null>(null);

  return (
    <>
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-7 md:flex-row md:items-center md:justify-between">
        <h2 className="flex items-center gap-3 text-2xl font-extrabold"><Users className="text-brand" /> Customers</h2>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <Input className="pl-12" placeholder="Search customers" />
        </div>
      </div>
      <table className="w-full min-w-[820px] text-left">
        <thead className="bg-gray-50 text-sm font-extrabold text-gray-500">
          <tr><th className="px-6 py-5">Customer</th><th className="px-6 py-5">Mobile</th><th className="px-6 py-5">Visits</th><th className="px-6 py-5">Loyalty</th><th className="px-6 py-5">Spend</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {customers.map((customer) => (
            <tr key={customer.id} onClick={() => setSelectedCustomer(customer)} className="cursor-pointer hover:bg-blue-50/50">
              <td className="px-6 py-5"><div className="font-extrabold">{customer.name}</div><div className="font-mono text-sm text-gray-400">{customer.id}</div></td>
              <td className="px-6 py-5 font-bold text-gray-600">{customer.mobile}</td>
              <td className="px-6 py-5 font-mono font-black">{customer.visits}</td>
              <td className="px-6 py-5 font-mono font-black text-warning">{customer.loyalty} pts</td>
              <td className="px-6 py-5 font-mono font-black text-brand">{inr(customer.spend)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
    <DetailDrawer open={Boolean(selectedCustomer)} onClose={() => setSelectedCustomer(null)} title={selectedCustomer?.name ?? "Customer Details"} subtitle={selectedCustomer?.id}>
      {selectedCustomer ? (
        <DetailGrid
          rows={[
            ["Mobile", selectedCustomer.mobile],
            ["Email", selectedCustomer.email],
            ["Last Visit", selectedCustomer.lastVisit],
            ["Visits", selectedCustomer.visits],
            ["Loyalty", `${selectedCustomer.loyalty} pts`],
            ["Total Spend", inr(selectedCustomer.spend)],
            ["Average Cart", inr(selectedCustomer.avgCart)],
            ["Risk", selectedCustomer.risk]
          ]}
        />
      ) : null}
    </DetailDrawer>
    </>
  );
}

export function BillingHistory({ filter = "all" }: { filter?: BillingFilter }) {
  const [localBills, setLocalBills] = useState(bills);
  const [selectedBill, setSelectedBill] = useState<(typeof bills)[number] | null>(null);
  const filteredBills = useMemo(() => {
    if (filter === "pending") return localBills.filter((bill) => bill.status !== "PAID");
    if (filter === "upi") return localBills.filter((bill) => bill.method === "UPI" && bill.status === "PAID");
    return localBills;
  }, [filter, localBills]);

  const title = filter === "pending" ? "Pending Payments" : filter === "upi" ? "UPI Transactions" : "Billing History";

  function verifyCashPayment(billId: string) {
    setLocalBills((currentBills) =>
      currentBills.map((bill) =>
        bill.id === billId
          ? {
              ...bill,
              status: "PAID",
              paymentStatus: "Cash verified by counter staff",
              exitStatus: "QR generated",
              reference: bill.reference.startsWith("CASH") ? `${bill.reference}-VERIFIED` : bill.reference
            }
          : bill
      )
    );
    setSelectedBill((bill) =>
      bill
        ? {
            ...bill,
            status: "PAID",
            paymentStatus: "Cash verified by counter staff",
            exitStatus: "QR generated",
            reference: bill.reference.startsWith("CASH") ? `${bill.reference}-VERIFIED` : bill.reference
          }
        : bill
    );
  }

  return (
    <>
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-7">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-extrabold"><CreditCard className="text-brand" /> {title}</h2>
          <p className="mt-2 text-sm font-bold text-gray-500">{filter === "upi" ? "Successful UPI payments completed today" : filter === "pending" ? "Payments waiting for customer or counter confirmation" : "All transactions and receipts"}</p>
        </div>
        <Badge className="bg-blue-50 text-brand">{filteredBills.length} records</Badge>
      </div>
      <table className="w-full min-w-[820px] text-left">
        <thead className="bg-gray-50 text-sm font-extrabold text-gray-500">
          <tr><th className="px-6 py-5">Bill ID</th><th className="px-6 py-5">Customer</th><th className="px-6 py-5">Method</th><th className="px-6 py-5">Total</th><th className="px-6 py-5">Status</th><th className="px-6 py-5">QR</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {filteredBills.map((bill) => (
            <tr key={bill.id} onClick={() => setSelectedBill(bill)} className="cursor-pointer hover:bg-blue-50/50">
              <td className="px-6 py-5 font-mono font-bold">{bill.id}<div className="text-sm text-gray-400">{bill.time}</div></td>
              <td className="px-6 py-5 font-bold">{bill.customer}</td>
              <td className="px-6 py-5 font-bold">{bill.method}</td>
              <td className="px-6 py-5 font-mono font-black text-brand">{inr(bill.total)}</td>
              <td className="px-6 py-5"><Badge className={bill.status === "PAID" ? "bg-emerald-50 text-success" : "bg-yellow-50 text-warning"}>{bill.status}</Badge></td>
              <td className="px-6 py-5"><span className="inline-flex rounded-2xl bg-purple-50 p-3 text-purple"><QrCode size={18} /></span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
    <DetailDrawer open={Boolean(selectedBill)} onClose={() => setSelectedBill(null)} title={selectedBill?.id ?? "Transaction Details"} subtitle={selectedBill ? `${selectedBill.customer} · ${selectedBill.time}` : undefined}>
      {selectedBill ? (
        <div className="space-y-6">
        <DetailGrid
          rows={[
            ["Customer", selectedBill.customer],
            ["Cart ID", selectedBill.cartId],
            ["Method", selectedBill.method],
            ["UPI ID", selectedBill.upiId],
            ["Reference", selectedBill.reference],
            ["Items", selectedBill.items],
            ["Amount", inr(selectedBill.total)],
            ["Payment Status", selectedBill.paymentStatus],
            ["Exit Status", selectedBill.exitStatus]
          ]}
        />
        {selectedBill.method === "CASH" && selectedBill.status !== "PAID" ? (
          <div className="rounded-[20px] border border-yellow-200 bg-yellow-50 p-5">
            <div className="text-lg font-extrabold text-amber-900">Counter cash verification</div>
            <p className="mt-2 text-sm font-bold leading-6 text-amber-800">
              Confirm only after staff physically receives ₹{selectedBill.total.toFixed(2)} at the counter. This enables receipt generation and exit QR.
            </p>
            <Button className="mt-5 w-full bg-success py-3 text-white" onClick={() => verifyCashPayment(selectedBill.id)}>
              Verify Cash Paid & Enable Exit QR
            </Button>
          </div>
        ) : selectedBill.method === "CASH" ? (
          <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold text-emerald-800">
            Cash payment verified by counter staff. Exit QR is enabled.
          </div>
        ) : null}
        </div>
      ) : null}
    </DetailDrawer>
    </>
  );
}

export function CashCounterVerification() {
  const [requests, setRequests] = useState<CashRequest[]>(fallbackCashRequests);
  const [selectedRequest, setSelectedRequest] = useState<CashRequest | null>(null);
  const [syncStatus, setSyncStatus] = useState("Listening for cash payment requests");
  const pendingCount = requests.filter((request) => request.status === "PENDING").length;

  async function loadRequests() {
    try {
      const { data } = await api.get("/counter/cash/pending");
      const remoteRequests = data.data as CashRequest[];
      setRequests(remoteRequests.length > 0 ? remoteRequests : fallbackCashRequests);
      setSyncStatus(remoteRequests.length > 0 ? "Live counter queue connected" : "No live request yet, showing demo counter token");
    } catch {
      setRequests((current) => (current.length > 0 ? current : fallbackCashRequests));
      setSyncStatus("Backend not connected, using demo counter queue");
    }
  }

  async function verifyRequest(request: CashRequest) {
    const verified: CashRequest = {
      ...request,
      status: "VERIFIED",
      verifiedAt: new Date().toISOString(),
      verifiedBy: request.staffName
    };

    try {
      const { data } = await api.put(`/counter/cash/${request.token}/verify`, { verifiedBy: request.staffName });
      syncRequest(data.data as CashRequest);
      setSyncStatus(`${request.staffName} verified ${request.token}. Customer app can generate receipt and exit QR.`);
    } catch {
      syncRequest(verified);
      setSyncStatus(`Cash verified locally for ${request.token}. Start backend for live customer sync.`);
    }
  }

  function syncRequest(updated: CashRequest) {
    setRequests((current) => {
      const exists = current.some((request) => request.token === updated.token);
      if (exists) return current.map((request) => (request.token === updated.token ? updated : request));
      return [updated, ...current];
    });
    setSelectedRequest((current) => (current?.token === updated.token ? updated : current));
  }

  useEffect(() => {
    loadRequests();
    const timer = window.setInterval(loadRequests, 2500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const socket = io(socketBaseUrl);
    socket.emit("admin:join");
    socket.on("counter:cash-requested", (request: CashRequest) => {
      syncRequest(request);
      setSyncStatus(`New cash token ${request.token} assigned to ${request.counterName} · ${request.staffName}`);
    });
    socket.on("counter:cash-verified", (request: CashRequest) => {
      syncRequest(request);
      setSyncStatus(`${request.token} verified by ${request.verifiedBy ?? request.staffName}`);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-yellow-50 text-warning"><Banknote /></div>
            <Badge className="bg-yellow-50 text-warning">{pendingCount} pending</Badge>
          </div>
          <div className="mt-6 font-mono text-4xl font-black text-ink">{pendingCount}</div>
          <div className="mt-1 text-sm font-extrabold text-gray-500">Cash approvals waiting</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-success"><CheckCircle2 /></div>
            <Badge className="bg-emerald-50 text-success">verified</Badge>
          </div>
          <div className="mt-6 font-mono text-4xl font-black text-ink">{requests.filter((request) => request.status === "VERIFIED").length}</div>
          <div className="mt-1 text-sm font-extrabold text-gray-500">Confirmed by counter staff</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-brand"><RefreshCw /></div>
            <Badge className="bg-blue-50 text-brand">auto refresh</Badge>
          </div>
          <div className="mt-6 text-lg font-extrabold text-ink">{syncStatus}</div>
          <div className="mt-1 text-sm font-bold text-gray-500">Updates every 2.5 seconds</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 p-7 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-extrabold"><Banknote className="text-warning" /> Cash Counter Queue</h2>
            <p className="mt-2 text-sm font-bold text-gray-500">Verify only after the worker physically receives the full cash amount.</p>
          </div>
          <Button className="bg-blue-50 text-brand" onClick={loadRequests}><RefreshCw size={16} /> Refresh</Button>
        </div>
        <table className="w-full min-w-[900px] text-left">
          <thead className="bg-gray-50 text-sm font-extrabold text-gray-500">
            <tr><th className="px-6 py-5">Token</th><th className="px-6 py-5">Customer</th><th className="px-6 py-5">Counter / Staff</th><th className="px-6 py-5">Cart</th><th className="px-6 py-5">Amount</th><th className="px-6 py-5">Status</th><th className="px-6 py-5">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.map((request) => (
              <tr key={request.token} onClick={() => setSelectedRequest(request)} className="cursor-pointer hover:bg-blue-50/50">
                <td className="px-6 py-5">
                  <div className="font-mono text-lg font-black">{request.token}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs font-bold text-gray-400"><Clock3 size={13} /> notified {cashTime(request.notifiedAt)}</div>
                </td>
                <td className="px-6 py-5 font-bold">{request.customerName}</td>
                <td className="px-6 py-5">
                  <div className="font-extrabold">{request.counterName} · {request.queueNo}</div>
                  <div className="text-sm font-bold text-gray-500">{request.staffName} · {request.counterLocation}</div>
                </td>
                <td className="px-6 py-5 font-mono font-bold">{request.cartId}</td>
                <td className="px-6 py-5 font-mono text-lg font-black text-brand">{inr(request.amount)}</td>
                <td className="px-6 py-5">
                  <Badge className={request.status === "VERIFIED" ? "bg-emerald-50 text-success" : "bg-yellow-50 text-warning"}>
                    {request.status === "VERIFIED" ? "CASH VERIFIED" : "WAITING FOR CASH"}
                  </Badge>
                </td>
                <td className="px-6 py-5">
                  <Button
                    disabled={request.status === "VERIFIED"}
                    className={request.status === "VERIFIED" ? "bg-emerald-50 text-success" : "bg-success text-white"}
                    onClick={(event) => {
                      event.stopPropagation();
                      verifyRequest(request);
                    }}
                  >
                    <CheckCircle2 size={16} /> {request.status === "VERIFIED" ? "Verified" : "Verify Paid"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <DetailDrawer open={Boolean(selectedRequest)} onClose={() => setSelectedRequest(null)} title={selectedRequest?.token ?? "Cash Request"} subtitle={selectedRequest ? `${selectedRequest.customerName} · ${selectedRequest.cartId}` : undefined}>
        {selectedRequest ? (
          <div className="space-y-6">
            <DetailGrid
              rows={[
                ["Token", selectedRequest.token],
                ["Customer", selectedRequest.customerName],
                ["Cart ID", selectedRequest.cartId],
                ["Assigned Counter", `${selectedRequest.counterName} · ${selectedRequest.counterLocation}`],
                ["Counter Staff", `${selectedRequest.staffName} (${selectedRequest.staffId})`],
                ["Queue No", selectedRequest.queueNo],
                ["Amount to Collect", inr(selectedRequest.amount)],
                ["Status", <Badge className={selectedRequest.status === "VERIFIED" ? "bg-emerald-50 text-success" : "bg-yellow-50 text-warning"}>{selectedRequest.status}</Badge>],
                ["Notified At", cashTime(selectedRequest.notifiedAt)],
                ["Verified By", selectedRequest.verifiedBy ?? "Pending"],
                ["Verified At", selectedRequest.verifiedAt ? cashTime(selectedRequest.verifiedAt) : "Pending"]
              ]}
            />
            {selectedRequest.status === "PENDING" ? (
              <div className="rounded-[20px] border border-yellow-200 bg-yellow-50 p-5">
                <div className="text-lg font-extrabold text-amber-900">Counter worker step</div>
                <p className="mt-2 text-sm font-bold leading-6 text-amber-800">
                  {selectedRequest.staffName} should match the customer token at {selectedRequest.counterName}, collect exactly {inr(selectedRequest.amount)}, then approve. The customer app will move to payment success after this.
                </p>
                <Button className="mt-5 w-full bg-success py-3 text-white" onClick={() => verifyRequest(selectedRequest)}>
                  <CheckCircle2 size={18} /> Cash Received, Approve Customer
                </Button>
              </div>
            ) : (
              <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold leading-6 text-emerald-800">
                Cash has been verified. Receipt generation and exit QR are enabled for this customer.
              </div>
            )}
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}

export function LowStockAlerts() {
  return (
    <div className="space-y-4">
      {products.filter((product) => product.stock < 50).map((product) => (
        <Card key={product.id} className="flex items-center gap-5 border-red-200 bg-red-50 p-5 text-red-800">
          <img src={product.image} className="h-16 w-16 rounded-2xl object-cover" alt={product.name} />
          <AlertTriangle />
          <div className="flex-1">
            <div className="text-lg font-extrabold">{product.name} needs reorder</div>
            <div className="text-sm font-bold">Stock {product.stock} · Minimum {product.min} · {product.supplier}</div>
          </div>
          <Button className="bg-danger text-white">Reorder</Button>
        </Card>
      ))}
    </div>
  );
}
