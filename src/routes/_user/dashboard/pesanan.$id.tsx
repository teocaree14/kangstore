import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase, type Order } from "@/lib/supabase";
import { formatIDR } from "@/lib/cart";
import { ArrowLeft, Loader2, Copy, Truck } from "lucide-react";
import { OrderStatusTimeline, StatusBadge } from "@/components/dashboard/OrderStatusTimeline";
import { toast } from "sonner";

export const Route = createFileRoute("/_user/dashboard/pesanan/$id")({
  component: DetailPage,
});

function DetailPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <Card className="p-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></Card>;
  if (!order) return <Card className="p-12 text-center text-muted-foreground">Pesanan tidak ditemukan</Card>;

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Disalin"); };

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
