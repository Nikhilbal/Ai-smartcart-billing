export type Product = {
  id: string;
  name: string;
  category: string;
  barcode: string;
  price: number;
  mrp: number;
  weightKg: number;
  stock: number;
  image: string;
  description: string;
  supplier: string;
};

export const products: Product[] = [
  {
    id: "p1",
    name: "Brown Bread",
    category: "Bakery",
    barcode: "8901030890617",
    price: 45,
    mrp: 50,
    weightKg: 0.4,
    stock: 156,
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
    description: "Fresh whole wheat brown bread baked every morning.",
    supplier: "Mumbai Bakers"
  },
  {
    id: "p2",
    name: "Milk (Amul 500ml)",
    category: "Dairy",
    barcode: "8901063150853",
    price: 55,
    mrp: 58,
    weightKg: 0.53,
    stock: 38,
    image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=800&q=80",
    description: "Pasteurised toned milk, chilled and ready for checkout.",
    supplier: "Amul Dairy"
  },
  {
    id: "p3",
    name: "Eggs (10-pack)",
    category: "Dairy",
    barcode: "8901030890618",
    price: 65,
    mrp: 70,
    weightKg: 0.6,
    stock: 12,
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=800&q=80",
    description: "Farm fresh eggs, pack of ten.",
    supplier: "Happy Farms"
  },
  {
    id: "p4",
    name: "Basmati Rice (1kg)",
    category: "Grains",
    barcode: "8901063150854",
    price: 150,
    mrp: 165,
    weightKg: 1,
    stock: 498,
    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=80",
    description: "Long grain basmati rice from Telangana supply partners.",
    supplier: "Hyderabad Grains Co"
  },
  {
    id: "p5",
    name: "Refined Oil (1L)",
    category: "Oils",
    barcode: "8901063150855",
    price: 95,
    mrp: 105,
    weightKg: 0.92,
    stock: 42,
    image: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=80",
    description: "Light refined sunflower oil for everyday cooking.",
    supplier: "ABC Oils Ltd"
  },
  {
    id: "p6",
    name: "Butter (200g)",
    category: "Dairy",
    barcode: "8901063150856",
    price: 120,
    mrp: 130,
    weightKg: 0.2,
    stock: 87,
    image: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=80",
    description: "Creamy salted butter, perfect with your bread.",
    supplier: "Amul Dairy"
  },
  {
    id: "p7",
    name: "Tea (500g)",
    category: "Beverages",
    barcode: "8901063150857",
    price: 85,
    mrp: 95,
    weightKg: 0.5,
    stock: 234,
    image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=800&q=80",
    description: "Strong Indian tea blend for morning chai.",
    supplier: "Nilgiri Tea Co"
  },
  {
    id: "p8",
    name: "Honey (500ml)",
    category: "Foods",
    barcode: "8901063150858",
    price: 180,
    mrp: 210,
    weightKg: 0.7,
    stock: 5,
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=800&q=80",
    description: "Natural forest honey with no added sugar.",
    supplier: "Deccan Naturals"
  }
];

export const categories = ["All", "Dairy", "Bakery", "Grains", "Oils", "Beverages", "Foods"];

export const onboarding = [
  {
    title: "Welcome to Smart Cart",
    subtitle: "AI-powered supermarket companion",
    tag: "Shop Smarter. Faster. Safer.",
    body: "Your AI-powered supermarket companion that transforms grocery shopping into a seamless, fraud-aware experience.",
    color: "#2563EB",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80",
    icon: "cart-outline"
  },
  {
    title: "Scan & Shop",
    subtitle: "Point, scan, add to cart",
    tag: "Point. Scan. Add to Cart.",
    body: "Use your phone camera to scan product barcodes as you pick them. Prices update instantly with no checkout counter wait.",
    color: "#10B981",
    image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1000&q=80",
    icon: "scan-outline"
  },
  {
    title: "Weight Verification",
    subtitle: "Anti-fraud security check",
    tag: "Fraud-Aware Shopping",
    body: "Place your cart on the smart scale. The system cross-checks scanned items against actual weight within a 2% tolerance.",
    color: "#F59E0B",
    image: "https://images.unsplash.com/photo-1601599561213-832382fd07ba?auto=format&fit=crop&w=1000&q=80",
    icon: "scale-outline"
  },
  {
    title: "Pay & Exit",
    subtitle: "UPI, card, cash and QR exit",
    tag: "Multiple Payment Options",
    body: "Pay via UPI, debit or credit card, or cash. Get your digital receipt instantly and exit with a secure QR.",
    color: "#8B5CF6",
    image: "https://images.unsplash.com/photo-1578916171729-46686eac8d58?auto=format&fit=crop&w=1000&q=80",
    icon: "card-outline"
  }
];
