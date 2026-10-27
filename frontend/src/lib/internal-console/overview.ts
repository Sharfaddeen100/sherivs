import type { ConsoleHealthState, ConsoleSeverity } from "./status";
import type { ConsolePresentationRole } from "./roles";
import type { InternalWorkspace } from "./workspaces";

export interface ConsoleHealthCard {
  key: string;
  name: string;
  status: ConsoleHealthState;
  detail: string;
  lastCheck: string | null;
  href: string;
  source: string;
}

export interface ConsoleMetric {
  key: string;
  name: string;
  value: string | null;
  unit: string;
  window: string;
  source: string;
  updatedAt: string | null;
  available: boolean;
  definition: string;
}

export interface ConsoleAttentionItem {
  id: string;
  severity: ConsoleSeverity;
  title: string;
  description: string;
  detectedAt: string;
  resource: string;
  owner: string | null;
  nextAction: string;
  href: string;
}

export interface ConsoleActivityItem {
  id: string;
  description: string;
  actor: string | null;
  target: string | null;
  at: string;
  outcome: string;
  action: string;
}

export interface ConsoleStaffRow {
  id: string;
  email: string;
  fullName: string;
  department: string | null;
  status: string;
  invitedAt: string | null;
  activatedAt: string | null;
  roles: string[];
}

export interface ConsoleOverview {
  viewer: {
    id: string;
    name: string;
    email: string;
    isSuperAdmin: boolean;
    roles: string[];
    presentationRole: ConsolePresentationRole;
    presentationLabel: string;
    capabilities: string[];
  };
  context: {
    organization: string;
    workspace: string;
    environment: string;
    environmentSource: string;
    host: string | null;
    version: string | null;
  };
  health: {
    overall: ConsoleHealthState;
    cards: ConsoleHealthCard[];
    caveat: string;
  };
  metrics: ConsoleMetric[];
  attention: ConsoleAttentionItem[];
  activity: ConsoleActivityItem[];
  workspaces: InternalWorkspace[];
  staff: ConsoleStaffRow[];
  staffAvailable: boolean;
  pendingInvitations: number | null;
  activeStaff: number | null;
  usageDefinition: string;
}
