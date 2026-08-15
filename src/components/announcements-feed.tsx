/**
 * Compact, latest-N announcements feed for portal dashboards.
 * Reads published news scoped to the current school via RLS.
 */
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Megaphone, Pin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/contexts/app-context";
import { useReadNewsIds } from "@/lib/news-reads";

type Row = {
  id: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  is_pinned: boolean | null;
  published_at: string | null;
  created_at: string;
};

export function AnnouncementsFeed({
  limit = 5,
  seeAllHref,
}: {
  limit?: number;
  seeAllHref: string;
}) {
  const { school } = useApp();
  const q = useQuery<Row[]>({
    queryKey: ["announcements-feed", school?.id, limit],
    enabled: !!school?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id,title,excerpt,category,is_pinned,published_at,created_at")
        .eq("school_id", school!.id)
        .eq("is_published", true)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw new Error(error.message);
      return (data ?? []) as Row[];
    },
  });

  const rows = q.data ?? [];
  const reads = useReadNewsIds();
  const readSet = reads.data ?? new Set<string>();
  const unreadCount = rows.filter((r) => !readSet.has(r.id)).length;

  return (
    <section className="uos-card">
      <header className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Megaphone className="size-4 text-muted-foreground" />
          <h2 className="font-display text-base font-semibold">Announcements</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground">
              {unreadCount} new
            </span>
          )}
        </div>
        <Link to={seeAllHref} className="text-xs text-muted-foreground hover:text-foreground">
          See all →
        </Link>
      </header>
      {q.isLoading ? (
        <p className="p-6 text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="p-6 text-sm text-muted-foreground">
          No announcements yet. New posts from your school will appear here.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className={`p-4 ${!readSet.has(r.id) ? "bg-primary/5" : ""}`}>
              <div className="flex items-start gap-2">
                {r.is_pinned && <Pin className="mt-0.5 size-3.5 text-amber-400 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold leading-tight">{r.title}</p>
                    {r.category && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                        {r.category}
                      </span>
                    )}
                  </div>
                  {r.excerpt && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{r.excerpt}</p>
                  )}
                  {(r.published_at ?? r.created_at) && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(r.published_at ?? r.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
