import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/midtrans/notification")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            order_id: string;
            status_code: string;
            gross_amount: string;
            signature_key: string;
            transaction_status: string;
            transaction_id?: string;
            fraud_status?: string;
            payment_type?: string;
          };
          const { verifyMidtransSignature, mapTransactionStatus, getServiceClient } = await import(
            "@/lib/midtrans.server"
          );
          if (!verifyMidtransSignature(body)) {
            return new Response("Invalid signature", { status: 401 });
          }
          const payment_status = mapTransactionStatus(body);
          const patch: Record<string, unknown> = { payment_status };
          if (payment_status === "lunas") patch.shipping_status = "diproses";
          if (body.transaction_id) patch.midtrans_transaction_id = body.transaction_id;
          const { error } = await getServiceClient()
            .from("orders")
            .update(patch)
            .eq("id", body.order_id);
          if (error) {
            console.error("[midtrans webhook] update error:", error);
            return new Response("DB error", { status: 500 });
          }
          return new Response("ok");
        } catch (e) {
          console.error("[midtrans webhook] fail:", e);
          return new Response("error", { status: 500 });
        }
      },
    },
  },
});
