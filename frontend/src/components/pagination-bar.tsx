import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  page: number; // zero-indexed
  total: number;
  pageSize: number;
  onNext: () => void;
  onPrev: () => void;
  onPage: (n: number) => void;
  isLoading?: boolean;
}

/**
 * Compute the (up to 5) page-number buttons to render, with ellipsis gaps
 * represented as `null`. Pages are 1-indexed for display.
 */
function pageButtons(current1: number, lastPage1: number): (number | null)[] {
  if (lastPage1 <= 5) {
    return Array.from({ length: lastPage1 }, (_, i) => i + 1);
  }
  if (current1 <= 3) return [1, 2, 3, null, lastPage1];
  if (current1 >= lastPage1 - 2) return [1, null, lastPage1 - 2, lastPage1 - 1, lastPage1];
  return [1, null, current1, null, lastPage1];
}

export function PaginationBar({
  page,
  total,
  pageSize,
  onNext,
  onPrev,
  onPage,
  isLoading,
}: PaginationBarProps) {
  if (total === 0) return null;

  const lastPage1 = Math.max(1, Math.ceil(total / pageSize));
  const current1 = page + 1;
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  const prevDisabled = page === 0 || isLoading;
  const nextDisabled = (page + 1) * pageSize >= total || isLoading;

  const buttons = pageButtons(current1, lastPage1);

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-4 py-3"
      aria-label="Pagination"
    >
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {isLoading ? "Loading…" : `Showing ${start}-${end} of ${total} records`}
      </p>

      <div className="flex items-center gap-1">
        {buttons.map((n, i) =>
          n === null ? (
            <span key={`gap-${i}`} className="px-1 text-xs text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n - 1)}
              aria-current={n === current1 ? "page" : undefined}
              disabled={isLoading}
              className={
                n === current1
                  ? "h-8 min-w-8 rounded-md bg-primary px-2 text-xs font-semibold text-primary-foreground"
                  : "h-8 min-w-8 rounded-md border border-border px-2 text-xs text-muted-foreground hover:bg-muted/40 disabled:opacity-50"
              }
            >
              {n}
            </button>
          ),
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onPrev} disabled={prevDisabled}>
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <Button size="sm" variant="outline" onClick={onNext} disabled={nextDisabled}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
