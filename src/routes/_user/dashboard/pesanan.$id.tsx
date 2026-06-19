import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toDataURL } from "qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase, type Order } from "@/lib/supabase";
import { formatIDR } from "@/lib/cart";
import { ArrowLeft, Loader2, Copy, Truck } from "lucide-react";
import { OrderStatusTimeline, StatusBadge } from "@/components/dashboard/OrderStatusTimeline";
import { toast } from "sonner";
import { cancelPendingOrder } from "@/lib/midtrans.functions";

export const Route = createFileRoute("/_user/dashboard/pesanan/$id")({
  component: DetailPage,
});

function DetailPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const cancelOrder = useServerFn(cancelPendingOrder);

  useEffect(() => {
    const load = () => {
      supabase.from("orders").select("*, items:order_items(*, product:products(*))").eq("id", id).maybeSingle().then(({ data }) => {
        setOrder(data as Order | null);
        setLoading(false);
      });
    };
    load();
    const ch = supabase.channel(`order-${id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  useEffect(() => {
    if (!order?.qr_string || order.qr_url) {
      setQrImage(null);
      return;
    }
    toDataURL(order.qr_string, { margin: 1, width: 320, errorCorrectionLevel: "M" })
      .then(setQrImage)
      .catch((e) => console.error("[order qr] render failed:", e));
  }, [order?.qr_string, order?.qr_url]);

  if (loading) return <Card className="p-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></Card>;
  if (!order) return <Card className="p-12 text-center text-muted-foreground">Pesanan tidak ditemukan</Card>;

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Disalin"); };
  const qrSrc = order.qr_url || qrImage;
  const isSnapPayment = !!qrSrc && !qrSrc.startsWith("data:image");
  const canCancel = order.payment_status === "menunggu_pembayaran" && order.shipping_status === "menunggu_pembayaran";
  const cancel = async () => {
    if (!canCancel || !window.confirm("Batalkan pesanan ini?")) return;
    setCanceling(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Sesi tidak valid, silakan login ulang.");
      await cancelOrder({ data: { authToken: token, orderId: order.id } });
      setOrder({ ...order, payment_status: "gagal" });
      toast.success("Pesanan dibatalkan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membatalkan pesanan");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link to="/dashboard/pesanan" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"><ArrowLeft className="h-4 w-4 mr-1" /> Kembali</Link>

      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Invoice</p>
            <p className="font-mono font-bold">{order.invoice_number || order.id.slice(0, 8)}</p>
          </div>
          <StatusBadge status={order.shipping_status} />
        </div>
        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("id-ID")}</p>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-lg mb-4">Status Pengiriman</h2>
        <OrderStatusTimeline status={order.shipping_status} />
        {order.tracking_number && (
          <div className="mt-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">No. Resi</p>
                <p className="font-mono font-semibold">{order.tracking_number}</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => copy(order.tracking_number!)}><Copy className="h-3 w-3 mr-1" /> Salin</Button>
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-3">
        <h2 className="font-semibold text-lg">Produk</h2>
        {(order.items ?? []).map((it) => (
          <div key={it.id} className="flex justify-between border-b pb-3 last:border-0">
            <div>
              <p className="font-medium">{it.product?.name || it.product_name}</p>
              <p className="text-xs text-muted-foreground">{formatIDR(Number(it.price))} × {it.quantity}</p>
            </div>
            <p className="font-semibold">{formatIDR(Number(it.price) * it.quantity)}</p>
          </div>
        ))}
        <div className="flex justify-between font-bold pt-2">
          <span>Total</span><span className="text-gradient">{formatIDR(Number(order.total_price))}</span>
        </div>
      </Card>

      <Card className="p-6 space-y-3 text-sm">
        <h2 className="font-semibold text-lg">Pengiriman</h2>
        <div><p className="text-xs text-muted-foreground">Nama</p><p>{order.customer_name}</p></div>
        <div><p className="text-xs text-muted-foreground">HP</p><p>{order.phone}</p></div>
        <div><p className="text-xs text-muted-foreground">Alamat</p><p>{order.address}</p></div>
      </Card>

      <Card className="p-6 space-y-3 text-sm">
        <h2 className="font-semibold text-lg">Pembayaran</h2>
        <div className="flex justify-between"><span className="text-muted-foreground">Metode</span><span className="font-medium">{order.payment_method}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="font-medium capitalize">{order.payment_status.replace(/_/g, " ")}</span></div>
        {order.payment_method === "QRIS" && canCancel && (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-muted/50 p-4 text-center">
            {qrSrc && isSnapPayment ? (
              <div className="w-full max-w-md rounded-lg border bg-background p-4 space-y-3">
                <p className="text-sm font-medium">Pembayaran QRIS tersedia di halaman Midtrans.</p>
                <Button type="button" variant="outline" onClick={() => window.open(qrSrc, "_blank", "noopener,noreferrer")}>Buka Pembayaran QRIS</Button>
              </div>
            ) : qrSrc ? (
              <img src={qrSrc} alt="QRIS pembayaran" className="h-64 w-64 rounded-lg border bg-white p-2" />
            ) : (
              <div className="h-64 w-64 grid place-items-center rounded-lg border bg-background p-4 text-muted-foreground">QRIS belum tersedia</div>
            )}
            <p className="text-xs text-muted-foreground">{isSnapPayment ? "Buka halaman Midtrans, pilih GoPay QRIS, lalu scan QRIS untuk membayar." : "Scan QRIS ini untuk menyelesaikan pembayaran."}</p>
          </div>
        )}
        {canCancel && (
          <Button type="button" variant="destructive" onClick={cancel} disabled={canceling} className="w-full">
            {canceling ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membatalkan...</> : "Batalkan Pesanan"}
          </Button>
        )}
        {order.proof_image && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">Bukti Transfer</p>
            <a href={order.proof_image} target="_blank" rel="noreferrer">
              <img src={order.proof_image} alt="Bukti" className="rounded-lg border max-h-48" />
            </a>
          </div>
        )}
      </Card>
    </div>
  );
}
