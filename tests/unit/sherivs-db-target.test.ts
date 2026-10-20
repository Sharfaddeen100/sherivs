import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DatabaseTargetError,
  PRODUCTION_PROJECT_REF,
  STAGING_PROJECT_REF,
  openValidatedPostgresClient,
  redactSecrets,
  resolveExplicitTarget,
  resolveManagementProjectRef,
  resolvePostgresConnection,
// @ts-expect-error — untyped plain-JS SHERIVS script imported into the TS unit suite (same pattern as tests/unit/h3-036-posture-adjudication.test.ts)
} from "../../scripts/lib/sherivs-db-target.mjs";
import { resolvePublicSupabaseConfig } from "../../frontend/src/integrations/supabase/public-config";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const PRODUCTION_URL = `postgresql://postgres:fixture-not-a-secret@db.${PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres`;
const STAGING_URL = `postgresql://postgres:fixture-not-a-secret@db.${STAGING_PROJECT_REF}.supabase.co:5432/postgres`;
const LOCAL_URL = "postgresql://postgres:fixture-not-a-secret@127.0.0.1:5432/postgres";

function expectCode(fn: () => unknown, code: string) {
  try {
    fn();
    throw new Error(`expected ${code} to be thrown`);
  } catch (err) {
    expect(err).toBeInstanceOf(DatabaseTargetError);
    expect((err as { code: string }).code).toBe(code);
  }
}

describe("TEST 1 — missing target", () => {
  it("refuses a protected Postgres operation when SHERIVS_DATABASE_TARGET is absent", () => {
    expectCode(
      () => resolvePostgresConnection({ DATABASE_URL: LOCAL_URL }),
      "TARGET_MISSING",
    );
  });
});

describe("TEST 2 — empty target", () => {
  it("rejects an empty target", () => {
    expectCode(
      () => resolvePostgresConnection({ SHERIVS_DATABASE_TARGET: "   ", DATABASE_URL: LOCAL_URL }),
      "TARGET_EMPTY",
    );
  });
});

describe("TEST 3 — unknown / unsupported target", () => {
  it("rejects unknown and unsupported targets", () => {
    expectCode(
      () => resolvePostgresConnection({ SHERIVS_DATABASE_TARGET: "unknown", DATABASE_URL: LOCAL_URL }),
      "TARGET_UNKNOWN",
    );
    expectCode(
      () => resolvePostgresConnection({ SHERIVS_DATABASE_TARGET: "preview", DATABASE_URL: LOCAL_URL }),
      "TARGET_UNSUPPORTED",
    );
  });
});

describe("TEST 4 — unknown environment does not become development", () => {
  it("does not infer development from NODE_ENV absence when a target is missing", () => {
    expectCode(() => resolveExplicitTarget({}), "TARGET_MISSING");
    expectCode(() => resolveExplicitTarget({ NODE_ENV: "weird" }), "TARGET_MISSING");
  });
});

describe("TEST 5 — production target mismatch", () => {
  it("rejects the known production project reference as staging", () => {
    expectCode(
      () =>
        resolvePostgresConnection({
          SHERIVS_DATABASE_TARGET: "staging",
          STAGING_DATABASE_URL: PRODUCTION_URL,
        }),
      "TARGET_PRODUCTION_AS_STAGING",
    );
    expectCode(
      () =>
        resolveManagementProjectRef(
          { SHERIVS_DATABASE_TARGET: "staging" },
          PRODUCTION_PROJECT_REF,
        ),
      "TARGET_PRODUCTION_AS_STAGING",
    );
  });
});

describe("TEST 6 — staging target mismatch", () => {
  it("rejects the known staging project reference as production", () => {
    expectCode(
      () =>
        resolvePostgresConnection({
          SHERIVS_DATABASE_TARGET: "production",
          SHERIVS_CONFIRM_PRODUCTION: PRODUCTION_PROJECT_REF,
          PRODUCTION_DATABASE_URL: STAGING_URL,
        }),
      "TARGET_STAGING_AS_PRODUCTION",
    );
    expectCode(
      () =>
        resolveManagementProjectRef(
          {
            SHERIVS_DATABASE_TARGET: "production",
            SHERIVS_CONFIRM_PRODUCTION: PRODUCTION_PROJECT_REF,
          },
          STAGING_PROJECT_REF,
        ),
      "TARGET_STAGING_AS_PRODUCTION",
    );
  });
});

