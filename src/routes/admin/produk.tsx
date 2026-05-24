import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type Product } from "@/lib/supabase";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { formatIDR } from "@/lib/cart";

export const Route = createFileRoute("/admin/produk")({
  component: AdminProduk,
});

const providers = ["Telkomsel", "XL", "Axis", "Indosat", "Tri", "Smartfren"];
type FormState = {
  id?: string;
  name: string; provider: string; price: number; quota: string; active_period: string;
  description: string; image: string; stock: number;
};
const empty: FormState = { name: "", provider: "Telkomsel", price: 0, quota: "", active_period: "", description: "", image: "", stock: 1 };

function AdminProduk() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return (data ?? []) as Product[];
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [uploading, setUploading] = useState(false);

  const openEdit = (p?: Product) => {
    if (p) setForm({ id: p.id, name: p.name, provider: p.provider, price: p.price, quota: p.quota, active_period: p.active_period, description: p.description ?? "", image: p.image ?? "", stock: p.stock });
    else setForm(empty);
    setOpen(true);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const path = `products/${crypto.randomUUID()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setForm((f) => ({ ...f, image: data.publicUrl }));
      toast.success("Gambar diupload");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Upload gagal");
    } finally { setUploading(false); }
  };

  const save = async () => {
    if (!form.name || !form.price) return toast.error("Nama dan harga wajib diisi");
    const payload = { name: form.name, provider: form.provider, price: form.price, quota: form.quota, active_period: form.active_period, description: form.description, image: form.image || null, stock: form.stock };
    const { error } = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Disimpan");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus produk ini?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Dihapus");
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-display text-3xl font-bold">Produk</h1><p className="text-muted-foreground">Kelola katalog kartu perdana</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => openEdit()} className="bg-gradient-primary shadow-glow"><Plus className="h-4 w-4 mr-1" /> Tambah</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "Tambah"} Produk</DialogTitle></DialogHeader>
            <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
              <div><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Provider</Label>
                  <Select value={form.provider} onValueChange={(v) => setForm({ ...form, provider: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Harga</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
                <div><Label>Kuota</Label><Input value={form.quota} onChange={(e) => setForm({ ...form, quota: e.target.value })} placeholder="20GB" /></div>
                <div><Label>Masa Aktif</Label><Input value={form.active_period} onChange={(e) => setForm({ ...form, active_period: e.target.value })} placeholder="30 hari" /></div>
                <div><Label>Stok</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: +e.target.value })} /></div>
              </div>
              <div><Label>Deskripsi</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div>
                <Label>Gambar</Label>
                {form.image && <img src={form.image} alt="preview" className="h-24 w-24 rounded-lg object-cover mb-2" />}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed p-3 hover:bg-muted/30 text-sm">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                  <Upload className="h-4 w-4" /> {uploading ? "Mengupload..." : "Upload gambar"}
                </label>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={save} className="bg-gradient-primary">Simpan</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50"><tr><th className="text-left p-3">Produk</th><th className="text-left p-3">Provider</th><th className="text-left p-3">Harga</th><th className="text-left p-3">Stok</th><th className="text-right p-3">Aksi</th></tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Memuat...</td></tr>}
              {!isLoading && !data?.length && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Belum ada produk</td></tr>}
              {data?.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3"><div className="flex items-center gap-3">{p.image ? <img src={p.image} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-gradient-primary" />}<div><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.quota} · {p.active_period}</p></div></div></td>
                  <td className="p-3">{p.provider}</td>
                  <td className="p-3 font-semibold">{formatIDR(p.price)}</td>
                  <td className="p-3">{p.stock}</td>
                  <td className="p-3 text-right">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
