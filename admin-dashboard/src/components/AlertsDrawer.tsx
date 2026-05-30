import { AlertTriangle, PackageCheck } from "lucide-react";
import { alerts } from "../data/mock";
import { cn } from "../lib/utils";
import { DetailDrawer, DetailGrid } from "./DetailDrawer";
import { Badge, Button } from "./ui";
import type { Product } from "../data/mock";
import type { ReorderRequest } from "../types/reorder";

type Props = {
  open: boolean;
  onClose: () => void;
  onInventory: () => void;
  onReorder: (product: Product) => void;
  onReorders: () => void;
  reorderRequests: ReorderRequest[];
};

export function AlertsDrawer({ open, onClose, onInventory, onReorder, onReorders, reorderRequests }: Props) {
  const openReorders = reorderRequests.filter((request) => request.status !== "RECEIVED");

  return (
    <DetailDrawer open={open} onClose={onClose} title="Admin Alerts" subtitle={`${alerts.length} stock alerts need attention`}>
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-6 text-center">
            <PackageCheck className="mx-auto text-success" size={36} />
            <div className="mt-3 text-lg font-extrabold text-emerald-800">No low-stock alerts</div>
            <p className="mt-2 text-sm font-bold text-emerald-700">All products are above the minimum stock level.</p>
          </div>
        ) : null}

        {alerts.map((alert) => {
          const existingRequest = openReorders.find((request) => request.productId === alert.product.id);
          return (
          <div key={alert.id} className={cn("rounded-[22px] border p-5", alert.severity === "CRITICAL" ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50")}>
            <div className="flex items-start gap-4">
              <img src={alert.product.image} className="h-16 w-16 rounded-2xl object-cover" alt={alert.product.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AlertTriangle className={alert.severity === "CRITICAL" ? "text-danger" : "text-warning"} size={18} />
                  <h3 className="text-base font-extrabold text-ink">{alert.text}</h3>
                  <Badge className={alert.severity === "CRITICAL" ? "bg-red-100 text-danger" : "bg-yellow-100 text-warning"}>{alert.severity}</Badge>
                </div>
                <p className="mt-2 text-sm font-bold text-gray-600">Supplier: {alert.product.supplier}</p>
                {existingRequest ? <p className="mt-2 font-mono text-xs font-black text-brand">Purchase order {existingRequest.id} is {existingRequest.status}</p> : null}
              </div>
            </div>
            <div className="mt-4">
              <DetailGrid
                rows={[
                  ["Product", alert.product.name],
                  ["Current Stock", `${alert.product.stock} units`],
                  ["Minimum Stock", `${alert.product.min} units`],
                  ["Shortfall", `${alert.product.min - alert.product.stock} units`],
                  ["Category", alert.product.category],
                  ["Action", alert.action]
                ]}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Button className="border border-border bg-white py-3 text-gray-700" onClick={onInventory}>
                Open Inventory
              </Button>
              {existingRequest ? (
                <Button className="bg-brand py-3 text-white" onClick={onReorders}>
                  Track Purchase Order
                </Button>
              ) : (
                <Button className="bg-danger py-3 text-white" onClick={() => onReorder(alert.product)}>
                  Reorder Stock
                </Button>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </DetailDrawer>
  );
}
