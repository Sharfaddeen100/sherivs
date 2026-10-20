import { describe, expect, it } from "vitest";
import {
  DSR_STATUSES,
  DSR_TRANSITIONS,
  ERASURE_POLICY,
  canTransition,
  computeDueAt,
  planErasure,
} from "@/lib/compliance/dsr";
import {
  performErasure,
  performExport,
  performSubmit,
  performTransition,
} from "@/lib/compliance/dsr.functions";
import { createFakeDb } from "./ndpa-fake-db";

describe("DSR status machine", () => {
  const legal = new Set(["received>verified", "received>rejected", "verified>completed", "verified>rejected"]);
  it("allows exactly the documented transitions", () => {
    for (const a of DSR_STATUSES) {
      for (const b of DSR_STATUSES) {
        expect(canTransition(a, b), `${a}>${b}`).toBe(legal.has(`${a}>${b}`));
      }
    }
    expect(DSR_TRANSITIONS.completed).toEqual([]);
  });
  it("due date is 30 days after receipt", () => {
    expect(computeDueAt("2026-10-20T00:00:00.000Z")).toBe("2026-11-19T00:00:00.000Z");
  });
});

describe("ERASURE_POLICY", () => {
  const act = (t: string) => ERASURE_POLICY.filter((r) => r.table === t).map((r) => r.action);
  it("encodes the per-table decisions", () => {
    expect(act("fees")).toEqual(["anonymize"]);
    expect(act("student_platform_fee_ledger")).toEqual(["anonymize"]);
    expect(act("staff_payroll")).toEqual(["anonymize"]);
    expect(act("subscriptions")).toEqual(["retain"]);
    expect(act("audit_logs")).toEqual(["retain"]);
    expect(act("consent_records")).toEqual(["retain"]);
    expect(act("consent_events")).toEqual(["retain"]);
    expect(act("grades")).toEqual(["anonymize"]);
    expect(act("attendance")).toEqual(["anonymize"]);
  });
  it("financial anonymize patches never touch amounts", () => {
    for (const t of ["fees", "student_platform_fee_ledger"]) {
      const rule = ERASURE_POLICY.find((r) => r.table === t)!;
      const keys = Object.keys(rule.patch!("x"));
      expect(keys.some((k) => /amount|status/.test(k))).toBe(false);
    }
  });
  it("plan never mutates retained tables and is scoped to the subject id", () => {
    const steps = planErasure({ studentId: "s1", userId: null });
    expect(steps.every((s) => s.subjectId === "s1")).toBe(true);
    for (const t of ["audit_logs", "consent_records", "consent_events", "subscriptions"]) {
      expect(steps.some((s) => s.table === t)).toBe(false);
    }
    expect(steps.some((s) => s.table === "users")).toBe(false);
  });
});

const seed = () => ({
  users: [
    { id: "adminA", school_id: "A", role: "admin", is_active: true },
    { id: "adminB", school_id: "B", role: "admin", is_active: true },
    { id: "g1", school_id: "A", role: "parent", is_active: true },
    { id: "g2", school_id: "A", role: "parent", is_active: true },
    { id: "gB", school_id: "B", role: "parent", is_active: true },
  ],
  students: [
    { id: "s1", school_id: "A", user_id: null, parent_name: "Mum One", date_of_birth: "2015-01-01", is_active: true },
    { id: "s2", school_id: "A", user_id: null, parent_name: "Mum Two", date_of_birth: "2014-01-01", is_active: true },
    { id: "sB", school_id: "B", user_id: null, parent_name: "Mum B", date_of_birth: "2013-01-01", is_active: true },
  ],
  parent_student_map: [
    { id: "m1", parent_id: "g1", student_id: "s1", school_id: "A" },
    { id: "m2", parent_id: "g2", student_id: "s2", school_id: "A" },
    { id: "mB", parent_id: "gB", student_id: "sB", school_id: "B" },
  ],
  grades: [
    { id: "gr1", school_id: "A", student_id: "s1", grade_remark: "good" },
    { id: "gr2", school_id: "A", student_id: "s2", grade_remark: "fine" },
    { id: "grB", school_id: "B", student_id: "sB", grade_remark: "ok" },
  ],
  fees: [
    { id: "f1", school_id: "A", student_id: "s1", amount: 5000, paystack_reference: "ref1" },
    { id: "f2", school_id: "A", student_id: "s2", amount: 7000, paystack_reference: "ref2" },
    { id: "fB", school_id: "B", student_id: "sB", amount: 9000, paystack_reference: "refB" },
  ],
  consent_records: [{ id: "c1", school_id: "A", student_id: "s1", purpose: "ai_processing", status: "granted", policy_version: "v" }],
});

async function verifiedRequest(db: ReturnType<typeof createFakeDb>, type: "access_export" | "erasure", studentId = "s1") {
  const { id } = await performSubmit({
    adminClient: db, actorId: "g1", input: { subjectType: "student", studentId, requestType: type },
  }).catch(() => ({ id: "" }));
  if (id) await performTransition({ adminClient: db, actorId: "adminA", actorSchoolId: "A", input: { requestId: id, to: "verified" } });
  return id;
}

