import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Mail, Loader2, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password",
      });
      if (error) throw error;
      setSent(true);
      toast.success("Email reset telah dikirim");
    } catch (err) {
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
        <h1 className="text-center mt-6 font-display text-2xl font-bold">Lupa Password?</h1>
        <p className="text-center text-sm text-muted-foreground mt-1">Masukkan email untuk reset password</p>

        {sent ? (
          <div className="mt-6 text-center space-y-3">
            <div className="rounded-xl bg-success/10 text-success p-4 text-sm">
              Cek inbox email <strong>{email}</strong> untuk link reset password.
            </div>
            <Link to="/login"><Button variant="outline" className="w-full"><ArrowLeft className="h-4 w-4 mr-2" /> Kembali Login</Button></Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-6">
            <div>
              <Label>Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-9" placeholder="kamu@email.com" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-gradient-primary shadow-glow">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengirim...</> : "Kirim Link Reset"}
            </Button>
            <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-primary">Kembali ke login</Link>
          </form>
        )}
      </Card>
    </div>
  );
}
