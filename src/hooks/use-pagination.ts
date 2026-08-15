import { useCallback, useState } from "react";

export const PAGE_SIZE = 50;

/**
 * Server-side pagination state for Supabase `.range(from, to)` queries.
 *
 * Pages are zero-indexed; UI labels add +1 when rendering "page N".
 */
export function usePagination(pageSize: number = PAGE_SIZE) {
  const [page, setPage] = useState(0);

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const nextPage = useCallback(() => setPage((p) => p + 1), []);
  const prevPage = useCallback(() => setPage((p) => Math.max(0, p - 1)), []);
  const goToPage = useCallback((n: number) => setPage(Math.max(0, n)), []);
  const reset = useCallback(() => setPage(0), []);

  return { page, from, to, nextPage, prevPage, goToPage, reset, PAGE_SIZE: pageSize };
}
