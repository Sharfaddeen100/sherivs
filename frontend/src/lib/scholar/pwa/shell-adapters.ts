/**
 * CoreGrid Scholar — native shell adapters (WAVE-R35).
 *
 * The same generated experience runs inside iOS, Android and desktop shells.
 * Each shell declares how it behaves (safe areas, status bar, back gesture,
 * offline strategy, biometrics, push) as DATA, so no screen is forked per
 * platform.
 */

export const SHELL_TARGETS = ["ios", "android", "desktop"] as const;
export type ShellTarget = (typeof SHELL_TARGETS)[number];

export interface NativeShellAdapter {
  shell: ShellTarget;
  safeArea: { top: number; bottom: number; left: number; right: number };
  statusBarStyle: "light" | "dark" | "auto";
  backBehaviour: "history" | "root" | "exit";
  offlineStrategy: "cache_first" | "network_first";
  supportsShareTarget: boolean;
  biometrics: boolean;
  pushEnabled: boolean;
  /** Minimum touch target in CSS pixels (accessibility). */
  minTouchTarget: number;
}

const ADAPTERS: Record<ShellTarget, NativeShellAdapter> = {
  ios: {
    shell: "ios",
    safeArea: { top: 47, bottom: 34, left: 0, right: 0 },
    statusBarStyle: "auto",
    backBehaviour: "history",
    offlineStrategy: "cache_first",
    supportsShareTarget: true,
    biometrics: true,
    pushEnabled: true,
    minTouchTarget: 44,
  },
  android: {
    shell: "android",
    safeArea: { top: 24, bottom: 0, left: 0, right: 0 },
    statusBarStyle: "auto",
    backBehaviour: "history",
    offlineStrategy: "cache_first",
    supportsShareTarget: true,
    biometrics: true,
    pushEnabled: true,
    minTouchTarget: 48,
  },
  desktop: {
    shell: "desktop",
    safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
    statusBarStyle: "light",
    backBehaviour: "history",
    offlineStrategy: "network_first",
    supportsShareTarget: false,
    biometrics: false,
    pushEnabled: true,
    minTouchTarget: 32,
  },
};

export function nativeShellAdapter(shell: ShellTarget): NativeShellAdapter {
  return ADAPTERS[shell];
}

export function validateShellAdapter(adapter: NativeShellAdapter): string[] {
  const issues: string[] = [];
  const MIN_TOUCH = 32;
  if (!SHELL_TARGETS.includes(adapter.shell)) issues.push(`unknown shell "${adapter.shell}"`);
  for (const [edge, value] of Object.entries(adapter.safeArea)) {
    if (value < 0 || value > 200) issues.push(`safeArea.${edge} must be 0–200 (got ${value})`);
  }
  if (adapter.minTouchTarget < MIN_TOUCH) {
    issues.push(`minTouchTarget must be at least ${MIN_TOUCH}px`);
  }
  if (adapter.backBehaviour === "exit" && adapter.shell === "desktop") {
    issues.push("desktop shells must not exit on back");
  }
  if (adapter.shell === "ios" && adapter.safeArea.bottom === 0) {
    issues.push("iOS shells must reserve the home-indicator safe area");
  }
  return issues;
}

/** All adapters (surfaces render the platform matrix as data). */
export function shellAdapterMatrix(): readonly NativeShellAdapter[] {
  return SHELL_TARGETS.map((shell) => ADAPTERS[shell]);
}
