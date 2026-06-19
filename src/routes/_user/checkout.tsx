import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Copy, Upload, QrCode, AlertTriangle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { formatIDR, useCart } from "@/lib/cart";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { createQrisOrder, getOrderPaymentStatus } from "@/lib/midtrans.functions";

declare global {
  interface Window {
    snap?: {
      pay: (token: string, options?: Record<string, unknown>) => void;
    };
  }
}

const MIDTRANS_CLIENT_KEY = "Mid-client-JzzMAf3oHGoDyRWI";
const MIDTRANS_SNAP_SCRIPT_URL = "https://app.midtrans.com/snap/snap.js";

function loadMidtransSnap() {
  if (window.snap) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("midtrans-snap-js") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Snap Midtrans gagal dimuat.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = "midtrans-snap-js";
    script.src = MIDTRANS_SNAP_SCRIPT_URL;
    script.setAttribute("data-client-key", MIDTRANS_CLIENT_KEY);
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Snap Midtrans gagal dimuat."));
    document.body.appendChild(script);
  });
}

export const Route = createFileRoute("/_user/checkout")({
  component: CheckoutPage,
});

const MIN_QTY = 25;

const schema = z.object({
  customer_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  phone: z.string().trim().regex(/^[0-9+]{8,20}$/, "Nomor HP tidak valid"),
  address: z.string().trim().min(5, "Alamat minimal 5 karakter").max(500),
  payment_method: z.enum(["QRIS", "BCA", "DANA"]),
});

