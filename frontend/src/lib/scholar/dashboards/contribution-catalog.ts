/**
 * Sherivs Scholar — dashboard contribution catalog (WAVE-R34).
 *
 * A dashboard is not a page someone designs: it is the set of CONTRIBUTIONS
 * whose feature code the actor has enabled and whose workspace the actor's roles
 * unlock. Each contribution declares the feature code it depends on, so a
 * dashboard can never show a widget for a feature the reality does not install.
 */

import type { RoleCategory } from "../roles/role-categories";
import type { RoleWorkspaceKey } from "../roles/role-workspaces";

export interface DashboardContribution {
  /** Stable widget code. */
  code: string;
  label: string;
  /** Feature code (capability code) that must be enabled for this widget. */
  featureCode: string;
  workspace: RoleWorkspaceKey;
  roleCategories: readonly RoleCategory[];
  /** Grid span (1 = quarter width … 4 = full width). */
  size: 1 | 2 | 3 | 4;
  order: number;
}

export const DASHBOARD_CONTRIBUTIONS: readonly DashboardContribution[] = [
  {
    code: "grid.attendance.today",
    label: "Attendance today",
    featureCode: "r001.attendance.record",
    workspace: "teaching",
    roleCategories: ["TEACHING", "ACADEMIC"],
    size: 2,
    order: 10,
  },
  {
    code: "grid.attendance.institution",
    label: "Institution attendance",
    featureCode: "r001.attendance.monitor",
    workspace: "operations",
    roleCategories: ["INSTITUTIONAL_LEADERSHIP", "OPERATIONS"],
    size: 3,
    order: 20,
  },
  {
    code: "grid.academics.gradebook",
    label: "Gradebook",
    featureCode: "r001.academics.grade",
    workspace: "teaching",
    roleCategories: ["TEACHING"],
    size: 4,
    order: 30,
  },
  {
    code: "grid.academics.results",
    label: "Results & report cards",
    featureCode: "r001.academics.results",
    workspace: "academic",
    roleCategories: ["ACADEMIC", "INSTITUTIONAL_LEADERSHIP"],
    size: 3,
    order: 40,
  },
  {
    code: "grid.examinations.plan",
    label: "Examination plan",
    featureCode: "r001.examinations.plan",
    workspace: "examination",
    roleCategories: ["ACADEMIC", "EXAMINATION"],
    size: 2,
    order: 50,
  },
  {
    code: "grid.timetable.week",
    label: "Timetable",
    featureCode: "r001.timetable.manage",
    workspace: "academic",
    roleCategories: ["ACADEMIC", "INSTITUTIONAL_LEADERSHIP", "TEACHING"],
    size: 4,
    order: 60,
  },
  {
    code: "grid.finance.collections",
    label: "Fee collections",
    featureCode: "r001.finance.fees.collect",
    workspace: "finance",
    roleCategories: ["FINANCE", "INSTITUTIONAL_LEADERSHIP"],
    size: 2,
    order: 70,
  },
  {
    code: "grid.finance.reconciliation",
    label: "Reconciliation",
    featureCode: "r001.finance.report",
    workspace: "finance",
    roleCategories: ["FINANCE"],
    size: 3,
    order: 80,
  },
  {
    code: "grid.messages.outbox",
    label: "Broadcast centre",
    featureCode: "r001.messages.broadcast",
    workspace: "leadership",
    roleCategories: ["INSTITUTIONAL_LEADERSHIP", "OPERATIONS"],
    size: 2,
    order: 90,
  },
  {
    code: "grid.boarding.houses",
    label: "Boarding houses",
    featureCode: "r001.boarding.manage",
    workspace: "boarding",
    roleCategories: ["BOARDING"],
    size: 3,
    order: 100,
  },
  {
    code: "grid.boarding.welfare",
    label: "Boarding welfare & night log",
    featureCode: "r001.boarding.welfare",
    workspace: "student_welfare",
    roleCategories: ["BOARDING", "STUDENT_SUPPORT"],
    size: 2,
    order: 110,
  },
  {
    code: "grid.welfare.counselling",
    label: "Counselling caseload",
    featureCode: "r001.welfare.counsel",
    workspace: "student_welfare",
    roleCategories: ["STUDENT_SUPPORT"],
    size: 3,
    order: 120,
  },
  {
    code: "grid.safeguarding.incidents",
    label: "Safeguarding incidents",
    featureCode: "r001.safeguarding.report",
    workspace: "safety",
    roleCategories: ["SAFETY", "STUDENT_SUPPORT", "INSTITUTIONAL_LEADERSHIP"],
    size: 2,
    order: 130,
  },
  {
    code: "grid.health.clinic",
    label: "Clinic visits",
    featureCode: "r001.health.clinic",
    workspace: "health",
    roleCategories: ["HEALTH"],
    size: 2,
    order: 140,
  },
  {
    code: "grid.transport.routes",
    label: "Transport routes & buses",
    featureCode: "r001.transport.routes",
    workspace: "transport",
    roleCategories: ["TRANSPORT"],
    size: 3,
    order: 150,
  },
  {
    code: "grid.facilities.twins",
    label: "Facility twins",
    featureCode: "r001.facilities.twin",
    workspace: "facilities",
    roleCategories: ["FACILITIES"],
    size: 3,
    order: 160,
  },
  {
    code: "grid.workforce.positions",
    label: "Workforce positions",
    featureCode: "r001.workforce.positions",
    workspace: "human_resources",
    roleCategories: ["OPERATIONS", "INSTITUTIONAL_LEADERSHIP"],
    size: 3,
    order: 170,
  },
  {
    code: "grid.admissions.pipeline",
    label: "Admissions pipeline",
    featureCode: "r001.admissions.enrol",
    workspace: "admissions",
    roleCategories: ["OPERATIONS"],
    size: 2,
    order: 180,
  },
  {
    code: "grid.vocational.workshops",
    label: "Workshops & placements",
    featureCode: "r001.vocational.workshop",
    workspace: "vocational",
    roleCategories: ["VOCATIONAL", "TEACHING"],
    size: 3,
    order: 190,
  },
  {
    code: "grid.technical.laboratories",
    label: "Laboratories & equipment",
    featureCode: "r001.technical.laboratory",
    workspace: "laboratory",
    roleCategories: ["TECHNICAL", "TEACHING"],
    size: 2,
    order: 200,
  },
  {
    code: "grid.agriculture.farm",
    label: "Farm projects",
    featureCode: "r001.agriculture.farm",
    workspace: "agricultural",
    roleCategories: ["AGRICULTURAL", "TEACHING"],
    size: 3,
    order: 210,
  },
  {
    code: "grid.religious.programme",
    label: "Faith programme",
    featureCode: "r001.religious.programme",
    workspace: "religious",
    roleCategories: ["RELIGIOUS", "TEACHING"],
    size: 2,
    order: 220,
  },
  {
    code: "grid.enterprise.programme",
    label: "Enterprise programme",
    featureCode: "r001.enterprise.programme",
    workspace: "vocational",
    roleCategories: ["VOCATIONAL", "TEACHING"],
    size: 2,
    order: 230,
  },
  {
    code: "grid.analytics.institution",
    label: "Institution insight",
    featureCode: "r001.analytics.insight",
    workspace: "leadership",
    roleCategories: ["INSTITUTIONAL_LEADERSHIP", "ACADEMIC", "FINANCE"],
    size: 4,
    order: 240,
  },
  {
    code: "grid.quality.readiness",
    label: "Inspection readiness",
    featureCode: "r001.quality.assurance",
    workspace: "quality",
    roleCategories: ["QUALITY_ASSURANCE", "ACADEMIC", "REGULATORY"],
    size: 3,
    order: 250,
  },
  {
    code: "grid.community.programmes",
    label: "Community programmes",
    featureCode: "r001.community.programme",
    workspace: "community",
    roleCategories: ["COMMUNITY"],
    size: 2,
    order: 260,
  },
];
