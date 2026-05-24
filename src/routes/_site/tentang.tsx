import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Shield, Zap, Wallet, Users } from "lucide-react";

export const Route = createFileRoute("/_site/tentang")({
  head: () => ({ meta: [{ title: "Tentang Kami — Lucky Store" }, { name: "description", content: "Distributor kartu perdana siap pakai terpercaya." }] }),
  component: () => (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <h1 className="font-display text-4xl md:text-5xl font-bold">Tentang <span className="text-gradient">Lucky Store</span></h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Lucky Store adalah distributor kartu perdana siap pakai dari semua provider utama Indonesia. Kami melayani pengguna internet, gamer, reseller, kebutuhan sosial media, OTP & verifikasi sejak 2020.
      </p>
      <div className="mt-10 grid sm:grid-cols-2 gap-5">
        {[
          { icon: Zap, t: "Aktif Instan", d: "Tanpa registrasi ulang, langsung bisa internetan." },
          { icon: Shield, t: "Stok Resmi", d: "Dari distributor resmi dengan garansi tukar." },
          { icon: Wallet, t: "Harga Reseller", d: "Cocok dipakai sendiri maupun dijual kembali." },
          { icon: Users, t: "Support 24/7", d: "Tim CS responsif via WhatsApp setiap saat." },
        ].map((f) => (
          <Card key={f.t} className="p-5">
            <div className="h-10 w-10 grid place-items-center rounded-lg bg-gradient-primary text-primary-foreground"><f.icon className="h-5 w-5" /></div>
            <h3 className="mt-3 font-semibold">{f.t}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
          </Card>
        ))}
      </div>
    </div>
  ),
});
