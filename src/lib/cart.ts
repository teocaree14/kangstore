import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "./supabase";

export type CartItem = { product: Product; qty: number };

type CartState = {
  items: CartItem[];
  add: (p: Product, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: () => number;
  count: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p, qty = 1) =>
        set((s) => {
          const ex = s.items.find((i) => i.product.id === p.id);
          if (ex) return { items: s.items.map((i) => (i.product.id === p.id ? { ...i, qty: i.qty + qty } : i)) };
          return { items: [...s.items, { product: p, qty }] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.product.id !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.product.id === id ? { ...i, qty: Math.max(1, qty) } : i)),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((a, i) => a + i.product.price * i.qty, 0),
      count: () => get().items.reduce((a, i) => a + i.qty, 0),
    }),
    { name: "lucky-cart" },
  ),
);

export const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
