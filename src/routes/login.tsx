import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Sparkles, Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { redirect } = useSearch({ from: "/login" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || password.length < 6) return toast.error("Email & password (min 6) wajib diisi");
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!remember) {
        // session tetap persist (Supabase storage); remember=false: tidak ada efek tambahan saat ini.
      }
      toast.success("Login berhasil");
      nav({ to: redirect || "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-hero p-4 grid-bg">
      <Card className="w-full max-w-md p-8 glass">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold justify-center">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          Lucky<span className="text-gradient">Store</span>
        </Link>
        <h1 className="text-center mt-6 font-display text-2xl font-bold">Selamat Datang</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">Masuk ke akun kamu</p>

        <form onSubmit={submit} className="space-y-4 mt-6">
          <div>
            <Label>Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9" placeholder="kamu@email.com" />
            </div>
          </div>
          <div>
            <div className="flex justify-between"><Label>Password</Label>
              <Link to="/forgot-password" className="text-xs text-primary hover:underline">Lupa password?</Link>
            </div>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-9 pr-9" placeholder="••••••••" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="toggle">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} />
            <span>Ingat saya</span>
          </label>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</> : "Login"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Belum punya akun? <Link to="/register" className="text-primary hover:underline font-medium">Daftar di sini</Link>
        </p>
      </Card>
    </div>
  );
}
