/**
 * Sherivs Scholar — Cluster K tests (Phase-04 §57–76).
 * Boarding, transport, facilities, space, resources, devices, environment,
 * physical-digital mapping, facility availability.
 */
import { describe, expect, it } from "vitest";
import {
  validateBoarding,
  validateBoardingIncident,
  validateMealSchedules,
} from "@/lib/scholar/boarding";
import { validateTransport } from "@/lib/scholar/transport";
import { validateFacilities } from "@/lib/scholar/facility";
import { validateSpaceModel } from "@/lib/scholar/space";
import { validateResources } from "@/lib/scholar/resources";
import { validateDeviceContexts, validateDeviceRelationships } from "@/lib/scholar/device-context";
import { alertsForReadings, validateEnvironmentReadings } from "@/lib/scholar/environment";
import { validatePhysicalDigitalMappings } from "@/lib/scholar/physical-digital-map";
import {
  detectFacilityConflicts,
  validateFacilityBookings,
} from "@/lib/scholar/facility-availability";

describe("boarding (§57)", () => {
  const facilities = [
    { id: "house-eagle", name: "Eagle House", kind: "dormitory" as const, bedCount: 40 },
    { id: "house-lion", name: "Lion House", kind: "dormitory" as const, bedCount: 40 },
  ];

  it("accepts a valid boarding reality", () => {
    const issues = validateBoarding(facilities, [
      { studentId: "l-1", facilityId: "house-eagle", active: true },
      { studentId: "l-2", facilityId: "house-lion", active: true },
    ]);
    expect(issues).toEqual([]);
  });

  it("rejects double assignments, unknown facilities and over-capacity", () => {
    const double = validateBoarding(facilities, [
      { studentId: "l-1", facilityId: "house-eagle", active: true },
      { studentId: "l-1", facilityId: "house-lion", active: true },
    ]);
    expect(double.join(" ")).toContain("more than one active");

    const unknown = validateBoarding(facilities, [
      { studentId: "l-1", facilityId: "ghost", active: true },
    ]);
    expect(unknown.join(" ")).toContain("unknown facility");

    const overflow = validateBoarding(
      [{ id: "tiny", name: "Tiny", kind: "house", bedCount: 1 }],
      [
        { studentId: "l-1", facilityId: "tiny", active: true },
        { studentId: "l-2", facilityId: "tiny", active: true },
      ],
    );
    expect(overflow.join(" ")).toContain("over capacity");
  });

  it("validates incidents and meal schedules", () => {
    expect(
      validateBoardingIncident({
        facilityId: "house-eagle",
        date: "2026-09-04",
        kind: "wellbeing",
        reportedBy: "ident-hm",
        detail: "Learner unwell overnight",
      }),
    ).toEqual([]);
    const meals = validateMealSchedules(
      [
        { id: "meal-breakfast", facilityId: "house-eagle", name: "Breakfast", when: "06:30 daily" },
        { id: "meal-dinner", facilityId: "house-eagle", name: "Dinner", when: "18:30 daily" },
      ],
      new Set(["house-eagle", "house-lion"]),
    );
    expect(meals).toEqual([]);
  });
});

