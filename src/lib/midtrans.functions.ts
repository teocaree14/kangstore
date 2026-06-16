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

    const { chargeQris, getServiceClient } = await import("./midtrans.server");

    const orderId = crypto.randomUUID();
    const invoice = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random()
      .toString(36)
      .slice(2, 7)
      .toUpperCase()}`;

    const admin = getServiceClient();
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
    });
    if (insErr) throw new Error(`Order gagal disimpan: ${insErr.message}`);

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

    try {
      const charge = await chargeQris({
        orderId,
        grossAmount: data.total,
        customerName: data.customer_name,
        phone: data.phone,
      });
      await admin
        .from("orders")
        .update({
          midtrans_order_id: orderId,
          midtrans_transaction_id: charge.transaction_id,
          qr_string: charge.qr_string,
          qr_url: charge.qr_url,
        })
        .eq("id", orderId);
      return {
        order_id: orderId,
        invoice,
        qr_string: charge.qr_string,
        qr_url: charge.qr_url,
        total: data.total,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal membuat QRIS";
      throw new Error(msg);
    }
  });

export const getOrderPaymentStatus = createServerFn({ method: "GET" })
  .inputValidator((data: { orderId: string }) => data)
  .handler(async ({ data }) => {
    const { getServiceClient } = await import("./midtrans.server");
    const { data: row, error } = await getServiceClient()
      .from("orders")
      .select("id, payment_status")
      .eq("id", data.orderId)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
