import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

/**
 * Internal console e2e (phases 1–5). NON-PROD ONLY: needs a local / preview
 * Supabase stack with migrations 0150 + 0160 and a service-role key. The
 * suite refuses to run against the production project or app host.
 */
const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ANON = process.env.SUPABASE_ANON_KEY ?? "";
const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:8080";
const PROD_MARKERS = ["nwrflbpbhyiqdptmlccm", "app.sherivs.com", "sherivs.com"];
const IS_PROD = PROD_MARKERS.some((m) => SUPABASE_URL.includes(m) || BASE.includes(m));
const LIVE = Boolean(SUPABASE_URL && SERVICE_ROLE && ANON) && !IS_PROD;

test.describe("internal console: staff + support access (non-prod)", () => {
  test.skip(!LIVE, "requires a NON-PROD Supabase stack (refuses production)");

  test("support staff only see a tenant while a grant is live", async () => {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const email = `e2e-support-${Date.now()}@example.test`;
    const password = `E2e-${Date.now()}-Pw`;
    const { data: u, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    expect(error).toBeNull();
    const staffId = u.user!.id;
    const { data: school } = await admin
      .from("schools")
      .insert({ name: "E2E Support School", slug: `e2e-support-${Date.now()}` })
      .select("id")
      .single();
    try {
      await admin
        .from("platform_staff")
        .insert({ id: staffId, email, full_name: "E2E Support", status: "active" });
      await admin.from("platform_staff_roles").insert({ staff_id: staffId, role_code: "support" });

      const user = createClient(SUPABASE_URL, ANON, { auth: { persistSession: false } });
      await user.auth.signInWithPassword({ email, password });
      const before = await user.rpc("has_support_access", { p_tenant: school!.id });
      expect(before.data).toBe(false);

      const { data: g } = await admin
        .from("platform_support_grants")
        .insert({
          staff_id: staffId,
          tenant_id: school!.id,
          reason: "E2E support ticket",
          expires_at: new Date(Date.now() + 3_600_000).toISOString(),
        })
        .select("id")
        .single();
      expect((await user.rpc("has_support_access", { p_tenant: school!.id })).data).toBe(true);
      const selfGrant = await user.from("platform_support_grants").insert({
        staff_id: staffId,
        tenant_id: school!.id,
        reason: "self grant attempt",
        expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      });
      expect(selfGrant.error).not.toBeNull();

      await admin
        .from("platform_support_grants")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", g!.id);
      expect((await user.rpc("has_support_access", { p_tenant: school!.id })).data).toBe(false);
    } finally {
      await admin.from("schools").delete().eq("id", school!.id);
      await admin.auth.admin.deleteUser(staffId);
    }
  });
});
