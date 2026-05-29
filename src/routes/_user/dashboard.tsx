import { Outlet, createFileRoute, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LayoutDashboard, User as UserIcon, ShoppingBag, Truck, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/_user/dashboard")({
  component: DashboardLayout,
});

const menu = [
  { to: "/dashboard", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/profil", label: "Profil Saya", icon: UserIcon },
  { to: "/dashboard/pesanan", label: "Riwayat Pesanan", icon: ShoppingBag },
  { to: "/dashboard/tracking", label: "Tracking Resi", icon: Truck },
];

function DashboardLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login", search: { redirect: path } });
  }, [loading, user, nav, path]);

  const logout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout berhasil");
    nav({ to: "/" });
  };

  if (loading || !user) return <div className="min-h-screen grid place-items-center text-muted-foreground">Memuat...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="grid md:grid-cols-[260px_1fr] gap-6">
        <aside className="md:sticky md:top-20 md:self-start">
          <Card className="p-4">
            <div className="border-b pb-3 mb-3">
              <p className="text-xs text-muted-foreground">Halo,</p>
              <p className="font-semibold truncate">{user?.email}</p>
            </div>
            <nav className="space-y-1">
              {menu.map((m) => {
                const active = m.exact ? path === m.to : path.startsWith(m.to);
                return (
                  <Link key={m.to} to={m.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active ? "bg-gradient-primary text-primary-foreground shadow-glow" : "hover:bg-accent"
                  }`}>
                    <m.icon className="h-4 w-4" /> {m.label}
                  </Link>
                );
              })}
            </nav>
            <Button variant="ghost" size="sm" className="w-full justify-start mt-3 text-destructive hover:text-destructive" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </Button>
          </Card>
        </aside>
          <div><Outlet /></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
