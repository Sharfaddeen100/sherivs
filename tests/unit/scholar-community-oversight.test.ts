/**
 * Sherivs Scholar — Cluster N tests part 1 (§86–97).
 * Offline queues, community sharing, oversight/inspection/accreditation.
 */
import { describe, expect, it } from "vitest";
import {
  lowBandwidthSkipList,
  powerSafeBatchSize,
  resolveConflict,
  validateOfflineQueue,
  type QueuedOperation,
} from "@/lib/scholar/offline";
import {
  mayShare,
  validateCommunityAgreements,
  type CommunityAgreement,
} from "@/lib/scholar/community";
import {
  isAccredited,
  validateAccreditations,
  validateInspections,
  validateOversightScopes,
} from "@/lib/scholar/oversight";

describe("offline (§86–90)", () => {
  const op: QueuedOperation = {
    opId: "op-1",
    kind: "attendance.mark",
    entity: "attendance",
    entityId: "cls-1a:l-1:2026-09-04",
    queuedAt: "2026-09-04T08:00:00.000Z",
    syncMode: "standard",
  };

  it("validates queued safe operations", () => {
    expect(validateOfflineQueue([op])).toEqual([]);
    const dup = validateOfflineQueue([op, { ...op }]);
    expect(dup.join(" ")).toContain("duplicate");
  });

  it("reconciles offline conflicts deterministically (§88)", () => {
    const later = { ...op, queuedAt: "2026-09-04T09:00:00.000Z" };
    expect(resolveConflict(op, later).opId).toBe("op-1");
    expect(resolveConflict(op, later).queuedAt).toBe("2026-09-04T09:00:00.000Z");
  });

  it("strips media in low-bandwidth mode and batches for power (§89–90)", () => {
    const mediaOp: QueuedOperation = {
      ...op,
      syncMode: "low_bandwidth",
      payloadRefs: ["image:photo.png", "result:score", "video:clip.mp4"],
    };
    expect(lowBandwidthSkipList(mediaOp)).toEqual(["image:photo.png", "video:clip.mp4"]);
    expect(lowBandwidthSkipList(op)).toEqual([]);
    expect(powerSafeBatchSize(25)).toBe(10);
    expect(powerSafeBatchSize(0)).toBe(0);
  });
});

describe("community (§91–93)", () => {
  const agreement: CommunityAgreement = {
    id: "agree-1",
    ownerTenantId: "tenant-a",
    guestTenantIds: ["tenant-b", "tenant-c"],
    sharedKinds: ["curriculum", "facilities"],
    status: "active",
  };

  it("validates agreements and allows sharing only per agreement", () => {
    expect(validateCommunityAgreements([agreement])).toEqual([]);
    expect(mayShare(agreement, "tenant-a", "tenant-b", "curriculum")).toBe(true);
    expect(mayShare(agreement, "tenant-a", "tenant-b", "teachers")).toBe(false);
    expect(mayShare(agreement, "tenant-a", "tenant-d", "curriculum")).toBe(false);
    expect(
      mayShare({ ...agreement, status: "suspended" }, "tenant-a", "tenant-b", "curriculum"),
    ).toBe(false);
    expect(mayShare(undefined, "tenant-a", "tenant-b", "curriculum")).toBe(false);
  });

  it("rejects owner-as-guest and empty guest lists", () => {
    const issues = validateCommunityAgreements([
      { ...agreement, guestTenantIds: ["tenant-a"] },
      { ...agreement, id: "agree-2", guestTenantIds: [] },
    ]);
    expect(issues.join(" ")).toContain("owner cannot also be a guest");
    expect(issues.join(" ")).toContain("at least one guest tenant");
  });
});

describe("oversight (§94–97)", () => {
  it("gives government scoped visibility without automatic control (§94)", () => {
    const issues = validateOversightScopes([
      {
        authorityTenantId: "gov-ng",
        institutionTenantId: "tenant-a",
        visibilityScopes: ["enrolment-summary", "exam-results-aggregate"],
        controlGranted: false,
      },
    ]);
    expect(issues).toEqual([]);
  });

  it("validates inspections and accreditations", () => {
    expect(
      validateInspections([
        {
          id: "insp-1",
          institutionTenantId: "tenant-a",
          date: "2026-09-10T00:00:00.000Z",
          evidenceRefs: ["file:register"],
          findings: [],
          correctiveActions: [],
          status: "planned",
        },
      ]),
    ).toEqual([]);

    const accreditations = validateAccreditations([
      {
        id: "acc-1",
        institutionTenantId: "tenant-a",
        authority: "National Accreditation Board",
        status: "accredited",
        scope: ["basic-education"],
        expiresAt: "2027-09-01T00:00:00.000Z",
      },
    ]);
    expect(accreditations).toEqual([]);
  });

  it("checks current validity of accreditations (§96)", () => {
    const current = {
      id: "acc-1",
      institutionTenantId: "tenant-a",
      authority: "Board",
      status: "accredited" as const,
      scope: ["basic-education"],
      expiresAt: "2027-09-01T00:00:00.000Z",
    };
    expect(isAccredited(current, "2026-09-04T00:00:00.000Z")).toBe(true);
    expect(isAccredited(current, "2028-01-01T00:00:00.000Z")).toBe(false);
    expect(isAccredited({ ...current, status: "revoked" }, "2026-09-04T00:00:00.000Z")).toBe(false);
  });
});
