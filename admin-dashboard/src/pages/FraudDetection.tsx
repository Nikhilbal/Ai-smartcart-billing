import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { useState } from "react";
import { Card, Badge, Button } from "../components/ui";
import { DetailDrawer, DetailGrid } from "../components/DetailDrawer";
import { fraudEvents } from "../data/mock";
import { cn } from "../lib/utils";

function riskTone(risk: string) {
  if (risk === "HIGH") return "bg-red-50 text-danger";
  if (risk === "MED") return "bg-yellow-50 text-warning";
  return "bg-emerald-50 text-success";
}

export function FraudDetection() {
  const [selectedEvent, setSelectedEvent] = useState<(typeof fraudEvents)[number] | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-emerald-50 p-7 text-center">
          <div className="text-4xl font-black text-success">98.1%</div>
          <div className="mt-2 font-bold text-gray-500">Detection Rate</div>
        </Card>
        <button type="button" onClick={() => setSelectedEvent(fraudEvents[0])} className="text-left">
        <Card className="bg-red-50 p-7 text-center transition hover:-translate-y-1 hover:border-danger/30">
          <div className="text-4xl font-black text-danger">5</div>
          <div className="mt-2 font-bold text-gray-500">Incidents (24h)</div>
        </Card>
        </button>
        <Card className="bg-blue-50 p-7 text-center">
          <div className="text-4xl font-black text-brand">4m</div>
          <div className="mt-2 font-bold text-gray-500">Avg Resolution</div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between p-7">
          <h2 className="text-2xl font-extrabold">Fraud Incidents (Past 24h)</h2>
          <Badge className="bg-danger text-white">5 active</Badge>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-gray-50 text-sm font-extrabold text-gray-500">
              <tr>
                <th className="px-6 py-5">ID</th>
                <th className="px-6 py-5">Time</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Risk</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {fraudEvents.map((event) => (
                <tr key={event.id} onClick={() => setSelectedEvent(event)} className="cursor-pointer hover:bg-red-50/40">
                  <td className="px-6 py-5 font-mono font-bold text-gray-600">{event.id}</td>
                  <td className="px-6 py-5 text-lg font-bold text-gray-600">{event.time}</td>
                  <td className="px-6 py-5">
                    <div className="text-lg font-extrabold">{event.type}</div>
                    <div className="mt-1 text-sm font-semibold text-gray-500">{event.detail}</div>
                  </td>
                  <td className="px-6 py-5 text-base font-bold text-gray-600">{event.customer}</td>
                  <td className="px-6 py-5"><Badge className={riskTone(event.risk)}>{event.risk}</Badge></td>
                  <td className="px-6 py-5"><Badge className={cn(event.status === "RESOLVED" ? "bg-emerald-50 text-success" : "bg-red-50 text-danger")}>{event.status}</Badge></td>
                  <td className="px-6 py-5">
                    <div className="flex gap-3">
                      <Button className="bg-emerald-50 p-3 text-success" onClick={(clickEvent) => clickEvent.stopPropagation()}><CheckCircle2 size={18} /></Button>
                      <Button className="bg-red-50 p-3 text-danger" onClick={(clickEvent) => clickEvent.stopPropagation()}><XCircle size={18} /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-7">
        <h2 className="mb-7 flex items-center gap-3 text-2xl font-extrabold">
          <ShieldAlert className="text-danger" /> Fraud Type Breakdown
        </h2>
        {[
          ["Weight Mismatch", 67, "bg-danger"],
          ["Card Velocity", 18, "bg-warning"],
          ["Barcode Swap", 10, "bg-purple"],
          ["Multiple OTP", 5, "bg-brand"]
        ].map(([label, value, color]) => (
          <div key={label as string} className="mb-5">
            <div className="mb-2 flex justify-between text-base font-bold text-gray-600">
              <span>{label}</span>
              <span>{value}%</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100">
              <div className={cn("h-full rounded-full", color as string)} style={{ width: `${value}%` }} />
            </div>
          </div>
        ))}
      </Card>
      <DetailDrawer open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)} title={selectedEvent?.type ?? "Fraud Incident"} subtitle={selectedEvent ? `${selectedEvent.id} · ${selectedEvent.time}` : undefined}>
        {selectedEvent ? (
          <div className="space-y-6">
            <DetailGrid
              rows={[
                ["Customer", selectedEvent.customer],
                ["Cart ID", selectedEvent.cartId],
                ["Risk", <Badge className={riskTone(selectedEvent.risk)}>{selectedEvent.risk}</Badge>],
                ["Status", <Badge className={selectedEvent.status === "RESOLVED" ? "bg-emerald-50 text-success" : "bg-red-50 text-danger"}>{selectedEvent.status}</Badge>],
                ["Expected Weight", selectedEvent.expected],
                ["Actual Weight", selectedEvent.actual],
                ["Variance", selectedEvent.variance],
                ["Action Taken", selectedEvent.action]
              ]}
            />
            <div className="rounded-[20px] border border-yellow-200 bg-yellow-50 p-5">
              <div className="text-sm font-extrabold text-amber-700">Incident Information</div>
              <p className="mt-2 text-sm font-bold leading-6 text-amber-900">{selectedEvent.detail}. {selectedEvent.notes}</p>
            </div>
          </div>
        ) : null}
      </DetailDrawer>
    </div>
  );
}