describe("transport (§58)", () => {
  it("accepts routes with ordered stops within vehicle capacity", () => {
    const issues = validateTransport(
      [{ id: "bus-1", plate: "ABC-123", capacity: 30 }],
      [
        {
          id: "route-1",
          name: "North Route",
          vehicleId: "bus-1",
          stops: [
            { id: "stop-a", name: "School", order: 1 },
            { id: "stop-b", name: "Market", order: 2 },
          ],
        },
      ],
      [
        { routeId: "route-1", stopId: "stop-b", studentId: "l-1", active: true },
        { routeId: "route-1", stopId: "stop-b", studentId: "l-2", active: true },
      ],
    );
    expect(issues).toEqual([]);
  });

  it("rejects duplicate stops and capacity overflow", () => {
    const dupStops = validateTransport(
      [{ id: "bus-1", capacity: 30 }],
      [
        {
          id: "route-1",
          name: "R1",
          vehicleId: "bus-1",
          stops: [
            { id: "stop-a", name: "A", order: 1 },
            { id: "stop-a", name: "A again", order: 2 },
          ],
        },
      ],
      [],
    );
    expect(dupStops.join(" ")).toContain("duplicate stop");

    const overflow = validateTransport(
      [{ id: "bus-2", capacity: 1 }],
      [{ id: "route-2", name: "R2", vehicleId: "bus-2", stops: [] }],
      [
        { routeId: "route-2", studentId: "l-1", active: true },
        { routeId: "route-2", studentId: "l-2", active: true },
      ],
    );
    expect(overflow.join(" ")).toContain("exceeds vehicle capacity");
  });
});

describe("facilities (§59, 63)", () => {
  it("accepts the documented facility kinds with declared capabilities", () => {
    const issues = validateFacilities([
      {
        id: "fac-lab",
        name: "Chemistry Lab",
        kind: "laboratory",
        capacity: 30,
        capabilities: ["wet-lab", "fume-hoods"],
      },
      { id: "fac-mosque", name: "Central Mosque", kind: "mosque", capacity: 200 },
      { id: "fac-farm", name: "School Farm", kind: "farm" },
    ]);
    expect(issues).toEqual([]);
  });

  it("rejects unknown kinds", () => {
    const badKind = validateFacilities([{ id: "fac-x", name: "X", kind: "planetarium" as never }]);
    expect(badKind.join(" ")).toContain("kind must be one of");
  });
});

describe("space (§60–62)", () => {
  it("validates buildings → blocks → rooms", () => {
    const issues = validateSpaceModel({
      buildings: [{ id: "bld-1", name: "Main Block", blockIds: ["blk-a"] }],
      blocks: [{ id: "blk-a", name: "A", buildingId: "bld-1", roomIds: ["rm-1"] }],
      rooms: [{ id: "rm-1", name: "Room 1", type: "classroom", capacity: 40, blockId: "blk-a" }],
    });
    expect(issues).toEqual([]);
  });

  it("rejects dangling block/room references", () => {
    const issues = validateSpaceModel({
      buildings: [],
      blocks: [{ id: "blk-a", name: "A", roomIds: ["ghost"] }],
      rooms: [{ id: "rm-1", name: "R1", type: "classroom", blockId: "ghost" }],
    });
    expect(issues.join(" ")).toContain("unknown room");
    expect(issues.join(" ")).toContain("unknown block");
  });
});

describe("resources (§64–65)", () => {
  it("accepts a mixed catalogue with educational-use refs and rejects negatives", () => {
    const ok = validateResources([
      {
        id: "res-1",
        kind: "book",
        name: "Textbook",
        quantity: 50,
        educationalUseRef: "subject:mathematics",
      },
      { id: "res-2", kind: "laboratory_asset", name: "Bunsen burners", quantity: 12 },
    ]);
    expect(ok).toEqual([]);
    const bad = validateResources([{ id: "res-x", kind: "tool", name: "X", quantity: -3 }]);
    expect(bad.join(" ")).toContain("non-negative");
  });
});

describe("device-context (§66–68)", () => {
  it("validates device contexts and authorized relationships", () => {
    const contexts = validateDeviceContexts([
      {
        deviceId: "dev-1",
        ownerIdentityId: "ident-t1",
        roomId: "rm-1",
        purpose: "projector",
        networkContext: "staff-wifi",
      },
    ]);
    expect(contexts).toEqual([]);
    const relationships = validateDeviceRelationships([
      { deviceId: "dev-1", partnerKind: "room", partnerId: "rm-1", authorized: true },
      { deviceId: "dev-1", partnerKind: "workflow", partnerId: "wf-lesson", authorized: true },
    ]);
    expect(relationships).toEqual([]);
  });

  it("rejects unauthorized-partner surprises by vocabulary and duplicates", () => {
    const issues = validateDeviceRelationships([
      { deviceId: "dev-1", partnerKind: "sensor", partnerId: "s-1", authorized: true },
      { deviceId: "dev-1", partnerKind: "sensor", partnerId: "s-1", authorized: true },
    ]);
    expect(issues.join(" ")).toContain("duplicate");
  });
});

