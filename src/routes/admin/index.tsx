import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Package, ShoppingBag, DollarSign, Clock } from "lucide-react";
import { formatIDR } from "@/lib/cart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [products, orders] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, payment_status, created_at, product:products(price)"),
      ]);
      const list = (orders.data ?? []) as Array<{ id: string; payment_status: string; created_at: string; product: { price: number } | null }>;
      const revenue = list.filter((o) => o.payment_status === "selesai").reduce((a, o) => a + (o.product?.price ?? 0), 0);
      const pending = list.filter((o) => o.payment_status === "menunggu_pembayaran").length;

      // Build last 7 days revenue
      const days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        days[d.toISOString().slice(0, 10)] = 0;
      }
      list.forEach((o) => {
        const k = o.created_at.slice(0, 10);
        if (k in days && o.payment_status === "selesai") days[k] += o.product?.price ?? 0;
      });
      const chart = Object.entries(days).map(([d, v]) => ({ day: d.slice(5), revenue: v }));

      return { productCount: products.count ?? 0, orderCount: list.length, revenue, pending, chart };
    },
  });

  const cards = [
    { l: "Total Produk", v: stats?.productCount ?? 0, i: Package },
    { l: "Total Pesanan", v: stats?.orderCount ?? 0, i: ShoppingBag },
    { l: "Pending", v: stats?.pending ?? 0, i: Clock },
    { l: "Revenue", v: formatIDR(stats?.revenue ?? 0), i: DollarSign },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Ringkasan performa toko</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.l} className="p-5">
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">{c.l}</p>
              <c.i className="h-4 w-4 text-primary" />
            </div>
            <p className="font-display text-2xl font-bold mt-2">{c.v}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="font-semibold mb-4">Revenue 7 Hari Terakhir</h2>
        <div className="h-64">
          <ResponsiveContainer>
            <LineChart data={stats?.chart ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatIDR(v)} />
              <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ fill: "var(--primary)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