describe("DSR execution (fake clients)", () => {
  it("submit: guardian only for own child; due in 30 days; event + audit written", async () => {
    const db = createFakeDb(seed());
    await expect(
      performSubmit({ adminClient: db, actorId: "g2", input: { subjectType: "student", studentId: "s1", requestType: "erasure" } }),
    ).rejects.toThrow(/Forbidden/);
    expect(db.tables.data_subject_requests ?? []).toHaveLength(0);
    const { id } = await performSubmit({
      adminClient: db, actorId: "g1", input: { subjectType: "student", studentId: "s1", requestType: "erasure" },
    });
    const row = db.tables.data_subject_requests.find((r) => r.id === id)!;
    expect(new Date(row.due_at as string).getTime() - new Date(row.received_at as string).getTime()).toBe(30 * 86_400_000);
    expect(db.tables.data_subject_request_events).toHaveLength(1);
    expect(db.tables.audit_logs).toHaveLength(1);
  });

  it("transition rejects illegal moves, foreign admins and non-admins", async () => {
    const db = createFakeDb(seed());
    const { id } = await performSubmit({
      adminClient: db, actorId: "g1", input: { subjectType: "student", studentId: "s1", requestType: "erasure" },
    });
    await expect(performTransition({ adminClient: db, actorId: "adminA", actorSchoolId: "A", input: { requestId: id, to: "completed" } })).rejects.toThrow(/Illegal/);
    await expect(performTransition({ adminClient: db, actorId: "adminB", actorSchoolId: "B", input: { requestId: id, to: "verified" } })).rejects.toThrow(/not found/);
    await expect(performTransition({ adminClient: db, actorId: "g1", actorSchoolId: "A", input: { requestId: id, to: "verified" } })).rejects.toThrow(/Forbidden/);
    await expect(performTransition({ adminClient: db, actorId: "adminA", actorSchoolId: "A", input: { requestId: id, to: "rejected" } })).rejects.toThrow(/reason/);
    await performTransition({ adminClient: db, actorId: "adminA", actorSchoolId: "A", input: { requestId: id, to: "verified" } });
    expect(db.tables.data_subject_requests[0].status).toBe("verified");
  });

  it("execution requires verified status", async () => {
    const db = createFakeDb(seed());
    const { id } = await performSubmit({
      adminClient: db, actorId: "g1", input: { subjectType: "student", studentId: "s1", requestType: "erasure" },
    });
    await expect(performErasure({ adminClient: db, actorId: "adminA", actorSchoolId: "A", input: { requestId: id } })).rejects.toThrow(/verified/);
    expect(db.tables.students[0].parent_name).toBe("Mum One");
  });

  it("erasure touches only subject rows, anonymizes financials, retains consent", async () => {
    const db = createFakeDb(seed());
    const id = await verifiedRequest(db, "erasure");
    const res = await performErasure({ adminClient: db, actorId: "adminA", actorSchoolId: "A", input: { requestId: id } });
    expect(res.ok).toBe(true);

    const s1 = db.tables.students.find((r) => r.id === "s1")!;
    expect(s1.parent_name).toBeNull();
    expect(s1.date_of_birth).toBeNull();
    expect(db.tables.students.find((r) => r.id === "s2")!.parent_name).toBe("Mum Two");
    expect(db.tables.students.find((r) => r.id === "sB")!.parent_name).toBe("Mum B");

    const f1 = db.tables.fees.find((r) => r.id === "f1")!;
    expect(f1.amount).toBe(5000);
    expect(f1.paystack_reference).toBeNull();
    expect(db.tables.fees.find((r) => r.id === "f2")!.paystack_reference).toBe("ref2");
    expect(db.tables.fees.find((r) => r.id === "fB")!.paystack_reference).toBe("refB");
    expect(db.tables.fees).toHaveLength(3);

    expect(db.tables.grades.find((r) => r.id === "gr1")!.grade_remark).toBeNull();
    expect(db.tables.grades.find((r) => r.id === "gr2")!.grade_remark).toBe("fine");
    expect(db.tables.parent_student_map.map((m) => m.id).sort()).toEqual(["m2", "mB"]);
    expect(db.tables.consent_records).toHaveLength(1);

    // no write ever targeted another school or another student
    for (const l of db.log.filter((x) => ["update", "delete"].includes(x.op) && x.table !== "data_subject_requests")) {
      expect(l.filters).toContainEqual(["school_id", "A"]);
      expect(l.filters.some(([, v]) => v === "s1")).toBe(true);
    }
    const req = db.tables.data_subject_requests[0];
    expect(req.status).toBe("completed");
    expect(db.tables.data_subject_request_events.map((e) => e.to_status)).toEqual(["received", "verified", "completed"]);
    expect(db.tables.audit_logs.some((a) => a.action === "dsr.erasure")).toBe(true);
  });

  it("export returns only the subject's rows and persists counts, not data", async () => {
    const db = createFakeDb(seed());
    const id = await verifiedRequest(db, "access_export");
    const out = await performExport({ adminClient: db, actorId: "adminA", actorSchoolId: "A", input: { requestId: id } });
    expect(out.data.students.map((r) => r.id)).toEqual(["s1"]);
    expect(out.data.fees.map((r) => r.id)).toEqual(["f1"]);
    expect(JSON.stringify(out)).not.toMatch(/Mum Two|Mum B|ref2|refB/);
    const stored = db.tables.data_subject_requests[0];
    expect(stored.status).toBe("completed");
    expect(JSON.stringify(stored.result)).not.toMatch(/Mum One/);
  });

  it("a foreign-school admin cannot execute", async () => {
    const db = createFakeDb(seed());
    const id = await verifiedRequest(db, "erasure");
    await expect(performErasure({ adminClient: db, actorId: "adminB", actorSchoolId: "B", input: { requestId: id } })).rejects.toThrow(/not found/);
  });
});
