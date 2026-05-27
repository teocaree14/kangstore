import { createClient } from "@supabase/supabase-js";
import type { Product } from "./supabase";

const SUPABASE_URL = "https://umgkqmfisducjekpzxgi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_m04ZHL9a_goAaMFkn8hvDA_tHE3qRBN";
const DEFAULT_ADMIN_EMAILS = ["teocaree@gmail.com"];

type ProductPayload = {
  name: string;
  provider: string;
  price: number;
  quota: string;
  active_period: string;
  description: string;
  image: string | null;
  stock: number;
};

export type SaveProductInput = ProductPayload & { id?: string };
export type UploadProductImageInput = { fileName: string; contentType: string; base64: string };

function getServiceRoleClient() {
  const key = process.env.LUCKY_STORE_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Service role key belum diset.");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

function getUserClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? DEFAULT_ADMIN_EMAILS.join(","))
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(authHeader: string | undefined) {
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Sesi admin tidak ditemukan. Silakan login ulang.");

  const { data, error } = await getUserClient(token).auth.getUser(token);
  const email = data.user?.email?.toLowerCase();
  if (error || !data.user || !email) throw new Error("Sesi admin tidak valid. Silakan login ulang.");
  if (!getAdminEmails().includes(email)) throw new Error(`Email ${email} belum terdaftar sebagai admin.`);
  return data.user;
}

export async function listProductsAsAdmin() {
  const { data, error } = await getServiceRoleClient()
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Product[];
}

export async function saveProductAsAdmin(input: SaveProductInput) {
  const payload: ProductPayload = {
    name: input.name,
    provider: input.provider,
    price: input.price,
    quota: input.quota,
    active_period: input.active_period,
    description: input.description,
    image: input.image,
    stock: input.stock,
  };

  const query = input.id
    ? getServiceRoleClient().from("products").update(payload).eq("id", input.id).select("*").single()
    : getServiceRoleClient().from("products").insert(payload).select("*").single();

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as Product;
}

export async function deleteProductAsAdmin(id: string) {
  const { error } = await getServiceRoleClient().from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function uploadProductImageAsAdmin(input: UploadProductImageInput) {
  const admin = getServiceRoleClient();
  await admin.storage.createBucket("product-images", { public: true }).catch(() => null);

  const extension = input.fileName.split(".").pop()?.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const path = `products/${crypto.randomUUID()}.${extension}`;
  const bytes = Uint8Array.from(atob(input.base64), (char) => char.charCodeAt(0));
  const { error } = await admin.storage.from("product-images").upload(path, bytes, {
    contentType: input.contentType || "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = admin.storage.from("product-images").getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}