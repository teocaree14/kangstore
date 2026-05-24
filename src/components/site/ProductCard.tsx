import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ShoppingCart, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatIDR, useCart } from "@/lib/cart";
import { toast } from "sonner";
import type { Product } from "@/lib/supabase";

const providerColors: Record<string, string> = {
  Telkomsel: "from-red-500 to-rose-600",
  XL: "from-sky-500 to-blue-600",
  Axis: "from-violet-500 to-purple-600",
  Indosat: "from-amber-500 to-yellow-600",
  Tri: "from-fuchsia-500 to-pink-600",
  Smartfren: "from-orange-500 to-red-600",
};

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const add = useCart((s) => s.add);
  const grad = providerColors[product.provider] ?? "from-primary to-cyan-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group overflow-hidden border bg-card shadow-card hover:shadow-glow transition-all hover:-translate-y-1 p-0">
        <Link to="/produk/$id" params={{ id: product.id }} className="block">
          <div className={`relative aspect-[4/3] bg-gradient-to-br ${grad} overflow-hidden`}>
            {product.image ? (
              <img src={product.image} alt={product.name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-white">
                <div className="text-center">
                  <p className="font-display text-3xl font-bold">{product.provider}</p>
                  <p className="text-sm opacity-90 mt-1">{product.quota}</p>
                </div>
              </div>
            )}
            <Badge className="absolute top-3 right-3 bg-success text-success-foreground border-0">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
            </Badge>
          </div>
        </Link>
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">{product.provider}</p>
            <h3 className="font-semibold leading-tight line-clamp-1">{product.name}</h3>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{product.quota}</span>
            <span>{product.active_period}</span>
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="font-display text-lg font-bold text-gradient">{formatIDR(product.price)}</span>
            <Button
              size="sm"
              className="bg-gradient-primary shadow-glow"
              onClick={() => { add(product); toast.success("Ditambahkan ke keranjang"); }}
            >
              <ShoppingCart className="h-4 w-4 mr-1" /> Beli
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
