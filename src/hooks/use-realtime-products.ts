import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Subscribe to realtime changes on the products table and invalidate
 * all React Query caches keyed by ["products", ...].
 */
export function useRealtimeProducts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.invalidateQueries({ queryKey: ["product"] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
