import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Zap, Wallet, CheckCircle2, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/site/ProductCard";
import { supabase, type Product, type Testimonial } from "@/lib/supabase";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "Lucky Store — Kartu Perdana Siap Pakai Tanpa Registrasi" },
      { name: "description", content: "Beli kartu perdana siap aktif. Telkomsel, XL, Axis, Indosat, Tri, Smartfren. Praktis, cepat, aman." },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: products } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }).limit(6);
      return (data ?? []) as Product[];
    },
  });
  const { data: testimonials } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data } = await supabase.from("testimonials").select("*").limit(6);
      return (data ?? []) as Testimonial[];
    },
  });

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero opacity-90" />
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative container mx-auto px-4 py-20 md:py-32 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="bg-white/15 text-white border-white/20 backdrop-blur mb-5">
              <Star className="h-3 w-3 mr-1 fill-current" /> #1 Distributor Kartu Perdana
            </Badge>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Kartu Perdana <br />
              <span className="bg-gradient-to-r from-cyan-200 to-amber-200 bg-clip-text text-transparent">
                Siap Pakai Tanpa Registrasi
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/85 max-w-2xl mx-auto">
              Praktis, cepat digunakan, aman, dan siap langsung aktif. Cocok untuk gamer, reseller, OTP, dan kebutuhan harian.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow">
                <Link to="/produk">Beli Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white bg-white/5 hover:bg-white/15 backdrop-blur">
                <Link to="/produk">Lihat Produk</Link>
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-3 max-w-2xl mx-auto gap-4">
              {[
                { n: "10K+", l: "Pelanggan" },
                { n: "6", l: "Provider" },
                { n: "24/7", l: "Support" },
              ].map((s) => (
                <div key={s.l} className="glass rounded-xl p-4">
                  <p className="font-display text-2xl md:text-3xl font-bold text-white">{s.n}</p>
                  <p className="text-xs text-white/70 mt-1">{s.l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Zap, title: "Aktif Instan", desc: "Pasang dan langsung bisa internetan tanpa registrasi ulang." },
            { icon: Shield, title: "Aman & Resmi", desc: "Stok kartu dari distributor resmi, garansi tukar." },
            { icon: Wallet, title: "Harga Reseller", desc: "Murah, fleksibel, cocok untuk dipakai sendiri atau dijual." },
          ].map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className="p-6 hover:shadow-glow transition-shadow h-full">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold text-lg">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge variant="outline" className="mb-2">Produk Pilihan</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Kartu Perdana Terbaik</h2>
          </div>
          <Button asChild variant="ghost"><Link to="/produk">Lihat Semua <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
        </div>
        {!products?.length ? (
          <Card className="p-12 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto opacity-50 mb-3" />
            <p>Belum ada produk. Tambahkan produk dari admin dashboard.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>

      {/* TESTIMONIALS */}
      {!!testimonials?.length && (
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-2">Testimoni</Badge>
            <h2 className="font-display text-3xl md:text-4xl font-bold">Apa Kata Pelanggan</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.slice(0, 3).map((t, i) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="p-6 h-full hover:shadow-glow transition-shadow">
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: t.rating }).map((_, k) => <Star key={k} className="h-4 w-4 fill-gold text-gold" />)}
                  </div>
                  <p className="text-sm text-muted-foreground italic">"{t.message}"</p>
                  <div className="flex items-center gap-3 mt-4">
                    <Avatar><AvatarFallback className="bg-gradient-primary text-primary-foreground">{t.name[0]}</AvatarFallback></Avatar>
                    <p className="font-medium text-sm">{t.name}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-hero p-10 md:p-16 text-center">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="relative">
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white">Siap pakai dalam hitungan detik</h2>
            <p className="mt-3 text-white/85">Pesan sekarang dan langsung aktif di hari yang sama.</p>
            <Button asChild size="lg" className="mt-6 bg-white text-primary hover:bg-white/90 shadow-glow">
              <Link to="/produk">Mulai Belanja <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/80">
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Tanpa registrasi</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Pengiriman cepat</span>
              <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Garansi tukar</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
