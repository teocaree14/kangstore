import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_e, session) => {
      const u = session?.user ?? null;
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
      if (u) {
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id).eq("role", "admin").maybeSingle();
        setIsAdmin(!!data);
      } else setIsAdmin(false);
      setLoading(false);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user ?? null;
      setUser(u ? { id: u.id, email: u.email ?? null } : null);
      if (u) {
        const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.id).eq("role", "admin").maybeSingle();
        setIsAdmin(!!r);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, isAdmin, loading };
}
