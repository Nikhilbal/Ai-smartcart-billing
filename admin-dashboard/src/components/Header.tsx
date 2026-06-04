import { Bell, Menu, Users } from "lucide-react";
import { PageKey } from "./Sidebar";

const titles: Record<PageKey, string> = {
  dashboard: "Dashboard Overview",
  inventory: "Inventory Management",
  reorders: "Reorder Management",
  fraud: "Fraud Detection",
  carts: "Real-time Cart Monitoring",
  counter: "Payment Approval Desk",
  sales: "Sales Analytics",
  customers: "Customer Management",
  billing: "Billing History"
};

type Props = {
  active: PageKey;
  alertCount?: number;
  onMenu?: () => void;
  onNotifications?: () => void;
};

export function Header({ active, alertCount = 0, onMenu, onNotifications }: Props) {
  return (
    <header className="sticky top-0 z-20 flex min-h-[110px] items-center justify-between border-b border-border bg-white/95 px-6 backdrop-blur md:px-10">
      <div className="flex items-center gap-4">
        <button className="grid h-11 w-11 place-items-center rounded-2xl bg-gray-100 lg:hidden" onClick={onMenu}>
          <Menu size={22} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-normal text-ink md:text-3xl">{titles[active]}</h1>
          <p className="mt-2 text-sm font-semibold text-gray-500 md:text-base">Smart Supermarket · Mumbai - Vile Parle · 27-05-2026</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative grid h-12 w-12 place-items-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-red-50 hover:text-danger" onClick={onNotifications}>
          <Bell size={23} />
          {alertCount > 0 ? (
            <>
              <span className="absolute right-2 top-2 h-3 w-3 rounded-full bg-danger" />
              <span className="absolute -right-2 -top-2 rounded-full bg-danger px-2 py-0.5 text-xs font-black text-white">{alertCount}</span>
            </>
          ) : null}
        </button>
        <button className="grid h-12 w-12 place-items-center rounded-full bg-brand text-white">
          <Users size={23} />
        </button>
      </div>
    </header>
  );
}
