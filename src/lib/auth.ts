import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "./supabase";
import { checkAdminAccess } from "./admin.functions";

type AuthUser = { id: string; email: string | null };

export function useAuth() {
  const checkAdmin = useServerFn(checkAdminAccess);
  const checkAdminRef = useRef(checkAdmin);
  checkAdminRef.current = checkAdmin;

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Compare-and-set to avoid re-render loops when same user object identity changes.
    const applyUser = (next: AuthUser | null) => {
      if (!mounted) return;
      setUser((prev) => {
        if (prev?.id === next?.id && prev?.email === next?.email) return prev;
        return next;
      });
    };

    const verifyAdmin = async (u: AuthUser | null) => {
      if (!u) { if (mounted) setIsAdmin(false); return; }
      try {
        await checkAdminRef.current();
        if (mounted) setIsAdmin(true);
      } catch {
        if (mounted) setIsAdmin(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      const next = u ? { id: u.id, email: u.email ?? null } : null;
      applyUser(next);
      void verifyAdmin(next);
      if (mounted) setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      const next = u ? { id: u.id, email: u.email ?? null } : null;
      applyUser(next);
      void verifyAdmin(next);
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
    // checkAdmin intentionally excluded — accessed via ref for stable subscription.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, isAdmin, loading };
}
