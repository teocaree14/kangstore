import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://umgkqmfisducjekpzxgi.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_m04ZHL9a_goAaMFkn8hvDA_tHE3qRBN";

export type CreateQrisInput = {
  authToken: string;
  customer_name: string;
  phone: string;
  address: string;
  items: Array<{ product_id: string; product_name: string; price: number; quantity: number }>;
  total: number;
};

export type CancelPendingOrderInput = {
  authToken: string;
  orderId: string;
};

export const createQrisOrder = createServerFn({ method: "POST" })
  .inputValidator((data: CreateQrisInput) => data)
  .handler(async ({ data }) => {
    // Validate user via bearer token
    const userClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${data.authToken}` } },
    });
    const { data: u, error: uErr } = await userClient.auth.getUser(data.authToken);
    if (uErr || !u.user) throw new Error("Sesi tidak valid, silakan login ulang.");
    const userId = u.user.id;

    if (!data.items.length) throw new Error("Keranjang kosong");
    if (data.total <= 0) throw new Error("Total tidak valid");

    const { cancelMidtransTransaction, chargeQris, getServiceClient } = await import("./midtrans.server");

    const orderId = crypto.randomUUID();
    const invoice = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;

    // 1) Charge Midtrans FIRST. If it fails, no order row is created → user can retry cleanly.
    let charge;
    try {
      charge = await chargeQris({
        orderId,
        grossAmount: data.total,
        customerName: data.customer_name,
        phone: data.phone,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal membuat QRIS";
      throw new Error(msg);
    }

    // 2) Only after a successful charge, persist the order with QR data.
    const admin = getServiceClient();
    const displayQrUrl = charge.qr_image_data_url ?? charge.qr_url;
    const { error: insErr } = await admin.from("orders").insert({
      id: orderId,
      user_id: userId,
      customer_name: data.customer_name,
      phone: data.phone,
      address: data.address,
      product_id: data.items[0].product_id,
      payment_method: "QRIS",
      payment_status: "menunggu_pembayaran",
      shipping_status: "menunggu_pembayaran",
      invoice_number: invoice,
      total_price: data.total,
      midtrans_order_id: orderId,
      midtrans_transaction_id: charge.transaction_id,
      qr_string: charge.qr_string,
      qr_url: displayQrUrl,
    });
    if (insErr) {
      await cancelMidtransTransaction(orderId);
      throw new Error(`Order gagal disimpan: ${insErr.message}`);
    }

    const { error: itErr } = await admin.from("order_items").insert(
      data.items.map((i) => ({
        order_id: orderId,
        product_id: i.product_id,
        product_name: i.product_name,
        quantity: i.quantity,
        price: i.price,
      })),
    );
    if (itErr) console.error("[qris] order_items insert error:", itErr);

    return {
      order_id: orderId,
      invoice,
      qr_string: charge.qr_string,
      qr_url: displayQrUrl,
      total: data.total,
    };
  });

export const getOrderPaymentStatus = createServerFn({ method: "GET" })
  .inputValidator((data: { orderId: string }) => data)
  .handler(async ({ data }) => {
    const { getMidtransTransactionStatus, getServiceClient, mapTransactionStatus } = await import("./midtrans.server");
    const admin = getServiceClient();
    const { data: row, error } = await admin
      .from("orders")
      .select("id, payment_status, midtrans_order_id")
      .eq("id", data.orderId)
      .single();
    if (error) throw new Error(error.message);
    if (row.payment_status === "menunggu_pembayaran" && row.midtrans_order_id) {
      try {
        const midtrans = await getMidtransTransactionStatus(row.midtrans_order_id);
        const payment_status = mapTransactionStatus({
          transaction_status: midtrans.transaction_status ?? "pending",
          fraud_status: midtrans.fraud_status,
        });
        if (payment_status !== row.payment_status) {
          await admin
            .from("orders")
            .update({ payment_status, ...(payment_status === "lunas" ? { shipping_status: "diproses" } : {}) })
            .eq("id", data.orderId);
          return { ...row, payment_status };
        }
      } catch (e) {
        console.error("[qris status] Midtrans status check failed:", e);
      }
    }
    return row;
  });

export const cancelPendingOrder = createServerFn({ method: "POST" })
  .inputValidator((data: CancelPendingOrderInput) => data)
  .handler(async ({ data }) => {
    const userClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${data.authToken}` } },
    });
    const { data: u, error: uErr } = await userClient.auth.getUser(data.authToken);
    if (uErr || !u.user) throw new Error("Sesi tidak valid, silakan login ulang.");

    const { cancelMidtransTransaction, getServiceClient } = await import("./midtrans.server");
    const admin = getServiceClient();
    const { data: order, error } = await admin
      .from("orders")
      .select("id, user_id, payment_method, payment_status, shipping_status, midtrans_order_id")
      .eq("id", data.orderId)
      .eq("user_id", u.user.id)
      .single();
    if (error || !order) throw new Error("Pesanan tidak ditemukan.");
    if (order.payment_status !== "menunggu_pembayaran" || order.shipping_status !== "menunggu_pembayaran") {
      throw new Error("Pesanan ini sudah tidak bisa dibatalkan.");
    }

    if (order.payment_method === "QRIS" && order.midtrans_order_id) {
      await cancelMidtransTransaction(order.midtrans_order_id);
    }

    const { error: updErr } = await admin.from("orders").update({ payment_status: "gagal" }).eq("id", data.orderId);
    if (updErr) throw new Error(`Gagal membatalkan pesanan: ${updErr.message}`);
    return { ok: true };
  });
