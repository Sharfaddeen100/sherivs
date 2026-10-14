/**
 * Expected-object contract derived from pinned migration SQL.
 *
 * This is a schema *existence* contract, not a security proof:
 * - Presence of a table or policy name does not prove RLS predicates,
 *   grants, tenant isolation, or application behaviour are correct.
 * - SHERIVS-001 / 002 / 003 remain OPEN even if every expected object
 *   exists.
 *
 * Limitations (do not treat a match as a fingerprint of correctness):
 * 1. Only static CREATE TABLE / CREATE POLICY statements are extracted.
 * 2. Dynamic SQL, EXECUTE, and DO-block constructed names are invisible.
 * 3. Column lists, constraints, indexes, triggers, and grants are not
 *    compared.
 * 4. Policy USING / WITH CHECK expressions are not compared.
 * 5. DROP / ALTER that later removes or renames an object is not subtracted.
 * 6. Comments are stripped before matching; dollar-quoted strings that
 *    contain CREATE TABLE text can still produce false positives.
 * 7. Vendor/system schemas are out of scope for Scholar expected objects.
 * 8. Offline mode cannot observe a live catalog; existence checks require
 *    a future read-only staging catalog.
 *
 * Many CREATE TABLE / CREATE POLICY statements in the 71-file pin are not
 * idempotent (no IF NOT EXISTS). A partial catalog therefore must not be
 * "completed" by replaying those files.
 */

const TABLE_RE =
  /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:ONLY\s+)?((?:"[^"]+"|[a-zA-Z_][\w$]*)(?:\s*\.\s*(?:"[^"]+"|[a-zA-Z_][\w$]*))?)/gi;

