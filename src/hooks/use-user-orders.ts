import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, type Order } from "@/lib/supabase";

export function useUserOrders(userId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["user-orders", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, product:products(*), items:order_items(*, product:products(*))")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Order[];
    },
  });

  useEffect(() => {
    if (!userId) return;
    const ch = supabase
      .channel(`user-orders-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${userId}` }, () => {
        qc.invalidateQueries({ queryKey: ["user-orders"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [userId, qc]);

  return query;
}
