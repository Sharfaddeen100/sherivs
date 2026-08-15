/**
 * Unread message counter for the current user, with realtime updates.
 */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/app-context";

export function useUnreadMessagesCount(): number {
  const { school, authUser } = useApp();
  const qc = useQueryClient();
  const schoolId = school?.id;
  const me = authUser?.id;

  const q = useQuery<number>({
    queryKey: ["messages-unread-count", schoolId, me],
    enabled: !!schoolId && !!me,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("school_id", schoolId!)
        .eq("recipient_id", me!)
        .eq("is_read", false);
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });

  useEffect(() => {
    if (!schoolId || !me) return;
    const ch = supabase
      .channel(`messages-unread-${me}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${me}` },
        () => {
          qc.invalidateQueries({ queryKey: ["messages-unread-count", schoolId, me] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [schoolId, me, qc]);

  return q.data ?? 0;
}
