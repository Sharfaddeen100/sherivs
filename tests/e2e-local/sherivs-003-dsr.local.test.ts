/**
 * SHERIVS-003 — local end-to-end DSR check against a LOCAL Supabase stack only.
 *
 *   SV3_LOCAL=1 SUPABASE_LOCAL_SERVICE_ROLE_KEY=... SUPABASE_LOCAL_ANON_KEY=... \
 *     npx vitest run tests/e2e-local/sherivs-003-dsr.local.test.ts
 *
 * Skipped unless SV3_LOCAL=1. The target URL is hard-wired to
 * http://127.0.0.1:54321; keys come from the environment and are never printed.
 * Seeds two schools, runs the real submit/transition/export/erasure paths with
 * the service-role client, asserts, then removes everything it created.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  performErasure,
  performExport,
  performSubmit,
  performTransition,
} from "@/lib/compliance/dsr.functions";
import type { ComplianceDb } from "@/lib/compliance/db";

const LOCAL_URL = "http://127.0.0.1:54321";
const RUN = Math.random().toString(36).slice(2, 10);
const enabled = process.env.SV3_LOCAL === "1";
const serviceKey = process.env.SUPABASE_LOCAL_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_LOCAL_ANON_KEY;

if (enabled) {
  const configured = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  if (configured && configured !== LOCAL_URL) {
    throw new Error("SV3 e2e: refusing to run with a non-local SUPABASE_URL in the environment");
  }
  if (!serviceKey || !anonKey) {
    throw new Error("SV3 e2e: SUPABASE_LOCAL_SERVICE_ROLE_KEY and SUPABASE_LOCAL_ANON_KEY are required");
  }
}

type Side = {
  schoolId: string;
  adminId: string;
  parentId: string;
  studentId: string;
  parentEmail: string;
};

const PASSWORD = `Sv3-${randomUUID()}`;

describe.skipIf(!enabled)("SHERIVS-003 DSR end-to-end (local stack)", () => {
  let svc: SupabaseClient;
  const db = () => svc as unknown as ComplianceDb;
  const sides: Record<"A" | "B", Side> = {} as never;
  let studentA2: string;
  const authIds: string[] = [];
  const run = randomUUID().slice(0, 8);

  async function seedSide(label: "A" | "B"): Promise<Side> {
    const { data: school, error: se } = await svc
      .from("schools")
      .insert({ name: `SV3 ${label} ${run}`, slug: `sv3-${label.toLowerCase()}-${run}` })
      .select("id")
      .single();
    if (se) throw se;
    const mk = async (role: string) => {
      const email = `sv3-${label}-${role}-${run}@sv3.invalid`;
      const { data, error } = await svc.auth.admin.createUser({
        email, password: PASSWORD, email_confirm: true,
      });
      if (error) throw error;
      authIds.push(data.user.id);
      const { error: ue } = await svc.from("users").insert({
        id: data.user.id, school_id: school.id, full_name: `${role} ${label}`, email, role, is_active: true,
      });
      if (ue) throw ue;
      return { id: data.user.id, email };
    };
    const admin = await mk("admin");
    const parent = await mk("parent");
    const { data: stu, error: te } = await svc
      .from("students")
      .insert({
        school_id: school.id, admission_number: `SV3-${label}-${run}`, parent_name: `Parent ${label}`,
        parent_phone: "0800000000", home_address: `Addr ${label}`, date_of_birth: "2015-05-05",
      })
      .select("id")
      .single();
    if (te) throw te;
    await svc.from("parent_student_map").insert({ school_id: school.id, parent_id: parent.id, student_id: stu.id });
    return { schoolId: school.id, adminId: admin.id, parentId: parent.id, studentId: stu.id, parentEmail: parent.email };
  }

  const busIds: Record<string, string> = {};

  async function seedRows(s: Side, studentId: string, tag: string, amount: number) {
    const ok = (r: { error: unknown }) => { if (r.error) throw r.error; };
    const sc = s.schoolId;
    ok(await svc.from("admission_applications").insert({
      school_id: sc, student_id: studentId, application_number: `APP-${tag}-${RUN}`,
      student_first_name: `First-${tag}`, student_last_name: `Last-${tag}`, student_date_of_birth: "2015-05-05",
      student_address: `appaddr-${tag}`, applying_for_class: "JSS1", academic_year_applying: "2026",
      parent_one_name: `P1-${tag}`, parent_one_relationship: "mother", parent_one_phone: `0801-${tag}`,
      parent_one_email: `p1-${tag}@sv3.invalid`, medical_conditions: `appmed-${tag}`, decision_notes: `decide-${tag}`,
    }));
    ok(await svc.from("clinic_visits").insert({ school_id: sc, student_id: studentId, complaint: `complaint-${tag}`, diagnosis: `diag-${tag}`, treatment: `treat-${tag}`, notes: `cnotes-${tag}`, temperature: 37.2 }));
    ok(await svc.from("discipline_records").insert({ school_id: sc, student_id: studentId, incident_type: "fighting", severity: "minor", description: `incident-${tag}`, action_taken: `action-${tag}`, notes: `dnotes-${tag}` }));
    ok(await svc.from("hostel_allocations").insert({ school_id: sc, student_id: studentId, term: `hostel-${tag}` }));
    ok(await svc.from("hostel_attendance").insert({ school_id: sc, student_id: studentId, date: "2026-10-01", notes: `hnotes-${tag}` }));
    ok(await svc.from("library_borrowings").insert({ school_id: sc, student_id: studentId, notes: `lib-${tag}` }));
    ok(await svc.from("study_sessions").insert({ school_id: sc, student_id: studentId, subject: `study-${tag}`, duration_minutes: 30 }));
    ok(await svc.from("digital_twin_calls").insert({ school_id: sc, student_id: studentId, recipient_name: `rcpt-${tag}`, recipient_phone: `0802-${tag}`, call_transcript: `transcript-${tag}`, call_status: "completed" }));
    const bus = await svc.from("transport_buses").insert({ school_id: sc, bus_number: `BUS-${tag}`, route_name: `route-${tag}`, assigned_students: [studentId] }).select("id").single();
    if (bus.error) throw bus.error;
    busIds[tag] = bus.data.id;
    ok(await svc.from("grades").insert({ school_id: s.schoolId, student_id: studentId, subject: "Math", term: "1", academic_year: "2026", grade_remark: `remark-${tag}` }));
    ok(await svc.from("attendance").insert({ school_id: s.schoolId, student_id: studentId, date: "2026-10-01", status: "present", note: `note-${tag}` }));
    ok(await svc.from("fees").insert({ school_id: s.schoolId, student_id: studentId, fee_type: "tuition", amount, paystack_reference: `ref-${tag}-${RUN}` }));
    ok(await svc.from("messages").insert({ school_id: s.schoolId, sender_id: s.adminId, recipient_id: s.parentId, subject: `subj-${tag}`, body: `body-${tag}` }));
  }

  beforeAll(async () => {
    svc = createClient(LOCAL_URL, serviceKey!, { auth: { persistSession: false } });
    sides.A = await seedSide("A");
    sides.B = await seedSide("B");
    const { data: s2, error } = await svc
      .from("students")
      .insert({ school_id: sides.A.schoolId, admission_number: `SV3-A2-${run}`, parent_name: "Parent A2" })
      .select("id")
      .single();
    if (error) throw error;
    studentA2 = s2.id;
    await seedRows(sides.A, sides.A.studentId, "A1", 5000);
    await seedRows(sides.A, studentA2, "A2", 7000);
    await seedRows(sides.B, sides.B.studentId, "B1", 9000);
    const shared = await svc.from("transport_buses").update({ assigned_students: [sides.A.studentId, studentA2] }).eq("id", busIds.A1);
    if (shared.error) throw shared.error;
  });

  afterAll(async () => {
    if (!svc) return;
    for (const s of Object.values(sides)) {
      if (s?.schoolId) await svc.from("schools").delete().eq("id", s.schoolId);
    }
    for (const id of authIds) await svc.auth.admin.deleteUser(id);
  });

  async function filedAndVerified(type: "access_export" | "erasure") {
    const A = sides.A;
    const { id } = await performSubmit({
      adminClient: db(), actorId: A.parentId,
      input: { subjectType: "student", studentId: A.studentId, requestType: type },
    });
    await performTransition({
      adminClient: db(), actorId: A.adminId, actorSchoolId: A.schoolId,
      input: { requestId: id, to: "verified" },
    });
    return id;
  }

  it("parent sees only their own request through RLS", async () => {
    const A = sides.A;
    const { id } = await performSubmit({
      adminClient: db(), actorId: A.parentId,
      input: { subjectType: "student", studentId: A.studentId, requestType: "access_export" },
    });
    const parent = createClient(LOCAL_URL, anonKey!, { auth: { persistSession: false } });
    const { error: le } = await parent.auth.signInWithPassword({ email: A.parentEmail, password: PASSWORD });
    expect(le).toBeNull();
    const { data } = await parent.from("data_subject_requests").select("id, school_id");
    expect((data ?? []).map((r) => r.id)).toContain(id);
    expect((data ?? []).every((r) => r.school_id === A.schoolId)).toBe(true);
  });

  it("export contains the subject's rows and nothing from the other student or school", async () => {
    const A = sides.A;
    const id = await filedAndVerified("access_export");
    const out = await performExport({
      adminClient: db(), actorId: A.adminId, actorSchoolId: A.schoolId, input: { requestId: id },
    });
    const json = JSON.stringify(out);
    expect(out.data.students.map((r) => r.id)).toEqual([A.studentId]);
    expect(out.data.grades).toHaveLength(1);
    expect(out.data.attendance).toHaveLength(1);
    expect(out.data.fees).toHaveLength(1);
    expect(json).toContain("remark-A1");
    expect(json).not.toMatch(/remark-A2|remark-B1|ref-A2|ref-B1|Addr B/);
    for (const t of ["admission_applications", "clinic_visits", "discipline_records", "hostel_allocations",
      "hostel_attendance", "library_borrowings", "study_sessions", "digital_twin_calls", "transport_buses"]) {
      expect(out.data[t], t).toHaveLength(1);
    }
    expect(json).toMatch(/diag-A1/);
    expect(out.data.transport_buses[0]).toEqual({ id: busIds.A1, bus_number: "BUS-A1", route_name: "route-A1" });
    expect(json).not.toMatch(/-A2|-B1|ref-A2/);
    const { data: req } = await svc.from("data_subject_requests").select("status, result").eq("id", id).single();
    expect(req?.status).toBe("completed");
    expect(JSON.stringify(req?.result)).not.toContain("remark-A1");
  });

  it("erasure anonymizes the subject, keeps financial amounts, leaves everyone else untouched", async () => {
    const A = sides.A;
    const id = await filedAndVerified("erasure");
    await performErasure({ adminClient: db(), actorId: A.adminId, actorSchoolId: A.schoolId, input: { requestId: id } });

    const { data: s1 } = await svc.from("students").select("parent_name, parent_phone, home_address, date_of_birth").eq("id", A.studentId).single();
    expect(s1).toEqual({ parent_name: null, parent_phone: null, home_address: null, date_of_birth: null });

    const { data: fees } = await svc.from("fees").select("amount, paystack_reference").eq("student_id", A.studentId);
    expect(fees).toEqual([{ amount: 5000, paystack_reference: null }]);
    const { data: g } = await svc.from("grades").select("grade_remark").eq("student_id", A.studentId);
    // Free-text remark is erased; trg_grades_autocalc then re-derives the standard
    // label from the retained grade (score 0 -> "Fail"), which is not personal free text.
    expect(g).toHaveLength(1);
    expect(g![0].grade_remark).not.toContain("remark-");
    expect(g).toEqual([{ grade_remark: "Fail" }]);
    const { data: att } = await svc.from("attendance").select("note").eq("student_id", A.studentId);
    expect(att).toEqual([{ note: null }]);

    // new registry tables: A1 anonymized/deleted
    const one = async (t: string, col: string, sid: string) =>
      (await svc.from(t).select(col).eq("student_id", sid)).data as unknown as Record<string, unknown>[];
    const adm = (await one("admission_applications", "student_first_name, student_address, parent_one_phone, medical_conditions, decision_notes, application_number", A.studentId))[0];
    expect(adm).toMatchObject({ student_first_name: "Erased subject", student_address: null, medical_conditions: null, decision_notes: null });
    expect(adm.application_number).toBe(`APP-A1-${RUN}`);
    expect(String(adm.parent_one_phone)).not.toContain("0801-A1");
    expect(await one("clinic_visits", "complaint, diagnosis, treatment, notes, temperature", A.studentId))
      .toEqual([{ complaint: null, diagnosis: null, treatment: null, notes: null, temperature: 37.2 }]);
    const disc = (await one("discipline_records", "description, action_taken, notes, severity", A.studentId))[0];
    expect(disc).toMatchObject({ action_taken: null, notes: null, severity: "minor" });
    expect(String(disc.description)).not.toContain("incident-A1");
    for (const t of ["hostel_allocations", "hostel_attendance", "library_borrowings", "study_sessions"]) {
      expect(await one(t, "id", A.studentId), t).toEqual([]);
      expect(await one(t, "id", studentA2), `${t} A2`).toHaveLength(1);
    }
    const call = (await one("digital_twin_calls", "recipient_name, recipient_phone, call_transcript", A.studentId))[0];
    expect(call).toMatchObject({ recipient_phone: null, call_transcript: null });
    const { data: bus1 } = await svc.from("transport_buses").select("assigned_students").eq("id", busIds.A1).single();
    expect(bus1?.assigned_students).toEqual([studentA2]);

    // new registry tables: A2 and school B untouched
    expect(await one("admission_applications", "student_first_name, medical_conditions", studentA2)).toEqual([{ student_first_name: "First-A2", medical_conditions: "appmed-A2" }]);
    expect(await one("clinic_visits", "diagnosis", studentA2)).toEqual([{ diagnosis: "diag-A2" }]);
    expect(await one("discipline_records", "action_taken", studentA2)).toEqual([{ action_taken: "action-A2" }]);
    expect(await one("digital_twin_calls", "call_transcript", studentA2)).toEqual([{ call_transcript: "transcript-A2" }]);
    const bB = sides.B.studentId;
    expect(await one("admission_applications", "student_first_name", bB)).toEqual([{ student_first_name: "First-B1" }]);
    expect(await one("clinic_visits", "diagnosis", bB)).toEqual([{ diagnosis: "diag-B1" }]);
    for (const t of ["hostel_allocations", "hostel_attendance", "library_borrowings", "study_sessions"]) {
      expect(await one(t, "id", bB), `${t} B`).toHaveLength(1);
    }
    const { data: busB } = await svc.from("transport_buses").select("assigned_students").eq("id", busIds.B1).single();
    expect(busB?.assigned_students).toEqual([bB]);
    const { data: busA2 } = await svc.from("transport_buses").select("assigned_students").eq("id", busIds.A2).single();
    expect(busA2?.assigned_students).toEqual([studentA2]);

    // other student in same school
    const { data: s2 } = await svc.from("students").select("parent_name").eq("id", studentA2).single();
    expect(s2?.parent_name).toBe("Parent A2");
    const { data: f2 } = await svc.from("fees").select("paystack_reference").eq("student_id", studentA2);
    expect(f2).toEqual([{ paystack_reference: `ref-A2-${RUN}` }]);
    const { data: g2 } = await svc.from("grades").select("grade_remark").eq("student_id", studentA2);
    expect(g2).toEqual([{ grade_remark: "remark-A2" }]);

    // other school
    const B = sides.B;
    const { data: sB } = await svc.from("students").select("parent_name, home_address").eq("id", B.studentId).single();
    expect(sB).toEqual({ parent_name: "Parent B", home_address: "Addr B" });
    const { data: fB } = await svc.from("fees").select("amount, paystack_reference").eq("student_id", B.studentId);
    expect(fB).toEqual([{ amount: 9000, paystack_reference: `ref-B1-${RUN}` }]);

    // workflow evidence
    const { data: req } = await svc.from("data_subject_requests").select("status, completed_at").eq("id", id).single();
    expect(req?.status).toBe("completed");
    expect(req?.completed_at).not.toBeNull();
    const { data: evs } = await svc.from("data_subject_request_events").select("to_status").eq("request_id", id).order("at");
    expect((evs ?? []).map((e) => e.to_status)).toEqual(["received", "verified", "completed"]);
    const { data: audit } = await svc.from("audit_logs").select("action").eq("record_id", id).eq("school_id", A.schoolId);
    expect((audit ?? []).map((a) => a.action)).toContain("dsr.erasure");
  });
});
