import { create } from "zustand";
import { Product } from "../data/products";

export type CartLine = {
  product: Product;
  quantity: number;
  status: "SCANNED" | "VERIFIED" | "BILLED";
};

export type CartOffer = {
  id: string;
  title: string;
  description: string;
  discount: number;
};

type Payment = {
  method: "UPI" | "CARD" | "CASH";
  reference: string;
  status: "CONFIRMED" | "PENDING_COUNTER";
};

type CartState = {
  items: CartLine[];
  weightStatus: "PENDING" | "VERIFIED" | "FAILED";
  lastActualWeight: number;
  lastVariance: number;
  payment?: Payment;
  add: (product: Product) => void;
  remove: (productId: string) => void;
  changeQuantity: (productId: string, delta: number) => void;
  clear: () => void;
  verifyWeight: (actualWeight: number) => boolean;
  pay: (method: Payment["method"]) => void;
  confirmCashPayment: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  weightStatus: "PENDING",
  lastActualWeight: 0,
  lastVariance: 0,
  add: (product) =>
    set((state) => {
      const existing = state.items.find((item) => item.product.id === product.id);
      return {
        items: existing
          ? state.items.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + 1, status: "SCANNED" } : item))
          : [...state.items, { product, quantity: 1, status: "SCANNED" }],
        weightStatus: "PENDING"
      };
    }),
  remove: (productId) => set((state) => ({ items: state.items.filter((item) => item.product.id !== productId), weightStatus: "PENDING" })),
  changeQuantity: (productId, delta) =>
    set((state) => ({
      items: state.items
        .map((item) => (item.product.id === productId ? { ...item, quantity: Math.max(0, item.quantity + delta), status: "SCANNED" as const } : item))
        .filter((item) => item.quantity > 0),
      weightStatus: "PENDING"
    })),
  clear: () => set({ items: [], weightStatus: "PENDING", lastActualWeight: 0, lastVariance: 0, payment: undefined }),
  verifyWeight: (actualWeight) => {
    const expected = getExpectedWeight(get().items);
    const variance = expected <= 0 ? 100 : Math.abs(actualWeight - expected) / expected * 100;
    const passed = variance <= 2;
    set((state) => ({
      weightStatus: passed ? "VERIFIED" : "FAILED",
      lastActualWeight: actualWeight,
      lastVariance: variance,
      items: passed ? state.items.map((item) => ({ ...item, status: "VERIFIED" as const })) : state.items
    }));
    return passed;
  },
  pay: (method) =>
    set((state) => ({
      payment: {
        method,
        reference: method === "CASH" ? "CASH5892" : `${method}${Date.now()}`.slice(0, 18),
        status: method === "CASH" ? "PENDING_COUNTER" : "CONFIRMED"
      },
      items: method === "CASH" ? state.items : state.items.map((item) => ({ ...item, status: "BILLED" as const }))
    })),
  confirmCashPayment: () =>
    set((state) => ({
      payment: state.payment?.method === "CASH"
        ? { ...state.payment, status: "CONFIRMED" }
        : { method: "CASH", reference: "CASH5892", status: "CONFIRMED" },
      items: state.items.map((item) => ({ ...item, status: "BILLED" as const }))
    }))
}));

export function getSubtotal(items: CartLine[]) {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}

export function getCartOffers(items: CartLine[]): CartOffer[] {
  const offers: CartOffer[] = [];
  const subtotal = getSubtotal(items);
  const bread = items.find((item) => item.product.id === "p1");
  const milk = items.find((item) => item.product.id === "p2");

  if (bread && bread.quantity >= 2) {
    const freeItems = Math.floor(bread.quantity / 2);
    offers.push({
      id: "bread-bogo",
      title: "Buy 1 Get 1: Brown Bread",
      description: `${freeItems} bread ${freeItems === 1 ? "pack" : "packs"} free`,
      discount: freeItems * bread.product.price
    });
  }

  if (bread && milk) {
    offers.push({
      id: "breakfast-combo",
      title: "Breakfast Combo",
      description: "Milk + bread combo discount",
      discount: 10
    });
  }

  if (subtotal >= 500) {
    offers.push({
      id: "cart-value",
      title: "Smart Saver",
      description: "₹25 off above ₹500",
      discount: 25
    });
  }

  return offers;
}

export function getDiscountTotal(items: CartLine[]) {
  return Number(getCartOffers(items).reduce((sum, offer) => sum + offer.discount, 0).toFixed(2));
}

export function getTax(items: CartLine[]) {
  return Number((Math.max(0, getSubtotal(items) - getDiscountTotal(items)) * 0.05).toFixed(2));
}

export function getTotal(items: CartLine[]) {
  return Number((Math.max(0, getSubtotal(items) - getDiscountTotal(items)) + getTax(items)).toFixed(2));
}

export function getExpectedWeight(items: CartLine[]) {
  return Number(items.reduce((sum, item) => sum + item.product.weightKg * item.quantity, 0).toFixed(3));
}
