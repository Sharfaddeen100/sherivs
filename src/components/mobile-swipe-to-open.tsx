/**
 * Mobile swipe gestures for the portal sidebar:
 *   - swipe right from the left edge → open
 *   - swipe left while open → close
 * Only active when the app is in mobile mode.
 */
import { useCallback } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { useSwipeSidebar } from "@/hooks/use-swipe-sidebar";

export function MobileSwipeToOpen() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();

  const setOpen = useCallback(
    (open: boolean) => {
      if (!isMobile) return;
      setOpenMobile(open);
    },
    [isMobile, setOpenMobile],
  );

  useSwipeSidebar(isMobile && openMobile, setOpen);

  return null;
}
