import { useEffect, useRef, useCallback } from "react";

/**
 * Native-feeling swipe gestures for the mobile sidebar.
 *
 * - Swipe right starting within 30px of the left edge → open
 * - Swipe left anywhere while open → close
 * Vertical scrolls are ignored.
 */
export function useSwipeSidebar(isOpen: boolean, setOpen: (open: boolean) => void) {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;
      const t = e.changedTouches[0];
      if (!t) return;

      const dx = t.clientX - touchStartX.current;
      const dy = t.clientY - touchStartY.current;
      const startX = touchStartX.current;

      touchStartX.current = null;
      touchStartY.current = null;

      // Only horizontal swipes, with a minimum distance.
      if (Math.abs(dx) < Math.abs(dy)) return;
      if (Math.abs(dx) < 50) return;

      if (dx > 0 && !isOpen) {
        if (startX < 30) setOpen(true);
      } else if (dx < 0 && isOpen) {
        setOpen(false);
      }
    },
    [isOpen, setOpen],
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);
}
