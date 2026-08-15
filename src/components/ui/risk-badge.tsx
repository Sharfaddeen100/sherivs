export type RiskLevel = "critical" | "high" | "medium" | "low";

const RISK_CONFIG = {
  critical: { label: "Critical", className: "risk-critical status-badge" },
  high: { label: "High Risk", className: "risk-high status-badge" },
  medium: { label: "Medium", className: "risk-medium status-badge" },
  low: { label: "Low Risk", className: "risk-low status-badge" },
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  const config = RISK_CONFIG[level];
  return <span className={config.className}>{config.label}</span>;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}
