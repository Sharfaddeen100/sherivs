/**
 * Sherivs — Phase 24 (platform layer): experience & design intelligence.
 *
 * Domain-neutral contracts that ANY Sherivs runtime workspace consumes:
 * - §G–J semantic design tokens (color/typography/spacing), §BW density modes,
 *   §BY theming — with high-contrast overrides built in.
 * - §N–X information architecture: workspace IA derived from authorized
 *   capability refs + runtime/org data — NEVER from a fixed portal; the UI
 *   filter here is cosmetic, backend authorization always governs (AGENTS §34).
 * - §BL–BM accessibility defaults (§AA by default, focus visible, reduced
 *   motion, contrast) with WCAG contrast math.
 * - §P/R personalization: applied ONLY for policy-allowed dimensions —
 *   personalization can never escape governance.
 *
 * An education runtime is one consumer; company/agency/community workspaces derive
 * from the same contracts.
 */

/* ─────────────────────────────────────────────────────────────
 * Semantic design tokens (G, H, I, J, BW, BY)
 * ────────────────────────────────────────────────────────────*/

export type ThemeMode = "light" | "dark" | "system";
export type DensityMode = "compact" | "comfortable";
export type ContrastMode = "standard" | "high_contrast";

export type SemanticColorRole =
  | "background"
  | "surface"
  | "surfaceElevated"
  | "primary"
  | "onPrimary"
  | "secondary"
  | "text"
  | "textSubtle"
  | "border"
  | "danger"
  | "warning"
  | "success"
  | "info"
  | "focus";

export type SemanticColorScheme = Record<SemanticColorRole, string>;

export const DEFAULT_LIGHT: SemanticColorScheme = {
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceElevated: "#ffffff",
  primary: "#2563eb",
  onPrimary: "#ffffff",
  secondary: "#475569",
  text: "#0f172a",
  textSubtle: "#475569",
  border: "#cbd5e1",
  danger: "#b91c1c",
  warning: "#b45309",
  success: "#15803d",
  info: "#0369a1",
  focus: "#2563eb",
};

export const DEFAULT_DARK: SemanticColorScheme = {
  background: "#0f172a",
  surface: "#1e293b",
  surfaceElevated: "#334155",
  primary: "#93c5fd",
  onPrimary: "#0f172a",
  secondary: "#94a3b8",
  text: "#f1f5f9",
  textSubtle: "#94a3b8",
  border: "#334155",
  danger: "#fca5a5",
  warning: "#fcd34d",
  success: "#86efac",
  info: "#7dd3fc",
  focus: "#93c5fd",
};

/** High-contrast overrides keep every role at strong contrast on its pairing. */
export function withHighContrast(scheme: SemanticColorScheme): SemanticColorScheme {
  if (scheme.background === DEFAULT_DARK.background) {
    return { ...scheme, border: "#64748b", textSubtle: "#cbd5e1", surfaceElevated: "#475569" };
  }
  return { ...scheme, border: "#475569", textSubtle: "#334155", surfaceElevated: "#f1f5f9" };
}

export interface ExperienceTokenSet {
  mode: "light" | "dark";
  density: DensityMode;
  contrast: ContrastMode;
  reducedMotion: boolean;
  /** Base font size in px — §BL/BM accessibility can enlarge it. */
  fontSizeBase: number;
  fontSizeScale: readonly number[];
  spacingUnit: number;
  radiusUnit: number;
  colors: SemanticColorScheme;
}

export interface TokenDefaultsInput {
  mode?: ThemeMode;
  systemPrefersDark?: boolean;
  density?: DensityMode;
  contrast?: ContrastMode;
  reducedMotion?: boolean;
}

export function resolveThemeMode(mode: ThemeMode, systemPrefersDark: boolean): "light" | "dark" {
  if (mode === "system") return systemPrefersDark ? "dark" : "light";
  return mode;
}

export function createDefaultTokenSet(input: TokenDefaultsInput = {}): ExperienceTokenSet {
  const mode = resolveThemeMode(input.mode ?? "system", input.systemPrefersDark ?? false);
  const contrast = input.contrast ?? "standard";
  const base = mode === "dark" ? DEFAULT_DARK : DEFAULT_LIGHT;
  return {
    mode,
    density: input.density ?? "comfortable",
    contrast,
    reducedMotion: input.reducedMotion ?? false,
    fontSizeBase: 16,
    fontSizeScale: [14, 16, 18, 20, 24, 32, 40],
    spacingUnit: 4,
    radiusUnit: 6,
    colors: contrast === "high_contrast" ? withHighContrast(base) : base,
  };
}

/** Semantic token accessor used by ALL components (no raw hex outside tokens). */
export function semanticToken(set: ExperienceTokenSet, role: SemanticColorRole): string {
  return set.colors[role];
}

export interface SpacingDimension {
  key: string;
  value: number;
}

