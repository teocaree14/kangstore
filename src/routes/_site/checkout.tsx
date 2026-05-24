import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Copy, CheckCircle2, Upload, QrCode } from "lucide-react";
import { toast } from "sonner";
import { formatIDR, useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/_site/checkout")({
  component: CheckoutPage,
});

const schema = z.object({
  customer_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  phone: z.string().trim().regex(/^[0-9+]{8,20}$/, "Nomor HP tidak valid"),
  address: z.string().trim().min(5, "Alamat minimal 5 karakter").max(500),
  payment_method: z.enum(["BCA", "DANA"]),
});

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const clear = useCart((s) => s.clear);
  const [form, setForm] = useState({ customer_name: "", phone: "", address: "", payment_method: "BCA" as "BCA" | "DANA" });
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const copy = (v: string, l: string) => { navigator.clipboard.writeText(v); toast.success(`${l} disalin`); };

  const submit = async () => {
    if (!items.length) return toast.error("Keranjang kosong");
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    try {
      let proof_url: string | null = null;
      if (proof) {
        const ext = proof.name.split(".").pop();
        const path = `proofs/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(path, proof);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
        proof_url = pub.publicUrl;
      }
      // Create one order per item (simple model)
      const rows = items.map((i) => ({
        customer_name: form.customer_name,
        phone: form.phone,
        product_id: i.product.id,
        payment_method: form.payment_method,
        payment_status: "menunggu_pembayaran" as const,
        proof_image: proof_url,
      }));
      const { data, error } = await supabase.from("orders").insert(rows).select("id");
      if (error) throw error;
      clear();
      setSuccess(data?.[0]?.id ?? null);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal membuat pesanan";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-8">Checkout</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Data Pembeli</h2>
            <div><Label>Nama Lengkap</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Nama lengkap" /></div>
            <div><Label>Nomor HP / WhatsApp</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" /></div>
            <div><Label>Alamat Pengiriman</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat lengkap" rows={3} /></div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Metode Pembayaran</h2>
            <RadioGroup value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v as "BCA" | "DANA" })} className="grid sm:grid-cols-2 gap-3">
              <Label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${form.payment_method === "BCA" ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value="BCA" className="mt-1" />
                <div><p className="font-semibold">Transfer Bank BCA</p><p className="text-xs text-muted-foreground">a/n Lucky Hendrawan Trenadi</p></div>
              </Label>
              <Label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${form.payment_method === "DANA" ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value="DANA" className="mt-1" />
                <div><p className="font-semibold">DANA</p><p className="text-xs text-muted-foreground">a/n Ipatul Hasanah</p></div>
              </Label>
            </RadioGroup>

            <div className="rounded-xl bg-muted/50 p-4 space-y-3">
              {form.payment_method === "BCA" ? (
                <>
                  <div className="flex justify-between items-center">
                    <div><p className="text-xs text-muted-foreground">Bank BCA</p><p className="font-mono text-lg font-bold">4070383069</p></div>
                    <Button size="sm" variant="outline" onClick={() => copy("4070383069", "Nomor rekening")}><Copy className="h-3 w-3 mr-1" /> Salin</Button>
                  </div>
                  <p className="text-sm">a/n <strong>Lucky Hendrawan Trenadi</strong></p>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <div><p className="text-xs text-muted-foreground">DANA</p><p className="font-mono text-lg font-bold">087840395627</p></div>
                    <Button size="sm" variant="outline" onClick={() => copy("087840395627", "Nomor DANA")}><Copy className="h-3 w-3 mr-1" /> Salin</Button>
                  </div>
                  <p className="text-sm">a/n <strong>Ipatul Hasanah</strong></p>
                </>
              )}
              <div className="flex items-center gap-3 pt-2">
                <div className="h-24 w-24 grid place-items-center rounded-lg bg-background border border-dashed">
                  <QrCode className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">QR pembayaran tersedia di halaman ini setelah konfirmasi pesanan.</p>
              </div>
            </div>

            <div>
              <Label>Upload Bukti Transfer (opsional)</Label>
              <div className="mt-1 flex items-center gap-3">
                <label className="flex-1 cursor-pointer rounded-xl border-2 border-dashed p-4 hover:bg-muted/30 transition-colors text-center">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
                  <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
                  <p className="text-sm mt-1">{proof ? proof.name : "Klik untuk upload bukti transfer"}</p>
                </label>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24 space-y-4">
            <h2 className="font-semibold text-lg">Ringkasan Pesanan</h2>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Keranjang kosong</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-auto">
                {items.map((i) => (
                  <div key={i.product.id} className="flex justify-between text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{i.product.name}</p>
                      <p className="text-xs text-muted-foreground">{i.product.provider} × {i.qty}</p>
                    </div>
                    <p className="font-semibold whitespace-nowrap">{formatIDR(i.product.price * i.qty)}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span><span className="text-gradient">{formatIDR(total)}</span>
            </div>
            <Button onClick={submit} disabled={loading || !items.length} className="w-full bg-gradient-primary shadow-glow" size="lg">
              {loading ? "Memproses..." : "Saya Sudah Bayar"}
            </Button>
          </Card>
        </div>
      </div>

      <Dialog open={!!success} onOpenChange={(o) => !o && (window.location.href = "/")}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto h-16 w-16 grid place-items-center rounded-full bg-success/15 text-success mb-2">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <DialogTitle className="text-center">Pesanan Berhasil Dibuat!</DialogTitle>
            <DialogDescription className="text-center">
              ID Pesanan: <Badge variant="outline" className="font-mono">{success?.slice(0, 8)}</Badge><br />
              Tim kami akan memverifikasi pembayaran kamu segera.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button variant="outline" onClick={() => (window.location.href = "/")}>Beranda</Button>
            <Button className="bg-gradient-primary" onClick={() => (window.location.href = `/status?id=${success}`)}>Lihat Status</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
