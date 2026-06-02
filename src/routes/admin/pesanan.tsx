import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase, type Order, type ShippingStatus } from "@/lib/supabase";
import { getAdminOrders, updateAdminOrder } from "@/lib/admin.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatIDR } from "@/lib/cart";

export const Route = createFileRoute("/admin/pesanan")({
  component: AdminPesanan,
});

const shippingStatuses: ShippingStatus[] = ["menunggu_pembayaran", "diproses", "dikemas", "dikirim", "selesai"];
const labels: Record<string, string> = {
  menunggu_pembayaran: "Menunggu Bayar", diproses: "Diproses", dikemas: "Dikemas", dikirim: "Dikirim", selesai: "Selesai",
};

function AdminPesanan() {
  const qc = useQueryClient();
  const fetchOrders = useServerFn(getAdminOrders);
  const updateOrder = useServerFn(updateAdminOrder);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => fetchOrders(),
  });

  useEffect(() => {
    const ch = supabase.channel("orders-admin").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const updateShipping = async (id: string, shipping_status: string) => {
    try {
      await updateOrder({ data: { id, shipping_status } });
      toast.success("Status pengiriman diupdate");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal update status");
    }
  };

  const saveResi = async (id: string, tracking_number: string) => {
    try {
      await updateOrder({ data: { id, tracking_number: tracking_number || null } });
      toast.success("Resi tersimpan");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal simpan resi");
    }
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Pesanan</h1><p className="text-muted-foreground">Kelola pesanan + input resi (realtime)</p></div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr>
              <th className="text-left p-3">Invoice</th>
              <th className="text-left p-3">Pembeli</th>
              <th className="text-left p-3">Total</th>
              <th className="text-left p-3">Metode</th>
              <th className="text-left p-3">Bukti</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">No. Resi</th>
              <th className="text-left p-3">Tanggal</th>
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Memuat...</td></tr>}
              {!isLoading && !data?.length && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Belum ada pesanan</td></tr>}
              {data?.map((o) => <OrderRow key={o.id} o={o} onUpdateStatus={updateShipping} onSaveResi={saveResi} />)}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function OrderRow({ o, onUpdateStatus, onSaveResi }: { o: Order; onUpdateStatus: (id: string, s: string) => void; onSaveResi: (id: string, r: string) => void }) {
  const [resi, setResi] = useState(o.tracking_number ?? "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try { await onSaveResi(o.id, resi); } finally { setSaving(false); }
  };
  return (
    <tr className="border-t">
      <td className="p-3 font-mono text-xs">{o.invoice_number || o.id.slice(0, 8)}</td>
      <td className="p-3"><p className="font-medium">{o.customer_name}</p><p className="text-xs text-muted-foreground">{o.phone}</p></td>
      <td className="p-3 font-semibold">{formatIDR(Number(o.total_price || 0))}</td>
      <td className="p-3"><Badge variant="outline">{o.payment_method}</Badge></td>
      <td className="p-3">{o.proof_image ? <a href={o.proof_image} target="_blank" rel="noreferrer" className="text-primary underline text-xs">Lihat</a> : <span className="text-xs text-muted-foreground">-</span>}</td>
      <td className="p-3">
        <Select value={o.shipping_status} onValueChange={(v) => onUpdateStatus(o.id, v)}>
          <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{shippingStatuses.map((s) => <SelectItem key={s} value={s}>{labels[s]}</SelectItem>)}</SelectContent>
        </Select>
      </td>
      <td className="p-3">
        <div className="flex gap-1">
          <Input value={resi} onChange={(e) => setResi(e.target.value)} className="h-8 w-32" placeholder="Resi" />
          <Button size="sm" variant="outline" onClick={save} disabled={saving} className="h-8">{saving ? "..." : "OK"}</Button>
        </div>
      </td>
      <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("id-ID")}</td>
    </tr>
  );
}
