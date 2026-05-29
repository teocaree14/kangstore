import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase, type Order } from "@/lib/supabase";
import { Truck, Search, Loader2 } from "lucide-react";
import { OrderStatusTimeline, StatusBadge } from "@/components/dashboard/OrderStatusTimeline";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_user/dashboard/tracking")({
  component: TrackingPage,
});

function TrackingPage() {
  const { user } = useAuth();
  const [resi, setResi] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const cek = async () => {
    if (!resi.trim()) return toast.error("Masukkan nomor resi");
    setLoading(true);
    try {
      const { data, error } = await supabase.from("orders")
        .select("*")
        .eq("tracking_number", resi.trim())
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        toast.error("Resi tidak ditemukan");
        setOrder(null);
      } else {
        setOrder(data as Order);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Tracking Resi</h1><p className="text-muted-foreground">Cek status pengiriman pesanan kamu</p></div>

      <Card className="p-6 space-y-4">
        <Label>Nomor Resi</Label>
        <div className="flex gap-2">
          <Input value={resi} onChange={(e) => setResi(e.target.value)} placeholder="Masukkan nomor resi" onKeyDown={(e) => e.key === "Enter" && cek()} />
          <Button onClick={cek} disabled={loading} className="bg-gradient-primary shadow-glow">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Search className="h-4 w-4 mr-1" /> Cek</>}
          </Button>
        </div>
      </Card>

      {order && (
        <Card className="p-6 space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <p className="text-xs text-muted-foreground">Invoice</p>
              <p className="font-mono font-bold">{order.invoice_number || order.id.slice(0, 8)}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Truck className="h-3 w-3" /> {order.tracking_number}</p>
            </div>
            <StatusBadge status={order.shipping_status} />
          </div>
          <OrderStatusTimeline status={order.shipping_status} />
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p>Update terakhir: {new Date(order.created_at).toLocaleString("id-ID")}</p>
          </div>
        </Card>
      )}

      <Card className="p-4 bg-muted/30 text-sm text-muted-foreground">
        <p>💡 Nomor resi akan tersedia setelah admin menginput resi pengiriman pesanan kamu.</p>
      </Card>
    </div>
  );
}
