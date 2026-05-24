import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Product } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductCard } from "@/components/site/ProductCard";
import { CheckCircle2, ShoppingCart, Zap } from "lucide-react";
import { formatIDR, useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/_site/produk/$id")({
  component: DetailPage,
});

function DetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const add = useCart((s) => s.add);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      return data as Product | null;
    },
  });

  const { data: related } = useQuery({
    queryKey: ["products", "related", product?.provider],
    queryFn: async () => {
      if (!product) return [];
      const { data } = await supabase.from("products").select("*").eq("provider", product.provider).neq("id", id).limit(3);
      return (data ?? []) as Product[];
    },
    enabled: !!product,
  });

  if (isLoading) return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Memuat...</div>;
  if (!product) return <div className="container mx-auto px-4 py-20 text-center">Produk tidak ditemukan</div>;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="space-y-3">
          <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-primary shadow-glow relative">
            {product.image ? (
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-white text-center">
                <div>
                  <p className="font-display text-5xl font-bold">{product.provider}</p>
                  <p className="text-xl opacity-90 mt-2">{product.quota}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <Badge variant="outline">{product.provider}</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">{product.name}</h1>
            <p className="font-display text-4xl font-bold text-gradient mt-3">{formatIDR(product.price)}</p>
          </div>

          <Card className="p-4 grid grid-cols-3 gap-4 text-center">
            <div><p className="text-xs text-muted-foreground">Kuota</p><p className="font-semibold mt-1">{product.quota}</p></div>
            <div><p className="text-xs text-muted-foreground">Masa Aktif</p><p className="font-semibold mt-1">{product.active_period}</p></div>
            <div><p className="text-xs text-muted-foreground">Stok</p><p className="font-semibold mt-1 text-success">{product.stock > 0 ? `${product.stock} Ready` : "Habis"}</p></div>
          </Card>

          <div className="space-y-2 text-sm">
            <p className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Tanpa registrasi ulang</p>
            <p className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Bisa untuk OTP & verifikasi</p>
            <p className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-success" /> Pengiriman cepat hari yang sama</p>
          </div>

          <div className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="lg" variant="outline" className="flex-1" onClick={() => { add(product); toast.success("Ditambah ke keranjang"); }}>
              <ShoppingCart className="h-4 w-4 mr-2" /> Tambah Keranjang
            </Button>
            <Button size="lg" className="flex-1 bg-gradient-primary shadow-glow" onClick={() => { add(product); navigate({ to: "/checkout" }); }}>
              <Zap className="h-4 w-4 mr-2" /> Beli Langsung
            </Button>
          </div>

          <Accordion type="single" collapsible className="border rounded-xl px-4">
            <AccordionItem value="1"><AccordionTrigger>Apakah kartu sudah aktif?</AccordionTrigger><AccordionContent>Ya, kartu sudah aktif dan siap pakai tanpa perlu registrasi ulang.</AccordionContent></AccordionItem>
            <AccordionItem value="2"><AccordionTrigger>Apakah bisa untuk OTP?</AccordionTrigger><AccordionContent>Bisa, kartu bisa menerima SMS OTP & verifikasi aplikasi.</AccordionContent></AccordionItem>
            <AccordionItem value="3" className="border-b-0"><AccordionTrigger>Berapa lama pengiriman?</AccordionTrigger><AccordionContent>1–2 hari kerja via JNE/J&T, atau same-day untuk area tertentu.</AccordionContent></AccordionItem>
          </Accordion>
        </div>
      </div>

      {!!related?.length && (
        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold mb-6">Produk Terkait</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}

      <div className="mt-10 text-center">
        <Button asChild variant="ghost"><Link to="/produk">← Kembali ke produk</Link></Button>
      </div>
    </div>
  );
}
