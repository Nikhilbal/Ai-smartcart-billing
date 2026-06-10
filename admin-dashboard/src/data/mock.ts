export type Product = {
  id: string;
  name: string;
  barcode: string;
  category: string;
  price: number;
  mrp?: number;
  discount?: number;
  gstRate?: number;
  gstMode?: "INCLUSIVE" | "EXCLUSIVE";
  weightKg?: number;
  stock: number;
  min: number;
  status: "OK" | "LOW" | "CRITICAL";
  supplier: string;
  supplierPhone?: string;
  image: string;
  sku?: string;
  description?: string;
};

export const productImages = {
  bread: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
  milk: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=80",
  eggs: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80",
  rice: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80",
  oil: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80",
  butter: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=500&q=80",
  tea: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=500&q=80",
  honey: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=500&q=80",
  biscuits: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=500&q=80",
  curd: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80",
  sauce: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?auto=format&fit=crop&w=500&q=80",
  stationery: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=500&q=80"
};

export const products: Product[] = [
  { id: "p9", name: "PATANJALI DOODH MILK BISCUITS", barcode: "8906032018513", category: "Biscuits", price: 5, stock: 90, min: 50, status: "OK", supplier: "Patanjali Foods", image: productImages.biscuits },
  { id: "p10", name: "Priya Premium Curd 1kg", barcode: "8906077890012", category: "Dairy", price: 80, stock: 80, min: 50, status: "OK", supplier: "Priya Dairy", image: productImages.curd, sku: "PRIYA-CURD-1KG" },
  { id: "p11", name: "Xinng Continental Sauce 500g", barcode: "8906123456789", category: "Sauces & Spreads", price: 65, stock: 75, min: 50, status: "OK", supplier: "Xinng Foods", image: productImages.sauce, sku: "XINNG-CONT-SAUCE-500G" },
  { id: "p12", name: "Britannia Marie Gold Biscuit 120g", barcode: "8901063061302", category: "Biscuits & Cookies", price: 15, stock: 120, min: 50, status: "OK", supplier: "Britannia Industries", image: productImages.biscuits, sku: "BRIT-MARIEGOLD-120G" },
  { id: "p13", name: "Fevicol MR General Purpose 100ml", barcode: "8901030720015", category: "Office & Stationery", price: 45, stock: 65, min: 50, status: "OK", supplier: "Pidilite Industries", image: productImages.stationery, sku: "FEVICOL-MR-100ML" },
  { id: "p1", name: "Brown Bread", barcode: "8901030890617", category: "Bakery", price: 45, stock: 156, min: 50, status: "OK", supplier: "Mumbai Bakers", image: productImages.bread },
  { id: "p2", name: "Milk (Amul 500ml)", barcode: "8901063150853", category: "Dairy", price: 55, stock: 38, min: 50, status: "LOW", supplier: "Amul Dairy", image: productImages.milk },
  { id: "p3", name: "Eggs (10-pack)", barcode: "8901030890618", category: "Dairy", price: 65, stock: 12, min: 50, status: "CRITICAL", supplier: "Happy Farms", image: productImages.eggs },
  { id: "p4", name: "Basmati Rice (1kg)", barcode: "8901063150854", category: "Grains", price: 150, stock: 498, min: 50, status: "OK", supplier: "Hyderabad Grains Co", image: productImages.rice },
  { id: "p5", name: "Refined Oil (1L)", barcode: "8901063150855", category: "Oils", price: 95, stock: 42, min: 50, status: "LOW", supplier: "ABC Oils Ltd", image: productImages.oil },
  { id: "p6", name: "Butter (200g)", barcode: "8901063150856", category: "Dairy", price: 120, stock: 87, min: 50, status: "OK", supplier: "Amul Dairy", image: productImages.butter },
  { id: "p7", name: "Tea (500g)", barcode: "8901063150857", category: "Beverages", price: 85, stock: 234, min: 50, status: "OK", supplier: "Nilgiri Tea Co", image: productImages.tea },
  { id: "p8", name: "Honey (500ml)", barcode: "8901063150858", category: "Foods", price: 180, stock: 5, min: 50, status: "CRITICAL", supplier: "Deccan Naturals", image: productImages.honey }
];

export const alerts = products
  .filter((product) => product.stock < product.min)
  .map((product) => ({
    id: `low-${product.id}`,
    type: "LOW_STOCK",
    severity: product.stock < 15 ? "CRITICAL" : "LOW",
    product,
    text: `Low Stock: ${product.name} — ${product.stock} units remaining`,
    time: "Now",
    action: "Reorder stock"
  }));

export const weeklySales = [
  { day: "Mon", sales: 92000 },
  { day: "Tue", sales: 84000 },
  { day: "Wed", sales: 121000 },
  { day: "Thu", sales: 105000 },
  { day: "Fri", sales: 136000 },
  { day: "Sat", sales: 172000 },
  { day: "Sun", sales: 155000 }
];

