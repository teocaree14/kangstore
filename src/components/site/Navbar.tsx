import { Link, useRouterState } from "@tanstack/react-router";
import { Moon, Sun, ShoppingCart, Search, Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { useTheme } from "@/lib/theme";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatIDR } from "@/lib/cart";
import { Badge } from "@/components/ui/badge";

const links = [
  { to: "/", label: "Home" },
  { to: "/produk", label: "Produk" },
  { to: "/tentang", label: "Tentang" },
  { to: "/testimoni", label: "Testimoni" },
  { to: "/faq", label: "FAQ" },
  { to: "/kontak", label: "Kontak" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const count = useCart((s) => s.count());
  const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const total = useCart((s) => s.total());
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 w-full glass border-b">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>Lucky<span className="text-gradient">Store</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors hover:text-primary ${
                path === l.to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex relative ml-auto w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari kartu perdana..." className="pl-9 bg-background/50" />
        </div>

        <div className="flex items-center gap-1 ml-auto lg:ml-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
                <ShoppingCart className="h-4 w-4" />
                {count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-gradient-primary text-primary-foreground">
                    {count}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <SheetHeader><SheetTitle>Keranjang ({count})</SheetTitle></SheetHeader>
              <div className="flex-1 overflow-auto py-4 space-y-3">
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Keranjang kosong</p>
                ) : items.map((i) => (
                  <div key={i.product.id} className="flex gap-3 rounded-lg border p-3">
                    <div className="h-14 w-14 rounded-md bg-gradient-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{i.product.name}</p>
                      <p className="text-xs text-muted-foreground">{i.product.provider} · {i.product.quota}</p>
                      <p className="text-sm font-semibold text-primary mt-1">{formatIDR(i.product.price)} × {i.qty}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(i.product.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              {items.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total</span><span className="text-primary">{formatIDR(total)}</span>
                  </div>
                  <Link to="/checkout"><Button className="w-full bg-gradient-primary shadow-glow">Checkout</Button></Link>
                </div>
              )}
            </SheetContent>
          </Sheet>

          <Button asChild className="hidden md:inline-flex bg-gradient-primary shadow-glow ml-2">
            <Link to="/produk">Beli Sekarang</Link>
          </Button>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden border-t glass">
          <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}
                className={`px-3 py-2 rounded-md text-sm ${path === l.to ? "bg-primary/10 text-primary" : ""}`}>
                {l.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
