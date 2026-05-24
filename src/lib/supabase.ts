import { createClient } from "@supabase/supabase-js";

// User-provided Supabase project (publishable key — safe in client)
const SUPABASE_URL = "https://umgkqmfisducjekpzxgi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_m04ZHL9a_goAaMFkn8hvDA_tHE3qRBN";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "lucky-store-auth",
  },
});

export type Product = {
  id: string;
  name: string;
  provider: string;
  price: number;
  quota: string;
  active_period: string;
  description: string | null;
  image: string | null;
  stock: number;
  created_at: string;
};

export type Order = {
  id: string;
  customer_name: string;
  phone: string;
  product_id: string;
  payment_method: string;
  payment_status: "menunggu_pembayaran" | "diproses" | "dikirim" | "selesai";
  proof_image: string | null;
  created_at: string;
  product?: Product;
};

export type Testimonial = {
  id: string;
  name: string;
  avatar: string | null;
  rating: number;
  message: string;
};
