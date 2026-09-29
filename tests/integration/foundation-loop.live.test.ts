import { createClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import { executeRecordFoundationLoop } from "@/lib/foundation-loop.functions";

const url = process.env.SUPABASE_URL ?? "";
const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
const email = process.env.FOUNDATION_LOOP_EMAIL ?? "";
const password = process.env.FOUNDATION_LOOP_PASSWORD ?? "";
const entityId = process.env.FOUNDATION_LOOP_ENTITY_ID ?? "";
const userId = process.env.FOUNDATION_LOOP_USER_ID ?? "";

const enabled = Boolean(url && anonKey && email && password && entityId && userId);

describe.skipIf(!enabled)("foundation loop live session", () => {
  it("verifies a same-tenant reality reference and replays the same execution", async () => {
    const supabase = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const signedIn = await supabase.auth.signInWithPassword({ email, password });
    expect(signedIn.error).toBeNull();
    expect(signedIn.data.user?.id).toBe(userId);

    const data = {
      realityRef: entityId,
      missionId: "COREGRID-FOUNDATION-MISSION-001",
      version: "live-1",
      purpose: "bounded-reality-loop",
      authorityRef: "CONTROL-PLANE-06",
      contextRef: "foundation-live-context",
      ownerRef: "MISSIONS.md",
      action: "record-observation" as const,
      idempotencyKey: "foundation-live-idem-001",
    };
    const first = await executeRecordFoundationLoop({ supabase, userId, data });
    expect(first.replayed).toBe(false);
    expect(first.executionStatus).toBe("admitted");
    expect(first.verification?.decision).toBe("verified");

    const second = await executeRecordFoundationLoop({ supabase, userId, data });
    expect(second.replayed).toBe(true);
    expect(second.executionId).toBe(first.executionId);
    expect(second.verification?.decision).toBe("verified");
  }, 90000);
});
