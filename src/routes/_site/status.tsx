import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase, type Order } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, Package, Truck } from "lucide-react";

export const Route = createFileRoute("/_site/status")({
  validateSearch: (s: Record<string, unknown>) => ({ id: (s.id as string) ?? "" }),
  component: StatusPage,
});

const steps = [
  { key: "menunggu_pembayaran", label: "Menunggu Pembayaran", icon: Clock },
  { key: "diproses", label: "Diproses", icon: Package },
  { key: "dikirim", label: "Dikirim", icon: Truck },
  { key: "selesai", label: "Selesai", icon: CheckCircle2 },
] as const;

function StatusPage() {
  const search = Route.useSearch();
  const [id, setId] = useState(search.id);
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  const find = async () => {
    if (!id) return;
    const { data } = await supabase.from("orders").select("*, product:products(*)").eq("id", id).maybeSingle();
    setOrder(data as Order | null);
    setSearched(true);
  };

  const stepIdx = order ? steps.findIndex((s) => s.key === order.payment_status) : -1;
  const progress = stepIdx >= 0 ? ((stepIdx + 1) / steps.length) * 100 : 0;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Lacak Pesanan</h1>
      <p className="text-muted-foreground mb-6">Masukkan ID pesanan untuk melihat status terkini.</p>

      <Card className="p-4 flex gap-2 mb-8">
        <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="ID Pesanan (UUID)" />
        <Button onClick={find} className="bg-gradient-primary shadow-glow">Lacak</Button>
      </Card>

      {searched && !order && <Card className="p-12 text-center text-muted-foreground">Pesanan tidak ditemukan.</Card>}

      {order && (
        <Card className="p-6 space-y-6">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">ID Pesanan</p>
              <p className="font-mono text-sm">{order.id}</p>
            </div>
            <Badge className="bg-gradient-primary text-primary-foreground capitalize">
              {steps.find((s) => s.key === order.payment_status)?.label}
            </Badge>
          </div>

          <Progress value={progress} className="h-2" />

          <div className="grid grid-cols-4 gap-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const active = i <= stepIdx;
              return (
                <div key={s.key} className="text-center">
                  <div className={`mx-auto h-10 w-10 grid place-items-center rounded-full ${active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-muted text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className={`text-xs mt-2 ${active ? "font-semibold" : "text-muted-foreground"}`}>{s.label}</p>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4 text-sm space-y-1">
            <p><span className="text-muted-foreground">Nama:</span> {order.customer_name}</p>
            <p><span className="text-muted-foreground">Metode:</span> {order.payment_method}</p>
            <p><span className="text-muted-foreground">Tanggal:</span> {new Date(order.created_at).toLocaleString("id-ID")}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
