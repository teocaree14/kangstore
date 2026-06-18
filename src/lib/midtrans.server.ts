import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://umgkqmfisducjekpzxgi.supabase.co";

export function getMidtransServerKey() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum diset.");
  return key;
}

export function isMidtransProduction() {
  return (process.env.MIDTRANS_IS_PRODUCTION ?? "true").toLowerCase() === "true";
}

export function midtransApiBase() {
  return isMidtransProduction()
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";
}

export function midtransAuthHeader() {
  return "Basic " + Buffer.from(getMidtransServerKey() + ":").toString("base64");
}

export function getServiceClient() {
  const key = process.env.LUCKY_STORE_SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Service role key belum diset.");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}

export async function chargeQris(params: {
  orderId: string;
  grossAmount: number;
  customerName: string;
  phone: string;
}) {
  const body = {
    payment_type: "qris",
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    // acquirer dihilangkan agar Midtrans memilih channel QRIS yang aktif di akun Anda
    customer_details: {
      first_name: params.customerName,
      phone: params.phone,
    },
  };

  const res = await fetch(`${midtransApiBase()}/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: midtransAuthHeader(),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as {
    status_code?: string;
    status_message?: string;
    transaction_id?: string;
    transaction_status?: string;
    qr_string?: string;
    actions?: Array<{ name: string; url: string; method: string }>;
  };
  if (!res.ok || (json.status_code && !["200", "201"].includes(json.status_code))) {
    throw new Error(json.status_message || `Midtrans error (${res.status})`);
  }
  const qrUrl = json.actions?.find((a) => a.name === "generate-qr-code")?.url ?? null;
  return {
    transaction_id: json.transaction_id!,
    qr_string: json.qr_string ?? null,
    qr_url: qrUrl,
    transaction_status: json.transaction_status ?? "pending",
  };
}

export function verifyMidtransSignature(payload: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) {
  const expected = createHash("sha512")
    .update(payload.order_id + payload.status_code + payload.gross_amount + getMidtransServerKey())
    .digest("hex");
  return expected === payload.signature_key;
}

export function mapTransactionStatus(s: {
  transaction_status: string;
  fraud_status?: string;
}) {
  const t = s.transaction_status;
  if (t === "capture" || t === "settlement") return "lunas";
  if (t === "pending") return "menunggu_pembayaran";
  if (t === "deny" || t === "cancel" || t === "expire" || t === "failure") return "gagal";
  return "menunggu_pembayaran";
}