describe("TEST 7 — URL/target mismatch", () => {
  it("rejects a Supabase URL that does not identify the declared target", () => {
    expectCode(
      () =>
        resolvePostgresConnection({
          SHERIVS_DATABASE_TARGET: "staging",
          STAGING_DATABASE_URL: "postgresql://postgres:fixture@db.otherprojectrefxxxx.supabase.co:5432/postgres",
        }),
      "TARGET_URL_TARGET_MISMATCH",
    );
  });
});

describe("TEST 8 — no implicit DATABASE_URL fallback", () => {
  it("refuses a staging operation that only has a generic DATABASE_URL", () => {
    expectCode(
      () =>
        resolvePostgresConnection({
          SHERIVS_DATABASE_TARGET: "staging",
          DATABASE_URL: PRODUCTION_URL,
        }),
      "TARGET_FORBIDDEN_FALLBACK",
    );
  });

  it("refuses a production operation that only has a generic DATABASE_URL", () => {
    expectCode(
      () =>
        resolvePostgresConnection({
          SHERIVS_DATABASE_TARGET: "production",
          SHERIVS_CONFIRM_PRODUCTION: PRODUCTION_PROJECT_REF,
          DATABASE_URL: PRODUCTION_URL,
        }),
      "TARGET_FORBIDDEN_FALLBACK",
    );
  });
});

describe("TEST 9 — credential presence is insufficient", () => {
  it("does not treat service-role or database URL presence as a target", () => {
    expectCode(
      () =>
        resolvePostgresConnection({
          DATABASE_URL: LOCAL_URL,
          SUPABASE_SERVICE_ROLE_KEY: "not-a-real-key",
          SUPABASE_URL: "https://example.supabase.co",
        }),
      "TARGET_MISSING",
    );
  });
});

describe("TEST 10 — conflict detection", () => {
  it("fails closed on conflicting target indicators", () => {
    expectCode(
      () =>
        resolveExplicitTarget({
          SHERIVS_DATABASE_TARGET: "staging",
          NODE_ENV: "production",
        }),
      "TARGET_CONFLICT",
    );
    expectCode(
      () =>
        resolveManagementProjectRef(
          {
            SHERIVS_DATABASE_TARGET: "staging",
            SHERIVS_PROJECT_REF: STAGING_PROJECT_REF,
          },
          PRODUCTION_PROJECT_REF,
        ),
      "TARGET_CONFLICT",
    );
  });
});

describe("TEST 11 — no socket before refusal", () => {
  it("does not invoke the connection factory when configuration is invalid", () => {
    const factory = () => {
      throw new Error("connect factory must not run");
    };
    expectCode(
      () => openValidatedPostgresClient({ DATABASE_URL: LOCAL_URL }, factory),
      "TARGET_MISSING",
    );
  });

  it("invokes the factory only after validation succeeds", () => {
    const seen: string[] = [];
    const client = openValidatedPostgresClient(
      {
        SHERIVS_DATABASE_TARGET: "development",
        DATABASE_URL: LOCAL_URL,
      },
      (resolved: { connectionString: string }) => {
        seen.push(resolved.connectionString);
        return { mock: true };
      },
    );
    expect(seen).toEqual([LOCAL_URL]);
    expect(client).toEqual({ mock: true });
  });
});

describe("TEST 12 — production authorization remains separate", () => {
  it("does not authorize production merely by selecting the target", () => {
    expectCode(
      () =>
        resolvePostgresConnection({
          SHERIVS_DATABASE_TARGET: "production",
          PRODUCTION_DATABASE_URL: PRODUCTION_URL,
        }),
      "TARGET_PRODUCTION_NOT_AUTHORIZED",
    );
    expectCode(
      () =>
        resolveManagementProjectRef(
          { SHERIVS_DATABASE_TARGET: "production" },
          PRODUCTION_PROJECT_REF,
        ),
      "TARGET_PRODUCTION_NOT_AUTHORIZED",
    );
  });
});

