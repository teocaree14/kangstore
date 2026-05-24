import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase, type Testimonial } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/testimoni")({
  component: AdminTestimoni,
});

function AdminTestimoni() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "testimonials"],
    queryFn: async () => {
      const { data } = await supabase.from("testimonials").select("*").order("id", { ascending: false });
      return (data ?? []) as Testimonial[];
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", rating: 5, message: "" });

  const save = async () => {
    if (!form.name || !form.message) return toast.error("Lengkapi data");
    const { error } = await supabase.from("testimonials").insert({ name: form.name, rating: form.rating, message: form.message });
    if (error) return toast.error(error.message);
    toast.success("Disimpan");
    setOpen(false); setForm({ name: "", rating: 5, message: "" });
    qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Hapus?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "testimonials"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div><h1 className="font-display text-3xl font-bold">Testimoni</h1><p className="text-muted-foreground">Kelola testimoni pelanggan</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="bg-gradient-primary shadow-glow"><Plus className="h-4 w-4 mr-1" /> Tambah</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Testimoni</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nama</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Rating</Label><Input type="number" min={1} max={5} value={form.rating} onChange={(e) => setForm({ ...form, rating: Math.min(5, Math.max(1, +e.target.value)) })} /></div>
              <div><Label>Pesan</Label><Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Batal</Button><Button onClick={save} className="bg-gradient-primary">Simpan</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!data?.length && <Card className="p-12 text-center text-muted-foreground col-span-full">Belum ada testimoni</Card>}
        {data?.map((t) => (
          <Card key={t.id} className="p-5">
            <div className="flex gap-1 mb-2">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-gold text-gold" />)}</div>
            <p className="text-sm italic">"{t.message}"</p>
            <div className="flex justify-between items-center mt-3"><p className="text-sm font-medium">{t.name}</p><Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
          </Card>
        ))}
      </div>
    </div>
  );
}
