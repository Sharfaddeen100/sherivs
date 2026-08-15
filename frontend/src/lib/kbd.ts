import { useEffect, useState } from "react";

/** Returns "⌘" on Apple platforms and "Ctrl" everywhere else (SSR-safe). */
export function useModKeyLabel(): string {
  const [label, setLabel] = useState("Ctrl");
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const isApple = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    setLabel(isApple ? "⌘" : "Ctrl");
  }, []);
  return label;
}
