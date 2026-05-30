import { useState } from "react";
import { AlertsDrawer } from "./components/AlertsDrawer";
import { Header } from "./components/Header";
import { PageKey, Sidebar } from "./components/Sidebar";
import { alerts } from "./data/mock";
import { AdminLogin } from "./pages/AdminLogin";
import { DashboardOverview } from "./pages/DashboardOverview";
import { FraudDetection } from "./pages/FraudDetection";
import { InventoryManagement } from "./pages/InventoryManagement";
import { BillingHistory, CartMonitoring, CashCounterVerification, CustomerManagement, SalesAnalytics } from "./pages/OperationalPages";

export type BillingFilter = "all" | "pending" | "upi";

function renderPage(page: PageKey, navigate: (page: PageKey, filter?: BillingFilter) => void, billingFilter: BillingFilter) {
  switch (page) {
    case "inventory":
      return <InventoryManagement />;
    case "fraud":
      return <FraudDetection />;
    case "carts":
      return <CartMonitoring />;
    case "counter":
      return <CashCounterVerification />;
    case "sales":
      return <SalesAnalytics onNavigate={navigate} />;
    case "customers":
      return <CustomerManagement />;
    case "billing":
      return <BillingHistory filter={billingFilter} />;
    default:
      return <DashboardOverview onNavigate={navigate} />;
  }
}

export default function App() {
  const [active, setActive] = useState<PageKey>("dashboard");
  const [loggedIn, setLoggedIn] = useState(false);
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("all");
  const [alertsOpen, setAlertsOpen] = useState(false);

  function navigate(page: PageKey, filter: BillingFilter = "all") {
    setActive(page);
    setBillingFilter(page === "billing" ? filter : "all");
  }

  if (!loggedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="flex">
        <Sidebar active={active} onChange={(page) => navigate(page)} onLogout={() => setLoggedIn(false)} />
        <main className="min-w-0 flex-1">
          <Header active={active} alertCount={alerts.length} onNotifications={() => setAlertsOpen(true)} />
          <div className="mx-auto max-w-[1720px] p-6 md:p-9">{renderPage(active, navigate, billingFilter)}</div>
        </main>
        <AlertsDrawer
          open={alertsOpen}
          onClose={() => setAlertsOpen(false)}
          onInventory={() => {
            setAlertsOpen(false);
            navigate("inventory");
          }}
        />
      </div>
    </div>
  );
}
