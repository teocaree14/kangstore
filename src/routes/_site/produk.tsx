import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase, type Product } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useRealtimeProducts } from "@/hooks/use-realtime-products";

export const Route = createFileRoute("/_site/produk")({
  head: () => ({
    meta: [
      { title: "Produk Kartu Perdana — Lucky Store" },
      { name: "description", content: "Daftar lengkap kartu perdana siap pakai dari Telkomsel, XL, Axis, Indosat, Tri, Smartfren." },
    ],
  }),
  component: ProdukPage,
});

const providers = ["Semua", "Telkomsel", "XL", "Axis", "Indosat", "Tri", "Smartfren"];
const sortOpts = [
  { v: "newest", l: "Terbaru" },
  { v: "price_asc", l: "Harga Termurah" },
  { v: "price_desc", l: "Harga Tertinggi" },
];

function ProdukPage() {
  const [q, setQ] = useState("");
  const [provider, setProvider] = useState("Semua");
  const [sort, setSort] = useState("newest");

  useRealtimeProducts();

  const { data, isLoading, error } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const filtered = useMemo(() => {
    let list = data ?? [];
    if (provider !== "Semua") list = list.filter((p) => p.provider === provider);
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (sort === "price_asc") list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === "price_desc") list = [...list].sort((a, b) => b.price - a.price);
    else list = [...list].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return list;
  }, [data, q, provider, sort]);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-bold">Semua Produk</h1>
        <p className="text-muted-foreground mt-1">{filtered.length} kartu perdana siap kirim</p>
      </div>

      <Card className="p-4 mb-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari produk..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={provider} onValueChange={setProvider}>
          <SelectTrigger className="md:w-48"><SelectValue placeholder="Provider" /></SelectTrigger>
          <SelectContent>{providers.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{sortOpts.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
        </Select>
      </Card>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
        </div>
      ) : !filtered.length ? (
        <Card className="p-12 text-center text-muted-foreground">Belum ada produk yang cocok.</Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}
