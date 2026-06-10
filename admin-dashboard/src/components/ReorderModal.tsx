import { CalendarClock, PackagePlus, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "../data/mock";
import { inr } from "../lib/utils";
import { makeReorderRequest, recommendedReorderQuantity, type ReorderRequest } from "../types/reorder";
import { Badge, Button, Card, Input } from "./ui";
import { DetailGrid } from "./DetailDrawer";

type Props = {
  product: Product | null;
  onClose: () => void;
  onCreate: (request: ReorderRequest) => void;
};

export function ReorderModal({ product, onClose, onCreate }: Props) {
  const defaultQty = product ? recommendedReorderQuantity(product) : 50;
  const [quantity, setQuantity] = useState(defaultQty);
  const [priority, setPriority] = useState<"NORMAL" | "URGENT">("URGENT");
  const [supplierName, setSupplierName] = useState(product?.supplier ?? "");
  const [supplierPhone, setSupplierPhone] = useState(product?.supplierPhone ?? "");
  const [notes, setNotes] = useState("Auto reorder from low-stock alert. Confirm availability and dispatch to Mumbai - Vile Parle store.");

  useEffect(() => {
    setQuantity(defaultQty);
    setPriority(product?.status === "CRITICAL" ? "URGENT" : "NORMAL");
    setSupplierName(product?.supplier ?? "");
    setSupplierPhone(product?.supplierPhone ?? "");
  }, [defaultQty, product?.status, product?.supplier, product?.supplierPhone]);

  if (!product) return null;

  const estimatedTotal = quantity * product.price;
  const expectedDays = priority === "URGENT" ? "1 day" : "3 days";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-4xl overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-danger">
              <PackagePlus size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold">Create Reorder Request</h2>
              <p className="mt-1 text-sm font-bold text-gray-500">Purchase order will be sent to supplier after manager approval.</p>
            </div>
          </div>
          <Badge className={product.status === "CRITICAL" ? "bg-red-50 text-danger" : "bg-yellow-50 text-warning"}>{product.status} STOCK</Badge>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="space-y-5">
            <div className="flex items-center gap-4 rounded-[20px] border border-border bg-gray-50 p-4">
              <img src={product.image} alt={product.name} className="h-20 w-20 rounded-2xl object-cover" />
              <div className="min-w-0">
                <div className="text-xl font-extrabold">{product.name}</div>
                <div className="mt-1 font-mono text-sm text-gray-500">{product.barcode}</div>
                <div className="mt-2 text-sm font-bold text-gray-600">Supplier: {supplierName || product.supplier}</div>
                <div className="mt-1 font-mono text-xs font-bold text-gray-400">{supplierPhone || "No supplier number"}</div>
              </div>
            </div>

            <DetailGrid
              rows={[
                ["Current Stock", `${product.stock} units`],
                ["Minimum Required", `${product.min} units`],
                ["Shortfall", `${Math.max(0, product.min - product.stock)} units`],
                ["Suggested Reorder", `${recommendedReorderQuantity(product)} units`],
                ["Unit Price", inr(product.price)]
              ]}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-gray-600">Supplier Name</span>
                <Input value={supplierName} onChange={(event) => setSupplierName(event.target.value)} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-gray-600">Supplier Phone</span>
                <Input value={supplierPhone} onChange={(event) => setSupplierPhone(event.target.value)} placeholder="+91 98765 43210" />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-gray-600">Required Reorder Quantity</span>
                <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold text-gray-600">Priority</span>
                <div className="grid grid-cols-2 rounded-2xl border border-border bg-gray-50 p-1">
                  {(["URGENT", "NORMAL"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPriority(option)}
                      className={priority === option ? "rounded-xl bg-white px-4 py-3 text-sm font-black text-brand shadow-soft" : "px-4 py-3 text-sm font-black text-gray-500"}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-gray-600">Supplier Note</span>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="min-h-[110px] w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm font-bold outline-none ring-brand/20 transition focus:ring-4"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] border border-blue-100 bg-blue-50 p-5">
              <div className="flex items-center gap-2 text-lg font-extrabold text-brand">
                <Truck size={22} /> Reorder Process
              </div>
              <div className="mt-4 space-y-3 text-sm font-bold text-blue-900">
                <div>1. Request is created from low-stock alert.</div>
                <div>2. Store manager approves purchase order.</div>
                <div>3. Supplier confirms and dispatches stock.</div>
                <div>4. Inventory staff receives stock and updates quantity.</div>
              </div>
            </div>

            <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 text-lg font-extrabold text-emerald-800">
                <CalendarClock size={21} /> Order Summary
              </div>
              <DetailGrid
                rows={[
                  ["Supplier", supplierName || product.supplier],
                  ["Contact", supplierPhone || "Not available"],
                  ["Required Quantity", `${quantity} units`],
                  ["Estimated Value", inr(estimatedTotal)],
                  ["Delivery SLA", expectedDays],
                  ["Created By", "Priya Singh"],
                  ["Status", <Badge className="bg-blue-100 text-brand">REQUESTED</Badge>]
                ]}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border p-6 sm:flex-row sm:justify-end">
          <Button className="border border-border bg-white text-gray-700" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-danger px-6 py-3 text-white" onClick={() => onCreate(makeReorderRequest(product, quantity, priority, notes, supplierName || product.supplier, supplierPhone))}>
            Create Purchase Order
          </Button>
        </div>
      </Card>
    </div>
  );
}
