import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useUserOrders } from "@/hooks/use-user-orders";
import { formatIDR } from "@/lib/cart";
import { ShoppingBag, Clock, CheckCircle2, Wallet } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/OrderStatusTimeline";

export const Route = createFileRoute("/_user/dashboard")({
  component: DashboardHome,
});

function DashboardHome() {
  const { user } = useAuth();
  const { data: orders = [], isLoading } = useUserOrders(user?.id);

  const totalSpent = orders.reduce((a, o) => a + Number(o.total_price || 0), 0);
  const active = orders.filter((o) => o.shipping_status !== "selesai").length;
  const done = orders.filter((o) => o.shipping_status === "selesai").length;

  const stats = [
    { label: "Total Pesanan", value: orders.length, icon: ShoppingBag, color: "text-primary" },
    { label: "Pesanan Aktif", value: active, icon: Clock, color: "text-yellow-500" },
    { label: "Selesai", value: done, icon: CheckCircle2, color: "text-green-500" },
    { label: "Total Belanja", value: formatIDR(totalSpent), icon: Wallet, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan akun & aktivitas belanja</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <s.icon className={`h-5 w-5 ${s.color}`} />
            <p className="text-xs text-muted-foreground mt-3">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Pesanan Terbaru</h2>
          <Link to="/dashboard/pesanan"><Button variant="ghost" size="sm">Lihat semua</Button></Link>
        </div>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>Belum ada pesanan</p>
            <Link to="/produk"><Button className="mt-3 bg-gradient-primary shadow-glow">Mulai Belanja</Button></Link>
          </div>
        ) : (
          <div className="space-y-2">
            {orders.slice(0, 5).map((o) => (
              <Link key={o.id} to="/dashboard/pesanan/$id" params={{ id: o.id }}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors border">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{o.invoice_number || o.id.slice(0, 8)}</p>
                  <p className="text-sm font-medium">{formatIDR(Number(o.total_price))}</p>
                </div>
                <StatusBadge status={o.shipping_status} />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
