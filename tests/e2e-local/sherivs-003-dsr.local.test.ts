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

  async function seedRows(s: Side, studentId: string, tag: string, amount: number) {
    const ok = (r: { error: unknown }) => { if (r.error) throw r.error; };
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