describe("TEST 14 — browser/server configuration boundary", () => {
  it("refuses browser fallback to server-only public vars", () => {
    expect(() =>
      resolvePublicSupabaseConfig({
        isBrowser: true,
        serverUrl: "https://example.supabase.co",
        serverKey: "pk_test",
      }),
    ).toThrow(/not a browser fallback/);
  });

  it("refuses silent mismatch between VITE and server public config", () => {
    expect(() =>
      resolvePublicSupabaseConfig({
        isBrowser: false,
        viteUrl: "https://vite.supabase.co",
        viteKey: "pk_vite",
        serverUrl: "https://server.supabase.co",
        serverKey: "pk_vite",
      }),
    ).toThrow(/disagree/);
  });
});

describe("TEST 15 — local development compatibility", () => {
  it("accepts an explicit development target with a local DATABASE_URL", () => {
    const resolved = resolvePostgresConnection({
      SHERIVS_DATABASE_TARGET: "development",
      DATABASE_URL: LOCAL_URL,
    });
    expect(resolved.target).toBe("development");
    expect(resolved.sourceName).toBe("DATABASE_URL");
    expect(resolved.connectionString).toBe(LOCAL_URL);
  });

  it("refuses development against the known production project", () => {
    expectCode(
      () =>
        resolvePostgresConnection({
          SHERIVS_DATABASE_TARGET: "development",
          DATABASE_URL: PRODUCTION_URL,
        }),
      "TARGET_DEVELOPMENT_LIVE_REF",
    );
  });
});

describe("TEST 16 — diagnostics do not disclose secrets", () => {
  it("redacts passwords, tokens, and connection-string secrets", () => {
    const redacted = redactSecrets(
      `postgresql://postgres:super-secret@db.${PRODUCTION_PROJECT_REF}.supabase.co:5432/postgres sbp_liveexampletoken eyJaaaaaaaaaaaaaaaaaaaa.bbbbbbbbbbbbbbbbbbbb.cccccccccccc sk_live_ABCDEFghijkl`,
    );
    expect(redacted).not.toContain("super-secret");
    expect(redacted).not.toContain("sbp_liveexampletoken");
    expect(redacted).not.toContain("sk_live_ABCDEFghijkl");
    expect(redacted).toContain("***@");
    expect(redacted).toContain("[redacted-token]");
  });

  it("failure messages name the contract, not the credential value", () => {
    try {
      resolvePostgresConnection({
        SHERIVS_DATABASE_TARGET: "staging",
        STAGING_DATABASE_URL: PRODUCTION_URL,
      });
    } catch (err) {
      const message = String((err as Error).message);
      expect(message).toContain("TARGET_PRODUCTION_AS_STAGING");
      expect(message).not.toContain("fixture-not-a-secret");
    }
  });
});

describe("protected script entry points refuse before connecting", () => {
  function spawnScript(script: string, extraEnv: Record<string, string> = {}, args: string[] = []) {
    return spawnSync("node", [join(ROOT, script), ...args], {
      encoding: "utf8",
      cwd: ROOT,
      env: {
        PATH: process.env.PATH ?? "",
        HOME: process.env.HOME ?? "",
        ...extraEnv,
      },
    });
  }

  it("db-apply.mjs exits 2 when the target is missing", () => {
    const result = spawnScript("scripts/db-apply.mjs", { DATABASE_URL: LOCAL_URL });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/TARGET_MISSING/);
    expect(result.stderr).not.toContain("fixture-not-a-secret");
  });

  it("db-apply-mgmt.mjs does not default to the production project", () => {
    const result = spawnScript("scripts/db-apply-mgmt.mjs", {
      SUPABASE_ACCESS_TOKEN: "sbp_not-a-real-token",
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/TARGET_MISSING/);
  });

  it("db-run.mjs refuses staging fallback to DATABASE_URL", () => {
    const result = spawnScript(
      "scripts/db-run.mjs",
      {
        SHERIVS_DATABASE_TARGET: "staging",
        DATABASE_URL: PRODUCTION_URL,
      },
      ["SELECT 1"],
    );
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/TARGET_FORBIDDEN_FALLBACK/);
  });
});
