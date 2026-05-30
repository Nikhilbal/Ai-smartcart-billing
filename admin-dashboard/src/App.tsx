import { useState } from "react";
import { AlertsDrawer } from "./components/AlertsDrawer";
import { Header } from "./components/Header";
import { ReorderModal } from "./components/ReorderModal";
import { PageKey, Sidebar } from "./components/Sidebar";
import { alerts, type Product } from "./data/mock";
import { AdminLogin } from "./pages/AdminLogin";
import { DashboardOverview } from "./pages/DashboardOverview";
import { FraudDetection } from "./pages/FraudDetection";
import { InventoryManagement } from "./pages/InventoryManagement";
import { BillingHistory, CartMonitoring, CashCounterVerification, CustomerManagement, SalesAnalytics } from "./pages/OperationalPages";
import { ReorderManagement } from "./pages/ReorderManagement";
import type { ReorderRequest, ReorderStatus } from "./types/reorder";

export type BillingFilter = "all" | "pending" | "upi";

function renderPage(
  page: PageKey,
  navigate: (page: PageKey, filter?: BillingFilter) => void,
  billingFilter: BillingFilter,
  onReorder: (product: Product) => void,
  reorderRequests: ReorderRequest[],
  onReorderStatusChange: (id: string, status: ReorderStatus) => void
) {
  switch (page) {
    case "inventory":
      return <InventoryManagement onReorder={onReorder} />;
    case "reorders":
      return <ReorderManagement requests={reorderRequests} onStatusChange={onReorderStatusChange} />;
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
      return <DashboardOverview onNavigate={navigate} onReorder={onReorder} reorderRequests={reorderRequests} />;
  }
}

export default function App() {
  const [active, setActive] = useState<PageKey>("dashboard");
  const [loggedIn, setLoggedIn] = useState(false);
  const [billingFilter, setBillingFilter] = useState<BillingFilter>("all");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [reorderProduct, setReorderProduct] = useState<Product | null>(null);
  const [reorderRequests, setReorderRequests] = useState<ReorderRequest[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  function navigate(page: PageKey, filter: BillingFilter = "all") {
    setActive(page);
    setBillingFilter(page === "billing" ? filter : "all");
  }

  function createReorder(request: ReorderRequest) {
    setReorderRequests((current) => {
      const existingOpen = current.find((item) => item.productId === request.productId && item.status !== "RECEIVED");
      if (existingOpen) return current;
      return [request, ...current];
    });
    setReorderProduct(null);
    setAlertsOpen(false);
    setActive("reorders");
    setToast(`Purchase order ${request.id} created for ${request.productName}`);
    window.setTimeout(() => setToast(null), 3600);
  }

  function updateReorderStatus(id: string, status: ReorderStatus) {
    setReorderRequests((current) => current.map((request) => (request.id === id ? { ...request, status } : request)));
    setToast(status === "RECEIVED" ? `Purchase order ${id} received. Inventory can now be updated.` : `Purchase order ${id} moved to ${status}`);
    window.setTimeout(() => setToast(null), 3600);
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
          <div className="mx-auto max-w-[1720px] p-6 md:p-9">{renderPage(active, navigate, billingFilter, setReorderProduct, reorderRequests, updateReorderStatus)}</div>
        </main>
        <AlertsDrawer
          open={alertsOpen}
          onClose={() => setAlertsOpen(false)}
          onInventory={() => {
            setAlertsOpen(false);
            navigate("inventory");
          }}
          onReorder={setReorderProduct}
          onReorders={() => {
            setAlertsOpen(false);
            navigate("reorders");
          }}
          reorderRequests={reorderRequests}
        />
        <ReorderModal product={reorderProduct} onClose={() => setReorderProduct(null)} onCreate={createReorder} />
        {toast ? <div className="fixed bottom-6 right-6 z-[60] rounded-2xl bg-ink px-5 py-4 text-sm font-extrabold text-white shadow-soft">{toast}</div> : null}
      </div>
    </div>
  );
}