export const fraudEvents = [
  { id: "FRAU001", time: "08:53 AM", type: "Weight Mismatch", detail: "Expected 3.87kg, Actual 5.20kg (34% variance)", customer: "Raj Kumar", risk: "HIGH", status: "BLOCKED", cartId: "CART5892", expected: "3.87 kg", actual: "5.20 kg", variance: "34%", action: "Exit blocked and staff review requested", notes: "Possible unscanned item placed after barcode scan." },
  { id: "FRAU002", time: "08:45 AM", type: "Cart Velocity", detail: ">3 transactions in 5 minutes", customer: "Anonymous", risk: "MED", status: "DECLINED", cartId: "CART5904", expected: "1.20 kg", actual: "1.21 kg", variance: "0.8%", action: "Payment declined for review", notes: "Fast repeated cart creation from same device fingerprint." },
  { id: "FRAU003", time: "08:30 AM", type: "Barcode Swap", detail: "Expected: Rice, Found: Sugar", customer: "Test Customer", risk: "HIGH", status: "BLOCKED", cartId: "CART5888", expected: "1.00 kg", actual: "0.45 kg", variance: "55%", action: "Cart blocked", notes: "Low-price barcode used for a higher-value product." },
  { id: "FRAU004", time: "07:55 AM", type: "Weight Mismatch", detail: "Expected 2.1kg, Actual 2.13kg (1.4% near limit)", customer: "Priya Sharma", risk: "LOW", status: "RESOLVED", cartId: "CART5864", expected: "2.10 kg", actual: "2.13 kg", variance: "1.4%", action: "Allowed after staff review", notes: "Variance was below failure threshold but near tolerance." },
  { id: "FRAU005", time: "07:30 AM", type: "Multiple OTP", detail: "OTP requested 5 times in 2 minutes", customer: "Unknown", risk: "MED", status: "BLOCKED", cartId: "N/A", expected: "N/A", actual: "N/A", variance: "N/A", action: "Login temporarily blocked", notes: "Repeated OTP requests from one device." }
] as const;

export const activeCarts = [
  { id: "CART5892", customer: "Raj Kumar", items: 6, weight: "5.20 kg", expectedWeight: "3.87 kg", status: "Mismatch", total: 506, updated: "08:53 AM", payment: "PENDING", location: "Aisle 4 · Dairy", lines: ["Milk (Amul 500ml) x2", "Basmati Rice (1kg) x1", "Refined Oil (1L) x1", "Brown Bread x2"] },
  { id: "CART5910", customer: "Ananya Rao", items: 3, weight: "1.12 kg", expectedWeight: "1.10 kg", status: "Verified", total: 270, updated: "09:08 AM", payment: "READY_FOR_PAYMENT", location: "Aisle 2 · Bakery", lines: ["Brown Bread x2", "Butter (200g) x1"] },
  { id: "CART5911", customer: "Guest", items: 1, weight: "0.53 kg", expectedWeight: "0.53 kg", status: "Scanning", total: 57.75, updated: "09:12 AM", payment: "OPEN", location: "Aisle 1 · Dairy", lines: ["Milk (Amul 500ml) x1"] }
];

export const customers = [
  { id: "CUST5892", name: "Raj Kumar", mobile: "+91 98765 43210", visits: 18, loyalty: 249, spend: 13860, email: "raj@gmail.com", lastVisit: "27-05-2026 · 08:53 AM", risk: "Watchlist: weight mismatch review", avgCart: 770 },
  { id: "CUST7781", name: "Ananya Rao", mobile: "+91 90000 11223", visits: 7, loyalty: 88, spend: 4220, email: "ananya@gmail.com", lastVisit: "27-05-2026 · 09:08 AM", risk: "Normal", avgCart: 603 },
  { id: "CUST4472", name: "Priya Sharma", mobile: "+91 98989 88999", visits: 12, loyalty: 160, spend: 9730, email: "priya@gmail.com", lastVisit: "27-05-2026 · 07:55 AM", risk: "Normal", avgCart: 811 }
];

export const bills = [
  { id: "BL20260527003209", customer: "Raj Kumar", method: "UPI", upiId: "raj123@okaxis", reference: "UPI202605275257225", total: 94.5, status: "PAID", time: "06:17 PM", cartId: "CART5892", items: 2, paymentStatus: "Success", exitStatus: "QR generated" },
  { id: "BL20260527004511", customer: "Ananya Rao", method: "CARD", upiId: "-", reference: "CARD20260527004511", total: 270, status: "PAID", time: "06:08 PM", cartId: "CART5910", items: 3, paymentStatus: "Success", exitStatus: "QR generated" },
  { id: "BL20260527005310", customer: "Guest", method: "CASH", upiId: "-", reference: "CASH5892", total: 506, status: "CASH_PENDING", time: "05:52 PM", cartId: "CART5911", items: 6, paymentStatus: "Waiting at counter", exitStatus: "Blocked until paid" },
  { id: "BL20260527005444", customer: "Priya Sharma", method: "UPI", upiId: "priya@upi", reference: "UPI20260527005444", total: 418, status: "PAID", time: "05:44 PM", cartId: "CART5864", items: 5, paymentStatus: "Success", exitStatus: "Used at gate" }
];
