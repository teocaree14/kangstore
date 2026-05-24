import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/admin" },
        });
        if (error) throw error;
        toast.success("Akun dibuat. Cek email untuk konfirmasi (jika diperlukan), lalu login.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login berhasil");
        nav({ to: "/admin" });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-hero p-4 grid-bg">
      <Card className="w-full max-w-md p-8 glass">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold justify-center">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow"><Sparkles className="h-4 w-4" /></span>
          Lucky<span className="text-gradient">Store</span>
        </Link>
        <h1 className="text-center mt-6 font-display text-2xl font-bold">{mode === "signin" ? "Login Admin" : "Daftar Admin"}</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">{mode === "signin" ? "Masuk ke dashboard admin" : "Buat akun untuk dijadikan admin"}</p>

        <form onSubmit={submit} className="space-y-4 mt-6">
          <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow">{loading ? "Memproses..." : mode === "signin" ? "Login" : "Daftar"}</Button>
        </form>

        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="block mx-auto mt-4 text-sm text-muted-foreground hover:text-primary">
          {mode === "signin" ? "Belum punya akun? Daftar" : "Sudah punya akun? Login"}
        </button>
      </Card>
    </div>
  );
}
