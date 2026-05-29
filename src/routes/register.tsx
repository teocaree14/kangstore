import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Eye, EyeOff, Loader2, User, Mail, Lock, Phone } from "lucide-react";

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.string().trim().email("Email tidak valid"),
  phone: z.string().trim().regex(/^[0-9+]{8,20}$/, "Nomor HP tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter").max(100),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Password tidak sama" });

function RegisterPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const update = (k: keyof typeof form, v: string) => {
    setForm({ ...form, [k]: v });
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[i.path[0] as string] = i.message));
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: { full_name: form.full_name, phone: form.phone },
        },
      });
      if (error) throw error;
      toast.success("Akun berhasil dibuat! Silakan login.");
      nav({ to: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Daftar gagal");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ icon: Icon, k, type = "text", placeholder, ...rest }: { icon: typeof User; k: keyof typeof form; type?: string; placeholder?: string; [k: string]: unknown }) => (
    <div>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input type={type} value={form[k]} onChange={(e) => update(k, e.target.value)} placeholder={placeholder} className="pl-9" {...rest} />
      </div>
      {errors[k] && <p className="text-xs text-destructive mt-1">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen grid place-items-center bg-hero p-4 grid-bg">
      <Card className="w-full max-w-md p-8 glass">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold justify-center">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          Lucky<span className="text-gradient">Store</span>
        </Link>
        <h1 className="text-center mt-6 font-display text-2xl font-bold">Buat Akun Baru</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">Daftar untuk mulai belanja</p>

        <form onSubmit={submit} className="space-y-3 mt-6">
          <div>
            <Label>Nama Lengkap</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Nama lengkap" className="pl-9" />
            </div>
            {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="kamu@email.com" className="pl-9" />
            </div>
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
          </div>
          <div>
            <Label>Nomor HP</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="08xxxxxxxxxx" className="pl-9" />
            </div>
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone}</p>}
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type={show ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="Minimal 6 karakter" className="pl-9 pr-9" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
          </div>
          <div>
            <Label>Konfirmasi Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type={show ? "text" : "password"} value={form.confirm} onChange={(e) => update("confirm", e.target.value)} placeholder="Ulangi password" className="pl-9" />
            </div>
            {errors.confirm && <p className="text-xs text-destructive mt-1">{errors.confirm}</p>}
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow">
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Memproses...</> : "Daftar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Sudah punya akun? <Link to="/login" className="text-primary hover:underline font-medium">Login</Link>
        </p>
      </Card>
    </div>
  );
}