export function spacingScale(set: ExperienceTokenSet, unitMultiplier: number): SpacingDimension {
  const base = set.density === "compact" ? set.spacingUnit * 0.75 : set.spacingUnit;
  return { key: `space-${unitMultiplier}`, value: Math.round(base * unitMultiplier) };
}

/* ─────────────────────────────────────────────────────────────
 * Information architecture (N, R, X, BI)
 * Navigation is DERIVED from capability refs and runtime/org
 * data. Filtering here is cosmetic; authorization is backend.
 * ────────────────────────────────────────────────────────────*/

export type NavigationCategory = "workspace" | "data" | "admin" | "platform" | "search";

export interface NavigationNode {
  id: string;
  /** i18n label key — never a hard-coded portal string. */
  labelKey: string;
  category: NavigationCategory;
  /** Every capability a node's actions require (AND). Empty = always visible. */
  capabilityRefs: readonly string[];
  orderHint: number;
}

export function nodeRequiresAllCapabilities(
  node: NavigationNode,
  allowedCapabilities: ReadonlySet<string>,
): boolean {
  return node.capabilityRefs.every((ref) => allowedCapabilities.has(ref));
}

export function resolveWorkspaceNavigation(
  nodes: readonly NavigationNode[],
  allowedCapabilities: ReadonlySet<string>,
): NavigationNode[] {
  return nodes
    .filter((node) => nodeRequiresAllCapabilities(node, allowedCapabilities))
    .sort((a, b) => a.orderHint - b.orderHint || a.labelKey.localeCompare(b.labelKey));
}

/* ─────────────────────────────────────────────────────────────
 * Accessibility defaults (BL, BM, CC) + WCAG contrast math
 * ────────────────────────────────────────────────────────────*/

export type WCAGLevel = "A" | "AA" | "AAA";

export interface AccessibilityDefaults {
  level: WCAGLevel;
  focusVisible: boolean;
  reducedMotion: boolean;
  /** Minimum touch target in px (CA). */
  minTouchTarget: number;
  contrast: ContrastMode;
}

export function createAccessibilityDefaults(
  overrides: Partial<AccessibilityDefaults> = {},
): AccessibilityDefaults {
  return {
    level: "AA",
    focusVisible: true,
    reducedMotion: false,
    minTouchTarget: 44,
    contrast: "standard",
    ...overrides,
  };
}

function parseHexChannel(channel: string): number {
  return Number.parseInt(channel, 16);
}

export function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  const r = parseHexChannel(value.slice(0, 2)) / 255;
  const g = parseHexChannel(value.slice(2, 4)) / 255;
  const b = parseHexChannel(value.slice(4, 6)) / 255;
  const linearize = (c: number): number =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

export function contrastRatio(foreground: string, background: string): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

export function minimumContrast(level: WCAGLevel, largeText: boolean): number {
  if (level === "AAA") return largeText ? 4.5 : 7;
  if (level === "AA") return largeText ? 3 : 4.5;
  return largeText ? 3 : 4.5;
}

export function passesContrast(
  level: WCAGLevel,
  largeText: boolean,
  foreground: string,
  background: string,
): boolean {
  return contrastRatio(foreground, background) >= minimumContrast(level, largeText);
}

/* ─────────────────────────────────────────────────────────────
 * Personalization dimensions (P, R, BW) — policy governed
 * ────────────────────────────────────────────────────────────*/

export type PersonalizationDimension =
  "density" | "colorMode" | "motion" | "typography" | "language" | "layout" | "shortcuts";

export const PERSONALIZATION_DIMENSIONS: readonly PersonalizationDimension[] = [
  "density",
  "colorMode",
  "motion",
  "typography",
  "language",
  "layout",
  "shortcuts",
] as const;

export interface PersonalizationPolicy {
  allowedDimensions: ReadonlySet<PersonalizationDimension>;
}

export type PersonalizationOutcome =
  | { ok: true; applied: PersonalizationDimension[]; denied: [] }
  | {
      ok: false;
      applied: PersonalizationDimension[];
      denied: PersonalizationDimension[];
      issue: string;
    };

export function personalizeExperience(
  requested: readonly PersonalizationDimension[],
  policy: PersonalizationPolicy,
): PersonalizationOutcome {
  const applied = requested.filter((dimension) => policy.allowedDimensions.has(dimension));
  const denied = requested.filter((dimension) => !policy.allowedDimensions.has(dimension));
  if (denied.length > 0) {
    return {
      ok: false,
      applied,
      denied,
      issue: `personalization denied for: ${denied.join(", ")} — dimension not allowed by policy`,
    };
  }
  return { ok: true, applied, denied: [] };
}

export function allowPersonalizationDimensions(
  ...dimensions: PersonalizationDimension[]
): PersonalizationPolicy {
  return { allowedDimensions: new Set(dimensions) };
}
