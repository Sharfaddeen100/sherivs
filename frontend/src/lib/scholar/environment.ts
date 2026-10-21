/**
 * Sherivs Scholar — environment model (Phase-04 §69).
 *
 * Temperature, occupancy, lighting, power, connectivity, air quality, noise
 * and environmental alerts are represented WHERE Phase 15 hardware integration
 * supports them. Readings are typed observation input — never fabricated by
 * the educational runtime itself.
 */

export type EnvironmentMetric =
  "temperature" | "occupancy" | "lighting" | "power" | "connectivity" | "air_quality" | "noise";

export const ENVIRONMENT_METRICS: readonly EnvironmentMetric[] = [
  "temperature",
  "occupancy",
  "lighting",
  "power",
  "connectivity",
  "air_quality",
  "noise",
] as const;

export type AlertLevel = "info" | "warning" | "critical";

export interface EnvironmentReading {
  locationRef: string;
  metric: EnvironmentMetric;
  value: number;
  observedAt: string;
  sourceRef?: string | null;
}

export interface MetricThreshold {
  metric: EnvironmentMetric;
  warningAbove?: number | null;
  criticalAbove?: number | null;
}

export interface EnvironmentAlert {
  locationRef: string;
  metric: EnvironmentMetric;
  level: AlertLevel;
  message: string;
  observedAt: string;
}

export function validateEnvironmentReadings(input: readonly EnvironmentReading[]): string[] {
  const issues: string[] = [];
  for (const reading of input) {
    if (!reading.locationRef.trim()) issues.push("a reading requires a locationRef");
    if (!ENVIRONMENT_METRICS.includes(reading.metric)) {
      issues.push(`metric must be one of ${ENVIRONMENT_METRICS.join(", ")}`);
    }
    if (!Number.isFinite(reading.value))
      issues.push(`reading of "${reading.metric}" must be a finite number`);
    if (!Number.isFinite(Date.parse(reading.observedAt))) {
      issues.push(`reading of "${reading.metric}" requires a valid observedAt`);
    }
  }
  return issues;
}

/** Derive alerts purely from readings + institution threshold configuration. */
export function alertsForReadings(
  readings: readonly EnvironmentReading[],
  thresholds: readonly MetricThreshold[],
): EnvironmentAlert[] {
  const byMetric = new Map(thresholds.map((t) => [t.metric, t]));
  const alerts: EnvironmentAlert[] = [];
  for (const reading of readings) {
    const threshold = byMetric.get(reading.metric);
    if (!threshold) continue;
    const { warningAbove, criticalAbove } = threshold;
    if (criticalAbove != null && reading.value > criticalAbove) {
      alerts.push({
        locationRef: reading.locationRef,
        metric: reading.metric,
        level: "critical",
        message: `${reading.metric} at ${reading.value} exceeds critical threshold ${criticalAbove}`,
        observedAt: reading.observedAt,
      });
    } else if (warningAbove != null && reading.value > warningAbove) {
      alerts.push({
        locationRef: reading.locationRef,
        metric: reading.metric,
        level: "warning",
        message: `${reading.metric} at ${reading.value} exceeds warning threshold ${warningAbove}`,
        observedAt: reading.observedAt,
      });
    }
  }
  return alerts;
}
