import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const CUSTOMER_KEY = "smart-cart.customer";

export type CustomerProfile = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  loyalty: number;
  visits: number;
};

const knownCustomers: Record<string, Omit<CustomerProfile, "mobile">> = {
  "9876543210": { id: "CUST5892", name: "Raj Kumar", email: "raj@gmail.com", loyalty: 249, visits: 18 },
  "9000011223": { id: "CUST7781", name: "Ananya Rao", email: "ananya@gmail.com", loyalty: 88, visits: 7 },
  "9898988999": { id: "CUST4472", name: "Priya Sharma", email: "priya@gmail.com", loyalty: 160, visits: 12 }
};

function profileForMobile(mobile: string): CustomerProfile {
  const saved = knownCustomers[mobile];
  if (saved) return { ...saved, mobile };

  const lastFour = mobile.slice(-4);
  return {
    id: `CUST${lastFour}`,
    name: `Customer ${lastFour}`,
    mobile,
    email: `customer${lastFour}@smartcart.local`,
    loyalty: 0,
    visits: 1
  };
}

type CustomerState = {
  customer?: CustomerProfile;
  hydrated: boolean;
  loadCustomer: () => Promise<void>;
  loginWithMobile: (mobile: string) => Promise<CustomerProfile>;
};

export const useCustomerStore = create<CustomerState>((set) => ({
  customer: undefined,
  hydrated: false,
  loadCustomer: async () => {
    const stored = await AsyncStorage.getItem(CUSTOMER_KEY);
    set({ customer: stored ? JSON.parse(stored) as CustomerProfile : undefined, hydrated: true });
  },
  loginWithMobile: async (mobile) => {
    const customer = profileForMobile(mobile);
    await AsyncStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
    set({ customer, hydrated: true });
    return customer;
  }
}));
