import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { toDataURL } from "qrcode";

const SUPABASE_URL = "https://umgkqmfisducjekpzxgi.supabase.co";

export function getMidtransServerKey() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum diset.");
  return key;
}

export function isMidtransProduction() {
  const key = getMidtransServerKey();
  if (key.startsWith("SB-Mid-server-")) return false;
  if (key.startsWith("Mid-server-")) return true;
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
    payment_type: "gopay",
    transaction_details: {
      order_id: params.orderId,
      gross_amount: Math.round(params.grossAmount),
    },
    // QRIS Dinamis GoPay di Core API dibuat melalui payment_type "gopay".
    // Response tetap menyediakan action "generate-qr-code" yang bisa discan semua aplikasi QRIS.
    gopay: {
      enable_callback: false,
    },
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
    validation_messages?: string[];
  };
  if (!res.ok || (json.status_code && !["200", "201"].includes(json.status_code))) {
    console.error("[midtrans charge] failed:", JSON.stringify(json));
    const detail = json.validation_messages?.length ? `: ${json.validation_messages.join(", ")}` : "";
    throw new Error((json.status_message || `Midtrans error (${res.status})`) + detail);
  }
  const qrUrl = json.actions?.find((a) => a.name === "generate-qr-code")?.url ?? null;
  const qrImageDataUrl = await createQrImageDataUrl({ qrString: json.qr_string ?? null, qrUrl });
  if (!qrUrl && !json.qr_string && !qrImageDataUrl) {
    console.error("[midtrans charge] no QR payload:", JSON.stringify(json));
    throw new Error("Midtrans berhasil membuat transaksi, tetapi tidak mengirim data QRIS.");
  }
  return {
    transaction_id: json.transaction_id!,
    qr_string: json.qr_string ?? null,
    qr_url: qrUrl,
    qr_image_data_url: qrImageDataUrl,
    transaction_status: json.transaction_status ?? "pending",
  };
}

export async function createQrImageDataUrl(params: { qrString: string | null; qrUrl: string | null }) {
  if (params.qrString) {
    return toDataURL(params.qrString, { margin: 1, width: 320, errorCorrectionLevel: "M" });
  }

  if (!params.qrUrl) return null;
  try {
    const qrRes = await fetch(params.qrUrl, {
      headers: {
        Accept: "image/png,image/*,*/*",
        Authorization: midtransAuthHeader(),
      },
    });
    if (!qrRes.ok) {
      console.error("[midtrans qr image] fetch failed:", qrRes.status, await qrRes.text());
      return null;
    }
    const contentType = qrRes.headers.get("content-type")?.split(";")[0] || "image/png";
    const bytes = await qrRes.arrayBuffer();
    return `data:${contentType};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch (e) {
    console.error("[midtrans qr image] fetch error:", e);
    return null;
  }
}

export async function getMidtransTransactionStatus(orderId: string) {
  const res = await fetch(`${midtransApiBase()}/${encodeURIComponent(orderId)}/status`, {
    headers: { Accept: "application/json", Authorization: midtransAuthHeader() },
  });
  const json = (await res.json()) as { transaction_status?: string; fraud_status?: string; status_message?: string };
  if (!res.ok) throw new Error(json.status_message || `Midtrans status error (${res.status})`);
  return json;
}

export async function cancelMidtransTransaction(orderId: string) {
  const res = await fetch(`${midtransApiBase()}/${encodeURIComponent(orderId)}/cancel`, {
    method: "POST",
    headers: { Accept: "application/json", Authorization: midtransAuthHeader() },
  });
  const json = (await res.json().catch(() => ({}))) as { status_message?: string };
  if (!res.ok) console.error("[midtrans cancel] failed:", JSON.stringify(json));
  return res.ok;
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
