/**
 * CoreGrid Scholar — events, clubs, house activities, community engagement
 * (Phase-04 §106–109).
 *
 * School events cover assemblies, sports, cultural and religious events,
 * examinations, parent meetings, graduation and field trips (§106). Clubs are
 * academic, cultural, religious, sports, technology and entrepreneurship
 * (§107). House competitions are institution-defined (§108); community
 * engagement covers projects, outreach, service learning and local
 * partnerships (§109). All configuration — nothing presumed about which events
 * an institution runs.
 */

export type SchoolEventKind =
  | "assembly"
  | "sports"
  | "cultural"
  | "religious"
  | "examination"
  | "parent_meeting"
  | "graduation"
  | "field_trip"
  | "custom";

export const SCHOOL_EVENT_KINDS: readonly SchoolEventKind[] = [
  "assembly",
  "sports",
  "cultural",
  "religious",
  "examination",
  "parent_meeting",
  "graduation",
  "field_trip",
  "custom",
] as const;

export type ClubKind =
  "academic" | "cultural" | "religious" | "sports" | "technology" | "entrepreneurship" | "custom";

export const CLUB_KINDS: readonly ClubKind[] = [
  "academic",
  "cultural",
  "religious",
  "sports",
  "technology",
  "entrepreneurship",
  "custom",
] as const;

export type CommunityEngagementKind =
  "community_project" | "outreach" | "service_learning" | "local_partnership" | "custom";

export interface SchoolEvent {
  id: string;
  kind: SchoolEventKind;
  name: string;
  date?: string | null;
  campus?: string | null;
}

export interface Club {
  id: string;
  name: string;
  kind: ClubKind;
  patronId?: string | null;
}

export interface HouseActivity {
  id: string;
  houseId: string;
  activityRef: string;
}

export interface CommunityEngagement {
  id: string;
  kind: CommunityEngagementKind;
  name: string;
  partner?: string | null;
}

export function validateSchoolEvents(input: readonly SchoolEvent[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const event of input) {
    const id = event.id.trim();
    if (!id) {
      issues.push("an event requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate event id "${id}"`);
    ids.add(id);
    if (!event.name.trim()) issues.push(`event "${id}": name is required`);
    if (!SCHOOL_EVENT_KINDS.includes(event.kind)) {
      issues.push(`event "${id}": kind must be one of ${SCHOOL_EVENT_KINDS.join(", ")}`);
    }
  }
  return issues;
}

export function validateClubs(input: readonly Club[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const club of input) {
    const id = club.id.trim();
    if (!id) {
      issues.push("a club requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate club id "${id}"`);
    ids.add(id);
    if (!club.name.trim()) issues.push(`club "${id}": name is required`);
    if (!CLUB_KINDS.includes(club.kind)) {
      issues.push(`club "${id}": kind must be one of ${CLUB_KINDS.join(", ")}`);
    }
  }
  return issues;
}

export function validateHouseActivities(input: readonly HouseActivity[]): string[] {
  const issues: string[] = [];
  for (const activity of input) {
    if (!activity.id.trim() || !activity.houseId.trim())
      issues.push("a house activity requires id and houseId");
    if (!activity.activityRef.trim())
      issues.push(`house activity "${activity.id}": activityRef is required`);
  }
  return issues;
}

export function validateCommunityEngagements(input: readonly CommunityEngagement[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const engagement of input) {
    const id = engagement.id.trim();
    if (!id) {
      issues.push("a community engagement requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate community engagement id "${id}"`);
    ids.add(id);
    if (!engagement.name.trim()) issues.push(`engagement "${id}": name is required`);
    if (
      engagement.kind !== "community_project" &&
      engagement.kind !== "outreach" &&
      engagement.kind !== "service_learning" &&
      engagement.kind !== "local_partnership" &&
      engagement.kind !== "custom"
    ) {
      issues.push(
        `engagement "${id}": kind must be one of community_project, outreach, service_learning, local_partnership, custom`,
      );
    }
  }
  return issues;
}