function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.total());
  const count = useCart((s) => s.count());
  const setQty = useCart((s) => s.setQty);
  const clear = useCart((s) => s.clear);
  const [form, setForm] = useState({ customer_name: "", phone: "", address: "", payment_method: "QRIS" as "QRIS" | "BCA" | "DANA" });
  const [proof, setProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [qris, setQris] = useState<{ orderId: string; qrUrl: string | null; qrString: string | null; snapToken?: string | null; total: number; invoice: string } | null>(null);
  const [qrisStatus, setQrisStatus] = useState<"pending" | "paid" | "failed">("pending");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const createQris = useServerFn(createQrisOrder);
  const checkStatus = useServerFn(getOrderPaymentStatus);

  const belowMin = count < MIN_QTY;
  const qrisIsSnap = !!qris?.qrUrl && !qris.qrUrl.startsWith("data:image");

  useEffect(() => {
    if (!authLoading && !user) nav({ to: "/login", search: { redirect: path } });
  }, [authLoading, user, nav, path]);

  const copy = (v: string, l: string) => { navigator.clipboard.writeText(v); toast.success(`${l} disalin`); };

  const openSnapPayment = async (token: string, redirectUrl: string | null, orderId: string) => {
    try {
      await loadMidtransSnap();
      window.snap?.pay(token, {
        onSuccess: () => {
          clear();
          nav({ to: "/dashboard/pesanan/$id", params: { id: orderId } });
        },
        onPending: () => toast.info("QRIS menunggu pembayaran."),
        onClose: () => toast.info("Pembayaran belum selesai. Anda bisa melanjutkan dari riwayat pesanan."),
        onError: () => {
          if (redirectUrl) window.location.href = redirectUrl;
        },
      });
    } catch (e) {
      console.error("[midtrans snap] open failed:", e);
      if (redirectUrl) window.location.href = redirectUrl;
      else toast.error(e instanceof Error ? e.message : "Gagal membuka pembayaran QRIS.");
    }
  };

  const submit = async () => {
    if (!user) return toast.error("Anda harus login");
    if (!items.length) return toast.error("Keranjang kosong");
    if (belowMin) return toast.error(`Minimal pembelian adalah ${MIN_QTY} pcs.`);
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    try {
      // QRIS otomatis via Midtrans
      if (form.payment_method === "QRIS") {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) throw new Error("Sesi tidak valid, silakan login ulang.");
        const res = await createQris({
          data: {
            authToken: token,
            customer_name: form.customer_name,
            phone: form.phone,
            address: form.address,
            total,
            items: items.map((i) => ({
              product_id: i.product.id,
              product_name: i.product.name,
              price: i.product.price,
              quantity: i.qty,
            })),
          },
        });
        setQris({
          orderId: res.order_id,
          qrUrl: res.qr_url ?? null,
          qrString: res.qr_string ?? null,
          snapToken: res.snap_token ?? null,
          total: res.total,
          invoice: res.invoice,
        });
        setQrisStatus("pending");
        toast.success("QRIS siap dibayar. Scan untuk membayar.");
        if (res.snap_token) void openSnapPayment(res.snap_token, res.qr_url ?? null, res.order_id);
        return;
      }

      // Manual transfer (BCA/DANA)
      let proof_url: string | null = null;
      if (proof) {
        const ext = proof.name.split(".").pop();
        const pPath = `proofs/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product-images").upload(pPath, proof);
        if (upErr) {
          console.error("[checkout] upload proof error:", upErr);
          toast.warning("Bukti transfer belum terupload, pesanan tetap diproses.");
        } else {
          proof_url = supabase.storage.from("product-images").getPublicUrl(pPath).data.publicUrl;
        }
      }

      const invoice = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
      const orderId = crypto.randomUUID();

      const { error } = await supabase.from("orders").insert({
        id: orderId,
        user_id: user.id,
        customer_name: form.customer_name,
        phone: form.phone,
        address: form.address,
        product_id: items[0].product.id,
        payment_method: form.payment_method,
        payment_status: "menunggu_pembayaran",
        shipping_status: "menunggu_pembayaran",
        proof_image: proof_url,
        invoice_number: invoice,
        total_price: total,
      });
      if (error) {
        console.error("[checkout] insert order error:", error);
        throw new Error(`Order gagal disimpan: ${error.message}${error.hint ? ` (${error.hint})` : ""}`);
      }

      const { error: itErr } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: orderId,
          product_id: i.product.id,
          product_name: i.product.name,
          quantity: i.qty,
          price: i.product.price,
        }))
      );
      if (itErr) {
        console.error("[checkout] insert order_items error:", itErr);
        toast.warning("Pesanan berhasil, tetapi detail item belum tersimpan lengkap.");
      }

      clear();
      toast.success("Pesanan berhasil dibuat!", {
        description: "Silakan cek status pesanan di Dashboard akun Anda.",
        duration: 6000,
      });
      nav({ to: "/dashboard/pesanan/$id", params: { id: orderId } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gagal membuat pesanan";
      console.error("[checkout] submit failed:", e);
      toast.error(msg, { duration: 8000 });
    } finally {
      setLoading(false);
    }
  };

  // Poll QRIS payment status
  useEffect(() => {
    if (!qris || qrisStatus !== "pending") return;
    pollRef.current = setInterval(async () => {
      try {
        const row = await checkStatus({ data: { orderId: qris.orderId } });
        if (row.payment_status === "lunas") {
          setQrisStatus("paid");
          clear();
          toast.success("Pembayaran berhasil!", {
            description: "Pesanan Anda telah masuk. Cek dashboard untuk detail.",
            duration: 6000,
          });
          setTimeout(() => nav({ to: "/dashboard/pesanan/$id", params: { id: qris.orderId } }), 1500);
        } else if (row.payment_status === "gagal") {
          setQrisStatus("failed");
          toast.error("Pembayaran gagal atau kedaluwarsa.");
        }
      } catch (e) {
        console.error("[qris poll]", e);
      }
    }, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [qris, qrisStatus, checkStatus, clear, nav]);

  if (authLoading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-12">
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">Checkout</h1>
      <p className="text-muted-foreground mb-6">Total {count} pcs · Minimal pembelian {MIN_QTY} pcs</p>

      {belowMin && items.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Belum memenuhi minimal pembelian</AlertTitle>
          <AlertDescription>
            Minimal pembelian adalah <strong>{MIN_QTY} pcs</strong>. Saat ini di keranjang ada <strong>{count} pcs</strong>. Tambahkan {MIN_QTY - count} pcs lagi untuk lanjut checkout.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Keranjang</h2>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Keranjang kosong</p>
            ) : items.map((i) => (
              <div key={i.product.id} className="flex items-center gap-3 border-b pb-3 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{i.product.name}</p>
                  <p className="text-xs text-muted-foreground">{i.product.provider} · {formatIDR(i.product.price)}/pcs</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.product.id, i.qty - 1)}>-</Button>
                  <Input type="number" min={1} value={i.qty} onChange={(e) => setQty(i.product.id, Math.max(1, Number(e.target.value)))} className="h-7 w-16 text-center" />
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setQty(i.product.id, i.qty + 1)}>+</Button>
                </div>
                <p className="font-semibold w-24 text-right text-sm">{formatIDR(i.product.price * i.qty)}</p>
              </div>
            ))}
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Data Pembeli</h2>
            <div><Label>Nama Lengkap</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="Nama lengkap" /></div>
            <div><Label>Nomor HP / WhatsApp</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxxxxxxxxx" /></div>
            <div><Label>Alamat Pengiriman</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat lengkap" rows={3} /></div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Metode Pembayaran</h2>
            <RadioGroup value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v as "QRIS" | "BCA" | "DANA" })} className="grid sm:grid-cols-3 gap-3">
              <Label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${form.payment_method === "QRIS" ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value="QRIS" className="mt-1" />
                <div><p className="font-semibold">QRIS</p><p className="text-xs text-muted-foreground">Otomatis · GoPay/OVO/Dana/BCA</p></div>
              </Label>
              <Label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${form.payment_method === "BCA" ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value="BCA" className="mt-1" />
                <div><p className="font-semibold">Transfer BCA</p><p className="text-xs text-muted-foreground">Manual</p></div>
              </Label>
              <Label className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${form.payment_method === "DANA" ? "border-primary bg-primary/5" : ""}`}>
                <RadioGroupItem value="DANA" className="mt-1" />
                <div><p className="font-semibold">DANA</p><p className="text-xs text-muted-foreground">Manual</p></div>
              </Label>
            </RadioGroup>

            {form.payment_method === "QRIS" ? (
              <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                {qris ? (
                  <div className="flex flex-col items-center text-center gap-3">
                    {qrisStatus === "paid" ? (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <CheckCircle2 className="h-16 w-16 text-green-600" />
                        <p className="font-semibold text-lg">Pembayaran Berhasil!</p>
                        <p className="text-sm text-muted-foreground">Mengalihkan ke dashboard...</p>
                      </div>
                    ) : qrisStatus === "failed" ? (
                      <div className="flex flex-col items-center gap-2 py-6">
                        <XCircle className="h-16 w-16 text-destructive" />
                        <p className="font-semibold text-lg">Pembayaran Gagal</p>
                        <p className="text-sm text-muted-foreground">Silakan tekan tombol ringkasan untuk membuat QR baru.</p>
                      </div>
                    ) : (
                      <>
                        {qris.qrUrl && qrisIsSnap ? (
                          <div className="w-full max-w-md rounded-lg border bg-background p-4 space-y-3">
                            <QrCode className="h-16 w-16 mx-auto text-primary" />
                            <p className="text-sm font-medium">Pembayaran QRIS dibuka melalui Midtrans.</p>
                            <Button type="button" variant="outline" onClick={() => qris.snapToken ? openSnapPayment(qris.snapToken, qris.qrUrl, qris.orderId) : window.open(qris.qrUrl!, "_blank", "noopener,noreferrer")}>
                              Buka Pembayaran QRIS
                            </Button>
                          </div>
                        ) : qris.qrUrl ? (
                          <img src={qris.qrUrl} alt="QRIS" className="h-64 w-64 rounded-lg border bg-white p-2" />
                        ) : (
                          <div className="h-64 w-64 grid place-items-center rounded-lg bg-background border text-center p-4"><div><QrCode className="h-20 w-20 text-muted-foreground mx-auto mb-2" /><p className="text-xs text-muted-foreground">QR belum tersedia. Coba buat ulang pesanan.</p></div></div>
                        )}
                        <p className="text-sm">{qrisIsSnap ? "Pilih GoPay QRIS lalu scan QRIS dari halaman Midtrans." : "Scan QR di atas dengan aplikasi e-wallet/bank Anda."}</p>
                        <p className="text-xs text-muted-foreground">Invoice: <strong>{qris.invoice}</strong> · Total: <strong>{formatIDR(qris.total)}</strong></p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" /> Menunggu pembayaran...
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">QR akan muncul setelah Anda menekan tombol <strong>Bayar Sekarang</strong>. Sistem akan otomatis mendeteksi pembayaran Anda.</p>
                )}
              </div>
            ) : (
              <>
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
                </div>
                <div>
                  <Label>Upload Bukti Transfer (opsional)</Label>
                  <label className="mt-1 block cursor-pointer rounded-xl border-2 border-dashed p-4 hover:bg-muted/30 transition-colors text-center">
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
                    <Upload className="h-5 w-5 mx-auto text-muted-foreground" />
                    <p className="text-sm mt-1">{proof ? proof.name : "Klik untuk upload bukti transfer"}</p>
                  </label>
                </div>
              </>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-24 space-y-4">
            <h2 className="font-semibold text-lg">Ringkasan</h2>
            <div className="flex justify-between text-sm"><span>Total item</span><span>{count} pcs</span></div>
            <div className="flex justify-between text-sm"><span>Minimal</span><span>{MIN_QTY} pcs</span></div>
            <div className="border-t pt-3 flex justify-between font-bold">
              <span>Total</span><span className="text-gradient">{formatIDR(total)}</span>
            </div>
            <Button onClick={submit} disabled={loading || !items.length || belowMin || (form.payment_method === "QRIS" && !!qris && qrisStatus === "pending")} className="w-full bg-gradient-primary shadow-glow" size="lg">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</> : belowMin ? `Minimal ${MIN_QTY} pcs` : form.payment_method === "QRIS" ? (qrisStatus === "failed" ? "Buat QR Baru" : qris ? "Menunggu Pembayaran" : "Bayar Sekarang") : "Saya Sudah Bayar"}
            </Button>
            {belowMin && <p className="text-xs text-destructive text-center">Tombol aktif setelah keranjang ≥ {MIN_QTY} pcs.</p>}
          </Card>
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
