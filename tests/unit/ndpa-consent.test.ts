import { describe, expect, it } from "vitest";
import {
  CURRENT_CONSENT_POLICY_VERSION as V,
  OPTIONAL_PURPOSES,
  decideConsent,
} from "@/lib/compliance/consent";
import {
  filterConsentedStudents,
  hasConsent,
  performConsentChange,
} from "@/lib/compliance/consent.functions";
import { createFakeDb } from "./ndpa-fake-db";

const rec = (purpose: string, status: string, policy_version = V, student_id = "s1") => ({
  student_id,
  purpose,
  status,
  policy_version,
});

describe("decideConsent", () => {
  it("core_education defaults to allowed, denied only after explicit withdrawal", () => {
    expect(decideConsent([], "s1", "core_education")).toBe(true);
    expect(decideConsent([rec("core_education", "withdrawn")], "s1", "core_education")).toBe(false);
    expect(decideConsent([rec("core_education", "withdrawn", V, "s2")], "s1", "core_education")).toBe(true);
  });
  it("optional purposes default DENY", () => {
    expect(OPTIONAL_PURPOSES).not.toContain("core_education");
    for (const p of OPTIONAL_PURPOSES) expect(decideConsent([], "s1", p)).toBe(false);
  });
  it("requires granted + current policy version", () => {
    expect(decideConsent([rec("ai_processing", "granted")], "s1", "ai_processing")).toBe(true);
    expect(decideConsent([rec("ai_processing", "granted", "old")], "s1", "ai_processing")).toBe(false);
    expect(decideConsent([rec("ai_processing", "withdrawn")], "s1", "ai_processing")).toBe(false);
    expect(decideConsent([rec("photos_media", "granted")], "s1", "ai_processing")).toBe(false);
    expect(decideConsent([rec("ai_processing", "granted", V, "s2")], "s1", "ai_processing")).toBe(false);
  });
});

const seed = () => ({
  users: [
    { id: "g1", school_id: "A", role: "parent", is_active: true },
    { id: "g2", school_id: "A", role: "parent", is_active: true },
    { id: "adminA", school_id: "A", role: "admin", is_active: true },
    { id: "adminB", school_id: "B", role: "admin", is_active: true },
    { id: "t1", school_id: "A", role: "teacher", is_active: true },
  ],
  students: [
    { id: "s1", school_id: "A" },
    { id: "s2", school_id: "A" },
  ],
  parent_student_map: [
    { id: "m1", parent_id: "g1", student_id: "s1", school_id: "A" },
    { id: "m2", parent_id: "g2", student_id: "s2", school_id: "A" },
  ],
});

const input = (studentId: string, action: "grant" | "withdraw" = "grant") => ({
  studentId,
  purpose: "ai_processing" as const,
  action,
});

describe("performConsentChange", () => {
  it("guardian of the student can grant; consent row, event and audit written", async () => {
    const db = createFakeDb(seed());
    const r = await performConsentChange({ adminClient: db, actorId: "g1", input: input("s1") });
    expect(r.status).toBe("granted");
    expect(db.tables.consent_records).toHaveLength(1);
    expect(db.tables.consent_records[0]).toMatchObject({
      school_id: "A", student_id: "s1", capture_method: "web_form", guardian_user_id: "g1",
    });
    expect(db.tables.consent_events).toHaveLength(1);
    expect(db.tables.audit_logs).toHaveLength(1);
    expect(db.tables.audit_logs[0]).toMatchObject({ action: "consent.grant", school_id: "A" });
    expect(await hasConsent(db, "s1", "ai_processing", "A")).toBe(true);
    expect(await hasConsent(db, "s2", "ai_processing", "A")).toBe(false);
  });

  it("withdrawal updates the single row and appends an event", async () => {
    const db = createFakeDb(seed());
    await performConsentChange({ adminClient: db, actorId: "g1", input: input("s1") });
    await performConsentChange({ adminClient: db, actorId: "g1", input: input("s1", "withdraw") });
    expect(db.tables.consent_records).toHaveLength(1);
    expect(db.tables.consent_records[0].status).toBe("withdrawn");
    expect(db.tables.consent_events.map((e) => e.action)).toEqual(["grant", "withdraw"]);
    expect(await hasConsent(db, "s1", "ai_processing", "A")).toBe(false);
  });

  it("guardian of another student is denied and nothing is written but a denial audit", async () => {
    const db = createFakeDb(seed());
    await expect(
      performConsentChange({ adminClient: db, actorId: "g2", input: input("s1") }),
    ).rejects.toThrow(/Forbidden/);
    expect(db.tables.consent_records ?? []).toHaveLength(0);
    expect(db.tables.consent_events ?? []).toHaveLength(0);
    expect(db.tables.audit_logs[0].new_value).toMatchObject({ outcome: "denied" });
  });

  it("other-school admin and teacher are denied", async () => {
    const db = createFakeDb(seed());
    await expect(
      performConsentChange({ adminClient: db, actorId: "adminB", input: input("s1") }),
    ).rejects.toThrow(/Forbidden/);
    await expect(
      performConsentChange({ adminClient: db, actorId: "t1", input: input("s1") }),
    ).rejects.toThrow(/Forbidden/);
    expect(db.tables.consent_records ?? []).toHaveLength(0);
  });

  it("same-school admin may record paper consent; guardian cannot pick paper_signed", async () => {
    const db = createFakeDb(seed());
    await performConsentChange({
      adminClient: db, actorId: "adminA",
      input: { ...input("s1"), captureMethod: "paper_signed" },
    });
    expect(db.tables.consent_records[0]).toMatchObject({ capture_method: "paper_signed", guardian_user_id: null });
    const db2 = createFakeDb(seed());
    await performConsentChange({
      adminClient: db2, actorId: "g1",
      input: { ...input("s1"), captureMethod: "paper_signed" },
    });
    expect(db2.tables.consent_records[0].capture_method).toBe("web_form");
  });

  it("filterConsentedStudents returns only students with current grants", async () => {
    const db = createFakeDb(seed());
    await performConsentChange({ adminClient: db, actorId: "g1", input: input("s1") });
    const ok = await filterConsentedStudents(db, ["s1", "s2"], "ai_processing", "A");
    expect([...ok]).toEqual(["s1"]);
  });
});
