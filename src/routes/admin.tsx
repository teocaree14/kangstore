import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, ShoppingBag, LogOut, Sparkles, MessageSquareQuote } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const menu = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/produk", label: "Produk", icon: Package },
  { to: "/admin/pesanan", label: "Pesanan", icon: ShoppingBag },
  { to: "/admin/testimoni", label: "Testimoni", icon: MessageSquareQuote },
];

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Memuat...</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center p-4 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Akses Ditolak</h1>
          <p className="text-muted-foreground mt-2">Akun <strong>{user.email}</strong> belum diberi role admin.</p>
          <p className="text-xs text-muted-foreground mt-1">Jalankan SQL di Supabase untuk memberikan role admin pada email ini.</p>
          <Button asChild className="mt-4"><Link to="/">Kembali</Link></Button>
        </div>
      </div>
    );
  }

  const logout = async () => { await supabase.auth.signOut(); toast.success("Logout berhasil"); nav({ to: "/login" }); };

  return (
    <div className="min-h-screen grid md:grid-cols-[240px_1fr] bg-muted/30">
      <aside className="border-r bg-card flex flex-col">
        <div className="p-5 border-b">
          <Link to="/" className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow"><Sparkles className="h-4 w-4" /></span>
            Lucky<span className="text-gradient">Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {menu.map((m) => {
            const active = m.exact ? path === m.to : path.startsWith(m.to);
            return (
              <Link key={m.to} to={m.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "hover:bg-accent"}`}>
                <m.icon className="h-4 w-4" /> {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t">
          <p className="text-xs text-muted-foreground truncate px-2 mb-2">{user.email}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}><LogOut className="h-4 w-4 mr-2" /> Logout</Button>
        </div>
      </aside>
      <main className="p-6 md:p-8"><Outlet /></main>
    </div>
  );
}
