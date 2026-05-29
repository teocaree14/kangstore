import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useUserOrders } from "@/hooks/use-user-orders";
import { formatIDR } from "@/lib/cart";
import { ShoppingBag, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/OrderStatusTimeline";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_user/dashboard/pesanan")({
  component: PesananPage,
});

function PesananPage() {
  const { user } = useAuth();
  const { data: orders = [], isLoading, error } = useUserOrders(user?.id);

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Riwayat Pesanan</h1><p className="text-muted-foreground">Semua pesanan kamu</p></div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : error ? (
        <Card className="p-12 text-center text-destructive">Gagal memuat pesanan</Card>
      ) : orders.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="mb-4">Belum ada pesanan</p>
          <Link to="/produk"><Button className="bg-gradient-primary shadow-glow">Mulai Belanja</Button></Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} to="/dashboard/pesanan/$id" params={{ id: o.id }} className="block">
              <Card className="p-5 hover:border-primary transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono text-xs text-muted-foreground">{o.invoice_number || `#${o.id.slice(0, 8)}`}</p>
                      <StatusBadge status={o.shipping_status} />
                    </div>
                    <p className="font-semibold mt-2">{formatIDR(Number(o.total_price))}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {o.items?.length || 1} produk · {new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
