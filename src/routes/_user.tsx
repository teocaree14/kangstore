import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_user")({
  component: UserLayout,
});

function UserLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) {
      nav({ to: "/login", search: { redirect: path } });
    }
  }, [loading, user, nav, path]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
