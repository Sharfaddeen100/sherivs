/**
 * Colour-mode handling. The app ships an off-white ("light") interface by
 * default; users can switch to dark or follow their system setting.
 */
export type ThemeMode = "light" | "dark" | "system";

export const THEME_KEY = "uos:theme";

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function readThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "dark" || stored === "light" || stored === "system" ? stored : "light";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(mode);
  const root = document.documentElement;
  root.classList.toggle("dark", resolved === "dark");
  root.classList.toggle("light", resolved === "light");
}

export function setThemeMode(mode: ThemeMode) {
  if (typeof window !== "undefined") window.localStorage.setItem(THEME_KEY, mode);
  applyTheme(mode);
}

/** Inline script injected in the document shell to avoid a flash of dark. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var m=localStorage.getItem('${THEME_KEY}')||'light';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',d);r.classList.toggle('light',!d);}catch(e){document.documentElement.classList.add('light');}})();`;
