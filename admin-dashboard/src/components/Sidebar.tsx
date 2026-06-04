import { Banknote, BarChart3, Boxes, ClipboardCheck, CreditCard, Grid2X2, LogOut, RadioTower, Shield, Users } from "lucide-react";
import { cn } from "../lib/utils";

export type PageKey = "dashboard" | "inventory" | "fraud" | "carts" | "sales" | "customers" | "billing" | "counter" | "reorders";

const items = [
  { key: "dashboard", label: "Dashboard", icon: Grid2X2 },
  { key: "inventory", label: "Inventory", icon: Boxes, count: 4 },
  { key: "reorders", label: "Reorders", icon: ClipboardCheck },
  { key: "fraud", label: "Fraud Detection", icon: Shield },
  { key: "carts", label: "Live Carts", icon: RadioTower },
  { key: "counter", label: "Payment Approvals", icon: Banknote, count: 2 },
  { key: "sales", label: "Sales Analytics", icon: BarChart3 },
  { key: "customers", label: "Customers", icon: Users },
  { key: "billing", label: "Billing History", icon: CreditCard }
] as const;

type Props = {
  active: PageKey;
  onChange: (page: PageKey) => void;
  onLogout: () => void;
};

export function Sidebar({ active, onChange, onLogout }: Props) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[320px] shrink-0 border-r border-border bg-white lg:flex lg:flex-col">
      <div className="flex items-center gap-4 p-7">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-2xl text-white shadow-soft">🛒</div>
        <div>
          <div className="text-lg font-extrabold text-ink">Smart Cart</div>
          <div className="text-sm font-semibold text-gray-500">Admin Panel</div>
        </div>
      </div>

      <div className="mx-6 rounded-[18px] bg-gray-50 p-5">
        <div className="font-bold text-gray-700">Priya Singh</div>
        <div className="mt-1 text-sm font-semibold text-gray-500">Store Manager · Mumbai</div>
      </div>

      <nav className="mt-10 space-y-2 px-5">
        {items.map((item) => {
          const Icon = item.icon;
          const selected = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={cn(
                "flex w-full items-center justify-between rounded-[18px] px-5 py-4 text-left text-base font-extrabold transition",
                selected ? "bg-blue-50 text-brand ring-2 ring-brand/10" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              )}
            >
              <span className="flex items-center gap-4">
                <Icon size={22} />
                {item.label}
              </span>
              {"count" in item && <span className="rounded-full bg-danger px-2 py-0.5 text-xs text-white">{item.count}</span>}
            </button>
          );
        })}
      </nav>

      <button onClick={onLogout} className="mt-auto flex items-center gap-3 px-8 py-8 text-base font-extrabold text-danger">
        <LogOut size={20} />
        Logout
      </button>
    </aside>
  );
}