describe("environment (§69)", () => {
  it("validates readings and derives threshold alerts", () => {
    const readings = [
      {
        locationRef: "rm-1",
        metric: "temperature" as const,
        value: 34,
        observedAt: "2026-09-04T10:00:00.000Z",
      },
      {
        locationRef: "rm-1",
        metric: "noise" as const,
        value: 85,
        observedAt: "2026-09-04T10:00:00.000Z",
      },
    ];
    expect(validateEnvironmentReadings(readings)).toEqual([]);
    const alerts = alertsForReadings(readings, [
      { metric: "temperature", warningAbove: 30, criticalAbove: 40 },
      { metric: "noise", warningAbove: 80 },
    ]);
    expect(alerts).toHaveLength(2);
    expect(alerts[0].level).toBe("warning");
  });
});

describe("physical-digital map (§70)", () => {
  it("validates mappings and rejects self-mappings", () => {
    const issues = validatePhysicalDigitalMappings([
      {
        physicalEntityId: "rm-1",
        physicalEntityKind: "room",
        digitalEntityId: "cg-ent-rm1",
        digitalRefKind: "cg_entity",
      },
    ]);
    expect(issues).toEqual([]);
    const selfMapping = validatePhysicalDigitalMappings([
      {
        physicalEntityId: "x",
        physicalEntityKind: "device",
        digitalEntityId: "x",
        digitalRefKind: "device",
      },
    ]);
    expect(selfMapping.join(" ")).toContain("itself");
  });
});

describe("facility-availability (§74–76)", () => {
  it("detects double bookings, capacity and maintenance conflicts", () => {
    const issues = validateFacilityBookings([
      {
        facilityId: "fac-lab",
        activityRef: "lesson-a",
        startMinute: 480,
        endMinute: 540,
        attendees: 20,
      },
      {
        facilityId: "fac-lab",
        activityRef: "lesson-b",
        startMinute: 500,
        endMinute: 560,
        attendees: 20,
      },
    ]);
    expect(issues).toEqual([]);

    const conflicts = detectFacilityConflicts(
      [
        {
          facilityId: "fac-lab",
          activityRef: "lesson-a",
          startMinute: 480,
          endMinute: 540,
          attendees: 20,
        },
        {
          facilityId: "fac-lab",
          activityRef: "lesson-b",
          startMinute: 500,
          endMinute: 560,
          attendees: 20,
        },
      ],
      new Map([["fac-lab", { facilityId: "fac-lab", state: "operational", capacity: 30 }]]),
    );
    expect(conflicts.some((c) => c.kind === "double_booking")).toBe(true);
  });

  it("flags incompatible activities and maintenance windows", () => {
    const conflicts = detectFacilityConflicts(
      [
        {
          facilityId: "fac-lab",
          activityRef: "chemistry",
          startMinute: 480,
          endMinute: 540,
          attendees: 10,
        },
        {
          facilityId: "fac-lab",
          activityRef: "biology",
          startMinute: 490,
          endMinute: 550,
          attendees: 10,
        },
      ],
      new Map([["fac-lab", { facilityId: "fac-lab", state: "maintenance", capacity: 30 }]]),
      [["chemistry", "biology"]],
    );
    expect(conflicts.some((c) => c.kind === "maintenance_conflict")).toBe(true);
    expect(conflicts.some((c) => c.kind === "incompatible_activity")).toBe(true);
  });
});
