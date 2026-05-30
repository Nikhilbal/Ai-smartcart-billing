import { CheckCircle2, ClipboardCheck, PackageCheck, Truck } from "lucide-react";
import { useState } from "react";
import { cn, inr } from "../lib/utils";
import { Badge, Button, Card } from "../components/ui";
import { DetailDrawer, DetailGrid } from "../components/DetailDrawer";
import type { ReorderRequest, ReorderStatus } from "../types/reorder";

const statusSteps: ReorderStatus[] = ["REQUESTED", "APPROVED", "ORDERED", "RECEIVED"];

function statusTone(status: ReorderStatus) {
  if (status === "RECEIVED") return "bg-emerald-50 text-success";
  if (status === "ORDERED") return "bg-purple-50 text-purple";
  if (status === "APPROVED") return "bg-blue-50 text-brand";
  return "bg-yellow-50 text-warning";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function nextStatus(status: ReorderStatus): ReorderStatus {
  const index = statusSteps.indexOf(status);
  return statusSteps[Math.min(index + 1, statusSteps.length - 1)];
}

type Props = {
  requests: ReorderRequest[];
  onStatusChange: (id: string, status: ReorderStatus) => void;
};

export function ReorderManagement({ requests, onStatusChange }: Props) {
  const [selected, setSelected] = useState<ReorderRequest | null>(null);
  const openCount = requests.filter((request) => request.status !== "RECEIVED").length;

  return (
    <>
      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-4">
          <Card className="p-5">
            <div className="text-sm font-extrabold text-gray-500">Open POs</div>
            <div className="mt-3 font-mono text-3xl font-black text-brand">{openCount}</div>
          </Card>
          <Card className="p-5">
            <div className="text-sm font-extrabold text-gray-500">Requested Value</div>
            <div className="mt-3 font-mono text-3xl font-black text-ink">{inr(requests.reduce((sum, request) => sum + request.estimatedTotal, 0))}</div>
          </Card>
          <Card className="p-5">
            <div className="text-sm font-extrabold text-gray-500">Urgent</div>
            <div className="mt-3 font-mono text-3xl font-black text-danger">{requests.filter((request) => request.priority === "URGENT").length}</div>
          </Card>
          <Card className="p-5">
            <div className="text-sm font-extrabold text-gray-500">Received</div>
            <div className="mt-3 font-mono text-3xl font-black text-success">{requests.filter((request) => request.status === "RECEIVED").length}</div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-7 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="flex items-center gap-3 text-2xl font-extrabold">
                <ClipboardCheck className="text-brand" /> Reorder Purchase Orders
              </h2>
              <p className="mt-2 text-sm font-bold text-gray-500">Track low-stock requests from reorder to stock received.</p>
            </div>
            <Badge className="bg-blue-50 text-brand">{requests.length} requests</Badge>
          </div>

          {requests.length === 0 ? (
            <div className="p-10 text-center">
              <PackageCheck className="mx-auto text-success" size={42} />
              <h3 className="mt-4 text-xl font-extrabold">No reorder requests yet</h3>
              <p className="mt-2 text-sm font-bold text-gray-500">Click Reorder from a low-stock alert to create the first purchase order.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] text-left">
                <thead className="bg-gray-50 text-sm font-extrabold text-gray-500">
                  <tr>
                    <th className="px-6 py-5">PO</th>
                    <th className="px-6 py-5">Product</th>
                    <th className="px-6 py-5">Supplier</th>
                    <th className="px-6 py-5">Qty</th>
                    <th className="px-6 py-5">Value</th>
                    <th className="px-6 py-5">Delivery</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-blue-50/40">
                      <td className="px-6 py-5 font-mono font-black">{request.id}</td>
                      <td className="px-6 py-5">
                        <button type="button" onClick={() => setSelected(request)} className="flex items-center gap-3 text-left">
                          <img src={request.image} alt={request.productName} className="h-14 w-14 rounded-2xl object-cover" />
                          <span>
                            <span className="block font-extrabold">{request.productName}</span>
                            <span className="font-mono text-sm text-gray-400">{request.barcode}</span>
                          </span>
                        </button>
                      </td>
                      <td className="px-6 py-5 font-bold text-gray-600">{request.supplier}</td>
                      <td className="px-6 py-5 font-mono font-black">{request.orderQuantity}</td>
                      <td className="px-6 py-5 font-mono font-black text-brand">{inr(request.estimatedTotal)}</td>
                      <td className="px-6 py-5 font-bold text-gray-600">{formatDate(request.expectedDelivery)}</td>
                      <td className="px-6 py-5">
                        <Badge className={cn(statusTone(request.status), "text-sm")}>{request.status}</Badge>
                      </td>
                      <td className="px-6 py-5">
                        {request.status === "RECEIVED" ? (
                          <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-sm font-black text-success">
                            <CheckCircle2 size={17} /> Done
                          </span>
                        ) : (
                          <Button className="bg-brand text-white" onClick={() => onStatusChange(request.id, nextStatus(request.status))}>
                            Move to {nextStatus(request.status)}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <DetailDrawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.id ?? "Purchase Order"} subtitle={selected?.productName}>
        {selected ? (
          <div className="space-y-6">
            <DetailGrid
              rows={[
                ["Product", selected.productName],
                ["Supplier", selected.supplier],
                ["Current Stock", `${selected.currentStock} units`],
                ["Minimum Stock", `${selected.minStock} units`],
                ["Order Quantity", `${selected.orderQuantity} units`],
                ["Estimated Value", inr(selected.estimatedTotal)],
                ["Priority", selected.priority],
                ["Status", <Badge className={statusTone(selected.status)}>{selected.status}</Badge>],
                ["Requested By", selected.requestedBy],
                ["Requested At", formatDate(selected.requestedAt)],
                ["Expected Delivery", formatDate(selected.expectedDelivery)]
              ]}
            />
            <div className="rounded-[20px] border border-blue-100 bg-blue-50 p-5">
              <div className="mb-3 flex items-center gap-2 text-lg font-extrabold text-brand">
                <Truck size={21} /> Workflow
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                {statusSteps.map((step) => (
                  <div key={step} className={cn("rounded-2xl border p-4 text-center text-sm font-black", statusSteps.indexOf(step) <= statusSteps.indexOf(selected.status) ? "border-emerald-200 bg-emerald-50 text-success" : "border-border bg-white text-gray-400")}>
                    {step}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[20px] border border-border bg-gray-50 p-5 text-sm font-bold leading-6 text-gray-700">{selected.notes}</div>
          </div>
        ) : null}
      </DetailDrawer>
    </>
  );
}
