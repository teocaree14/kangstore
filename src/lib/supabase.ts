import { createClient } from "@supabase/supabase-js";

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

export type ShippingStatus =
  | "menunggu_pembayaran"
  | "diproses"
  | "dikemas"
  | "dikirim"
  | "selesai";

export type Order = {
  id: string;
  user_id: string | null;
  customer_name: string;
  phone: string;
  address: string | null;
  product_id: string;
  payment_method: string;
  payment_status: string;
  shipping_status: ShippingStatus;
  tracking_number: string | null;
  invoice_number: string | null;
  total_price: number;
  proof_image: string | null;
  midtrans_order_id?: string | null;
  midtrans_transaction_id?: string | null;
  qr_string?: string | null;
  qr_url?: string | null;
  created_at: string;
  product?: Product;
  items?: OrderItem[];
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string | null;
  quantity: number;
  price: number;
  product?: Product;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
};

export type Testimonial = {
  id: string;
  name: string;
  avatar: string | null;
  rating: number;
  message: string;
};
