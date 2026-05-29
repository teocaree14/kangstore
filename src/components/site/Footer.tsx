import { Link } from "@tanstack/react-router";
import { Instagram, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t mt-24 bg-card/50">
      <div className="container mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            Lucky<span className="text-gradient">Store</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm">
            Kartu perdana siap pakai tanpa registrasi. Praktis, cepat, aman, dan siap langsung aktif.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Navigasi</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/produk" className="hover:text-primary">Produk</Link></li>
            <li><Link to="/tentang" className="hover:text-primary">Tentang Kami</Link></li>
            <li><Link to="/faq" className="hover:text-primary">FAQ</Link></li>
            <li><Link to="/kontak" className="hover:text-primary">Kontak</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Sosial</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="https://wa.me/6287840395627" target="_blank" rel="noreferrer" className="hover:text-primary">WhatsApp</a></li>
            <li><a href="#" className="hover:text-primary inline-flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</a></li>
            <li><a href="#" className="hover:text-primary">TikTok</a></li>
            <li><Link to="/status" search={{ id: "" }} className="hover:text-primary">Cek Status Pesanan</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Lucky Store. All rights reserved.</p>
          <p>Privacy Policy · Terms of Service</p>
        </div>
      </div>
    </footer>
  );
}
