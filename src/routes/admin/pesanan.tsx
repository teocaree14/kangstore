import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase, type Order } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatIDR } from "@/lib/cart";

export const Route = createFileRoute("/admin/pesanan")({
  component: AdminPesanan,
});

const statuses = ["menunggu_pembayaran", "diproses", "dikirim", "selesai"] as const;
const labels: Record<string, string> = {
  menunggu_pembayaran: "Menunggu Bayar", diproses: "Diproses", dikirim: "Dikirim", selesai: "Selesai",
};

function AdminPesanan() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, product:products(*)").order("created_at", { ascending: false });
      return (data ?? []) as Order[];
    },
  });

  // Realtime updates
  useEffect(() => {
    const ch = supabase.channel("orders-admin").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ payment_status: status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status diupdate");
    qc.invalidateQueries({ queryKey: ["admin", "orders"] });
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Pesanan</h1><p className="text-muted-foreground">Kelola pesanan masuk (realtime)</p></div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="text-left p-3">ID</th><th className="text-left p-3">Pembeli</th><th className="text-left p-3">Produk</th><th className="text-left p-3">Metode</th><th className="text-left p-3">Bukti</th><th className="text-left p-3">Status</th><th className="text-left p-3">Tanggal</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Memuat...</td></tr>}
              {!isLoading && !data?.length && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Belum ada pesanan</td></tr>}
              {data?.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="p-3"><p className="font-medium">{o.customer_name}</p><p className="text-xs text-muted-foreground">{o.phone}</p></td>
                  <td className="p-3"><p className="font-medium">{o.product?.name ?? "-"}</p><p className="text-xs text-muted-foreground">{o.product ? formatIDR(o.product.price) : ""}</p></td>
                  <td className="p-3"><Badge variant="outline">{o.payment_method}</Badge></td>
                  <td className="p-3">{o.proof_image ? <a href={o.proof_image} target="_blank" rel="noreferrer" className="text-primary underline text-xs">Lihat</a> : <span className="text-xs text-muted-foreground">-</span>}</td>
                  <td className="p-3">
                    <Select value={o.payment_status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{labels[s]}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("id-ID")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