const POLICY_RE =
  /CREATE\s+POLICY\s+((?:"[^"]+"|[a-zA-Z_][\w$]*))\s+ON\s+((?:"[^"]+"|[a-zA-Z_][\w$]*)(?:\s*\.\s*(?:"[^"]+"|[a-zA-Z_][\w$]*))?)/gi;

const IF_NOT_EXISTS_TABLE_RE =
  /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS/gi;

export const CONTRACT_LIMITATIONS = Object.freeze([
  "static CREATE TABLE / CREATE POLICY only",
  "no column, constraint, grant, or policy-expression comparison",
  "existence is not application-security proof",
  "non-idempotent CREATE statements must not be replayed against a partial catalog",
  "live catalog observation is required before execute; offline cannot prove emptiness",
]);

export const VENDOR_SCHEMAS = Object.freeze([
  "auth",
  "storage",
  "realtime",
  "supabase_functions",
  "supabase_migrations",
  "extensions",
  "graphql",
  "graphql_public",
  "vault",
  "net",
  "cron",
  "pgbouncer",
  "pgsodium",
  "information_schema",
  "pg_catalog",
  "pg_toast",
]);

export const CATALOG_OBSERVE_SQL = Object.freeze({
  tables: `SELECT n.nspname AS schema, c.relname AS name
             FROM pg_class c
             JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relkind = 'r'
              AND n.nspname = 'public'
            ORDER BY 1, 2`,
  policies: `SELECT n.nspname AS schema,
                    c.relname AS table,
                    p.polname AS name
               FROM pg_policy p
               JOIN pg_class c ON c.oid = p.polrelid
               JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = 'public'
              ORDER BY 1, 2, 3`,
  vendorHistory: `SELECT version
                    FROM supabase_migrations.schema_migrations
                   ORDER BY version`,
  note: "read-only observation plan for a future authorized catalog mission; this process does not execute it",
});

function stripSqlComments(sql) {
  return String(sql)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ");
}

function qualify(raw, defaultSchema = "public") {
  const cleaned = String(raw).replaceAll('"', "").replace(/\s+/g, "");
  if (cleaned.includes(".")) {
    const [schema, name] = cleaned.split(".");
    return { schema: schema.toLowerCase(), name: name.toLowerCase() };
  }
  return { schema: defaultSchema, name: cleaned.toLowerCase() };
}

export function extractExpectedObjects(sqlByFilename = {}) {
  const tables = [];
  const policies = [];
  const tableKeys = new Set();
  const policyKeys = new Set();
  let idempotentCreateTable = 0;
  let nonIdempotentCreateTable = 0;

  for (const [filename, sql] of Object.entries(sqlByFilename)) {
    const body = stripSqlComments(sql);
    const ifNot = body.match(IF_NOT_EXISTS_TABLE_RE)?.length ?? 0;
    idempotentCreateTable += ifNot;
    TABLE_RE.lastIndex = 0;
    let match;
    while ((match = TABLE_RE.exec(body))) {
      const ident = qualify(match[1]);
      const key = `${ident.schema}.${ident.name}`;
      if (!tableKeys.has(key)) {
        tableKeys.add(key);
        tables.push({ ...ident, key, sourceFile: filename });
      }
      if (!/IF\s+NOT\s+EXISTS/i.test(match[0])) {
        nonIdempotentCreateTable += 1;
      }
    }
    POLICY_RE.lastIndex = 0;
    while ((match = POLICY_RE.exec(body))) {
      const table = qualify(match[2]);
      const name = String(match[1]).replaceAll('"', "");
      const key = `${table.schema}.${table.name}::${name}`;
      if (!policyKeys.has(key)) {
        policyKeys.add(key);
        policies.push({
          name,
          schema: table.schema,
          table: `${table.schema}.${table.name}`,
          key,
          sourceFile: filename,
        });
      }
    }
  }

  tables.sort((a, b) => a.key.localeCompare(b.key));
  policies.sort((a, b) => a.key.localeCompare(b.key));

  return {
    tables,
    policies,
    tableCount: tables.length,
    policyCount: policies.length,
    idempotentCreateTable,
    nonIdempotentCreateTable,
    limitations: CONTRACT_LIMITATIONS,
    securityProof: false,
    existenceOnly: true,
  };
}

export function compareCatalog(expected, catalog) {
  if (!catalog || catalog.status !== "observed") {
    return {
      available: false,
      status: catalog?.status ?? "NOT_CHECKED",
      missingTables: [],
      unexpectedTables: [],
      missingPolicies: [],
      matchingTables: 0,
      securityProof: false,
    };
  }

  const observedTables = new Set(
    (catalog.tables ?? []).map((t) => {
      const schema = (t.schema ?? "public").toLowerCase();
      const name = String(t.name).toLowerCase();
      return `${schema}.${name}`;
    }),
  );
  const observedPolicies = new Set(
    (catalog.policies ?? []).map((p) => {
      const table = String(p.table).replaceAll('"', "").toLowerCase();
      const qualified = table.includes(".") ? table : `public.${table}`;
      return `${qualified}::${p.name}`;
    }),
  );

  const missingTables = expected.tables.filter((t) => !observedTables.has(t.key));
  const expectedKeys = new Set(expected.tables.map((t) => t.key));
  const unexpectedTables = (catalog.tables ?? []).filter((t) => {
    const schema = (t.schema ?? "public").toLowerCase();
    if (VENDOR_SCHEMAS.includes(schema)) return false;
    const name = String(t.name).toLowerCase();
    return !expectedKeys.has(`${schema}.${name}`);
  });
  const missingPolicies = expected.policies.filter(
    (p) => !observedPolicies.has(p.key),
  );

  return {
    available: true,
    status: "observed",
    missingTables,
    unexpectedTables,
    missingPolicies,
    matchingTables: expected.tables.length - missingTables.length,
    matchingPolicies: expected.policies.length - missingPolicies.length,
    expectedTableCount: expected.tables.length,
    expectedPolicyCount: expected.policies.length,
    securityProof: false,
    existenceOnly: true,
    limitations: CONTRACT_LIMITATIONS,
  };
}

export function versionOfFilename(filename) {
  return String(filename).slice(0, 14);
}
