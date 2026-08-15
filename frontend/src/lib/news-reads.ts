/**
 * News reads tracking — per-user unread counts and "mark all as read".
 * Backed by the public.news_reads table (RLS-scoped to the user).
 */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/app-context";

type IdRow = { id: string };

export function useReadNewsIds() {
  const { school, authUser } = useApp();
  return useQuery<Set<string>>({
    queryKey: ["news-reads", school?.id, authUser?.id],
    enabled: !!school?.id && !!authUser?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news_reads")
        .select("news_id")
        .eq("user_id", authUser!.id)
        .eq("school_id", school!.id);
      if (error) throw new Error(error.message);
      return new Set((data ?? []).map((r) => (r as { news_id: string }).news_id));
    },
  });
}

export function usePublishedNewsIds() {
  const { school } = useApp();
  return useQuery<string[]>({
    queryKey: ["published-news-ids", school?.id],
    enabled: !!school?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id")
        .eq("school_id", school!.id)
        .eq("is_published", true);
      if (error) throw new Error(error.message);
      return (data as IdRow[] | null)?.map((r) => r.id) ?? [];
    },
  });
}

export function useUnreadNewsCount() {
  const reads = useReadNewsIds();
  const published = usePublishedNewsIds();
  const readSet = reads.data ?? new Set<string>();
  const all = published.data ?? [];
  return all.filter((id) => !readSet.has(id)).length;
}

/**
 * Mounts inside a news list view. Marks every visible item as read on load.
 */
export function useMarkNewsRead(newsIds: string[]) {
  const { school, authUser } = useApp();
  const qc = useQueryClient();
  useEffect(() => {
    if (!school?.id || !authUser?.id || newsIds.length === 0) return;
    let cancelled = false;
    (async () => {
      const rows = newsIds.map((news_id) => ({
        news_id,
        user_id: authUser.id,
        school_id: school.id,
      }));
      const { error } = await supabase
        .from("news_reads")
        .upsert(rows, { onConflict: "user_id,news_id", ignoreDuplicates: true });
      if (cancelled || error) return;
      void qc.invalidateQueries({ queryKey: ["news-reads", school.id, authUser.id] });
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.id, authUser?.id, newsIds.join(",")]);
}
