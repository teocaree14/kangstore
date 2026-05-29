import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase, type Profile } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_user/dashboard/profil")({
  component: ProfilPage,
});

function ProfilPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle().then(({ data }) => {
      setProfile((data as Profile) ?? { id: user.id, email: user.email, full_name: "", phone: "", address: "", created_at: "" });
      setLoading(false);
    });
  }, [user]);

  const save = async () => {
    if (!user || !profile) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
      });
      if (error) throw error;
      toast.success("Profil tersimpan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Card className="p-6"><Loader2 className="h-5 w-5 animate-spin" /></Card>;

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Profil Saya</h1><p className="text-muted-foreground">Kelola informasi akun</p></div>
      <Card className="p-6 space-y-4">
        <div><Label>Email</Label><Input value={profile?.email ?? ""} disabled /></div>
        <div><Label>Nama Lengkap</Label><Input value={profile?.full_name ?? ""} onChange={(e) => setProfile({ ...profile!, full_name: e.target.value })} /></div>
        <div><Label>Nomor HP</Label><Input value={profile?.phone ?? ""} onChange={(e) => setProfile({ ...profile!, phone: e.target.value })} placeholder="08xxxxxxxxxx" /></div>
        <div><Label>Alamat</Label><Textarea value={profile?.address ?? ""} onChange={(e) => setProfile({ ...profile!, address: e.target.value })} rows={3} /></div>
        <Button onClick={save} disabled={saving} className="bg-gradient-primary shadow-glow">
          {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menyimpan...</> : "Simpan Perubahan"}
        </Button>
      </Card>
    </div>
  );
}
