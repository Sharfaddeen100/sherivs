/**
 * Expected-object contract derived from pinned migration SQL.
 *
 * This is a static schema *contract*, not a security proof and not live
 * schema equivalence:
 * - Presence of a table, policy, grant, or function does not prove RLS
 *   predicates, tenant isolation, or application behaviour are correct.
 * - SHERIVS-001 / 002 / 003 remain OPEN even if every expected object
 *   exists and matches this contract.
 * - A match against an injected catalog is not a fingerprint of a live
 *   database. This process does not query PostgreSQL.
 *
 * Objects that cannot be derived reliably from static SQL are marked
 * NOT VERIFIED. Required NOT VERIFIED objects block already_complete.
 *
 * DROP / CREATE / GRANT / REVOKE are applied in filename order so later
 * files (including policy normalization) replace earlier state.
 */

const IDENT = `(?:"[^"]+"|[a-zA-Z_][\\w$]*)`;
const QUAL = `(?:${IDENT}(?:\\s*\\.\\s*${IDENT})?)`;

export const CONTRACT_LIMITATIONS = Object.freeze([
  "static SQL contract from CREATE/ALTER/DROP/GRANT/REVOKE plus recognized DO-foreach expansions",
  "dynamic SQL that cannot be expanded is NOT VERIFIED and blocks completion when required",
  "dollar-quoted function bodies are not scanned for DDL",
  "existence or contract match is not application-security proof",
  "existence or contract match is not live schema equivalence",
  "non-idempotent CREATE statements must not be replayed against a partial catalog",
  "live catalog observation is required before execute; offline cannot prove emptiness",
  "CHECK comparison is whitespace/case-normalized expression text, not proven semantic equivalence (a > 0 vs 0 < a is a mismatch)",
  "FOREIGN KEY REFERENCES table without a column list is implicit-PK; effective referenced columns are the referenced relation PRIMARY KEY, or NOT_VERIFIED if that key cannot be resolved",
  "observation undefined / omitted keys, SQL NULL (legally absent), empty strings, and present values are distinct states",
  "function/table/column grant compare is explicit GRANT tuples from pinned SQL versus the observed grant list, including WITH GRANT OPTION; inherited, OWNER, PUBLIC-default, and ALTER DEFAULT PRIVILEGES are not modeled as effective privilege equivalence",
  "unexpected public columns, constraints, indexes, triggers, and storage buckets refuse already_complete unless listed in CONTRACT_ALLOWLIST",
  "pg_get_expr / format_type output is normalized (timestamptz, varchar) and may still differ from live catalog spelling",
  "function bodies, owners, tablespace, views, sequences, enums, extensions, publications, default privileges, and column defaults are not in this contract",
]);

export const CATALOG_OBSERVE_LIMITATIONS = Object.freeze([
  "this process does not execute CATALOG_OBSERVE_SQL",
  "pg_get_constraintdef / pg_get_expr text is normalized, not executed",
  "implicit primary-key REFERENCES require the referenced table PRIMARY KEY in the same catalog/contract; otherwise NOT_VERIFIED",
  "SQL NULL USING / WITH CHECK is legally absent; a missing observation key is incomplete",
  "function grant SQL uses COALESCE(proacl, acldefault('f', proowner)); that still is not ALTER DEFAULT PRIVILEGES equivalence",
  "owners, tablespaces, inheritance, identity/generated columns, collations, and default privileges are not represented",
  "unknown or unparseable observed rows must be marked unverified and block already_complete",
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

/**
 * Narrow extras that may appear in an observed catalog without refusing
 * completion. This is not a wildcard. It does not permit extra columns,
 * constraints, triggers, buckets, or grants.
 */
export const CONTRACT_ALLOWLIST = Object.freeze({
  vendorSchemas: VENDOR_SCHEMAS,
  extras: Object.freeze({
    constraintImpliedIndexes: Object.freeze({
      permitted: true,
      rationale:
        "PostgreSQL materializes PRIMARY KEY and UNIQUE as unique indexes; those indexes are implied by an already-compared constraint on the same table and ordered columns",
      scope: "indexes only",
    }),
  }),
});

export const SENSITIVE_COLUMN_HINTS = Object.freeze([
  "password",
  "secret",
  "token",
  "ssn",
  "api_key",
  "apikey",
  "private_key",
  "refresh_token",
  "access_token",
  "session_token",
]);

export const CATALOG_OBSERVE_SQL = Object.freeze({
  tables: `SELECT n.nspname AS schema,
                    c.relname AS name,
                    c.relrowsecurity AS rls_enabled,
                    c.relforcerowsecurity AS rls_forced
               FROM pg_class c
               JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE c.relkind = 'r'
                AND n.nspname = 'public'
              ORDER BY 1, 2`,
  columns: `SELECT n.nspname AS schema, c.relname AS table, a.attname AS name,
                    pg_catalog.format_type(a.atttypid, a.atttypmod) AS type,
                    NOT a.attnotnull AS nullable
               FROM pg_attribute a
               JOIN pg_class c ON c.oid = a.attrelid
               JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE a.attnum > 0 AND NOT a.attisdropped AND n.nspname = 'public'`,
  constraints: `SELECT n.nspname AS schema,
                    c.relname AS table,
                    con.conname AS name,
                    CASE con.contype
                      WHEN 'p' THEN 'PRIMARY KEY'
                      WHEN 'u' THEN 'UNIQUE'
                      WHEN 'f' THEN 'FOREIGN KEY'
                      WHEN 'c' THEN 'CHECK'
                      ELSE con.contype::text
                    END AS kind,
                    pg_get_constraintdef(con.oid) AS definition,
                    ARRAY(SELECT a.attname
                            FROM unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
                            JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = k.attnum
                           ORDER BY k.ord) AS columns,
                    fn.nspname AS referenced_schema,
                    ft.relname AS referenced_table,
                    ARRAY(SELECT a.attname
                            FROM unnest(con.confkey) WITH ORDINALITY AS k(attnum, ord)
                            JOIN pg_attribute a ON a.attrelid = con.confrelid AND a.attnum = k.attnum
                           ORDER BY k.ord) AS referenced_columns,
                    CASE con.confdeltype
                      WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
                      WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL'
                      WHEN 'd' THEN 'SET DEFAULT' ELSE NULL END AS on_delete,
                    CASE con.confupdtype
                      WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
                      WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL'
                      WHEN 'd' THEN 'SET DEFAULT' ELSE NULL END AS on_update,
                    con.condeferrable AS deferrable,
                    con.condeferred AS initially_deferred
               FROM pg_constraint con
               JOIN pg_class c ON c.oid = con.conrelid
               JOIN pg_namespace n ON n.oid = c.relnamespace
               LEFT JOIN pg_class ft ON ft.oid = con.confrelid
               LEFT JOIN pg_namespace fn ON fn.oid = ft.relnamespace
              WHERE n.nspname = 'public'`,
  indexes: `SELECT n.nspname AS schema,
                    t.relname AS table,
                    c.relname AS name,
                    i.indisunique AS unique,
                    pg_get_indexdef(i.indexrelid) AS definition
               FROM pg_index i
               JOIN pg_class c ON c.oid = i.indexrelid
               JOIN pg_class t ON t.oid = i.indrelid
               JOIN pg_namespace n ON n.oid = t.relnamespace
              WHERE n.nspname = 'public'`,
  functions: `SELECT n.nspname AS schema,
                    p.proname AS name,
                    pg_get_function_identity_arguments(p.oid) AS identity_args,
                    pg_get_function_arguments(p.oid) AS args,
                    pg_get_function_result(p.oid) AS returns,
                    CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END AS security,
                    l.lanname AS language,
                    CASE p.provolatile WHEN 'i' THEN 'IMMUTABLE' WHEN 's' THEN 'STABLE' ELSE 'VOLATILE' END AS volatility,
                    p.proconfig AS config
               FROM pg_proc p
               JOIN pg_namespace n ON n.oid = p.pronamespace
               JOIN pg_language l ON l.oid = p.prolang
              WHERE n.nspname = 'public'`,
  triggers: `SELECT n.nspname AS schema,
                    c.relname AS table,
                    t.tgname AS name,
                    CASE WHEN t.tgtype & 2 = 2 THEN 'BEFORE'
                         WHEN t.tgtype & 64 = 64 THEN 'INSTEAD OF'
                         ELSE 'AFTER' END AS timing,
                    trim(both ' OR ' FROM concat_ws(' OR ',
                      CASE WHEN t.tgtype & 4 = 4 THEN 'INSERT' END,
                      CASE WHEN t.tgtype & 8 = 8 THEN 'DELETE' END,
                      CASE WHEN t.tgtype & 16 = 16 THEN 'UPDATE' END)) AS events,
                    fn.nspname || '.' || fp.proname AS function
               FROM pg_trigger t
               JOIN pg_class c ON c.oid = t.tgrelid
               JOIN pg_namespace n ON n.oid = c.relnamespace
               JOIN pg_proc fp ON fp.oid = t.tgfoid
               JOIN pg_namespace fn ON fn.oid = fp.pronamespace
              WHERE NOT t.tgisinternal AND n.nspname = 'public'`,
  policies: `SELECT n.nspname AS schema,
                    c.relname AS table,
                    p.polname AS name,
                    p.polpermissive AS permissive,
                    CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                         WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END AS command,
                    ARRAY(SELECT r.rolname FROM pg_roles r WHERE r.oid = ANY (p.polroles)
                          UNION ALL
                          SELECT 'public' WHERE 0::oid = ANY (p.polroles)) AS roles,
                    pg_get_expr(p.polqual, p.polrelid) AS using,
                    pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
               FROM pg_policy p
               JOIN pg_class c ON c.oid = p.polrelid
               JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = 'public'`,
  tableGrants: `SELECT n.nspname AS schema,
                    c.relname AS table,
                    CASE WHEN g.grantee = 0 THEN 'public' ELSE r.rolname END AS grantee,
                    g.privilege AS privilege,
                    g.is_grantable AS grantable
               FROM pg_class c
               JOIN pg_namespace n ON n.oid = c.relnamespace
               CROSS JOIN LATERAL aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner)))
                 AS g(grantor, grantee, privilege, is_grantable)
               LEFT JOIN pg_roles r ON r.oid = g.grantee
              WHERE n.nspname = 'public' AND c.relkind = 'r'`,
  columnGrants: `SELECT n.nspname AS schema,
                    c.relname AS table,
                    a.attname AS column,
                    CASE WHEN g.grantee = 0 THEN 'public' ELSE r.rolname END AS grantee,
                    g.privilege AS privilege,
                    g.is_grantable AS grantable
               FROM pg_attribute a
               JOIN pg_class c ON c.oid = a.attrelid
               JOIN pg_namespace n ON n.oid = c.relnamespace
               CROSS JOIN LATERAL aclexplode(a.attacl) AS g(grantor, grantee, privilege, is_grantable)
               LEFT JOIN pg_roles r ON r.oid = g.grantee
              WHERE a.attnum > 0 AND NOT a.attisdropped AND n.nspname = 'public'`,
  functionGrants: `SELECT n.nspname AS schema,
                    p.proname AS name,
                    pg_get_function_identity_arguments(p.oid) AS args,
                    CASE WHEN g.grantee = 0 THEN 'public' ELSE r.rolname END AS grantee,
                    g.privilege AS privilege,
                    g.is_grantable AS grantable
               FROM pg_proc p
               JOIN pg_namespace n ON n.oid = p.pronamespace
               CROSS JOIN LATERAL aclexplode(COALESCE(p.proacl, acldefault('f', p.proowner)))
                 AS g(grantor, grantee, privilege, is_grantable)
               LEFT JOIN pg_roles r ON r.oid = g.grantee
              WHERE n.nspname = 'public'`,
  storageBuckets: `SELECT id, name, public, file_size_limit, allowed_mime_types
                      FROM storage.buckets`,
  vendorHistory: `SELECT version
                    FROM supabase_migrations.schema_migrations
                   ORDER BY version`,
  note: "read-only observation plan for a future authorized catalog mission; this process does not execute it",
  limitations: CATALOG_OBSERVE_LIMITATIONS,
});

export const REQUIRED_OBSERVED_CLASSES = Object.freeze([
  "tables",
  "columns",
  "constraints",
  "indexes",
  "functions",
  "triggers",
  "rls",
  "policies",
  "grants",
  "columnGrants",
  "functionGrants",
  "storageBuckets",
]);

/**
 * Unused observe-SQL → comparator field map. This process does not execute
 * the SQL. A later authorized mapper must populate every contract field;
 * omitting a required key is incomplete, SQL NULL is legally absent.
 */
export const OBSERVE_SQL_FIELD_MAP = Object.freeze({
  tables: {
    sql: ["schema", "name", "rls_enabled", "rls_forced"],
    contract: ["schema", "name", "rlsEnabled", "rlsForced"],
  },
  columns: {
    sql: ["schema", "table", "name", "type", "nullable"],
    contract: ["schema", "table", "name", "type", "nullable"],
  },
  constraints: {
    sql: [
      "schema",
      "table",
      "name",
      "kind",
      "definition",
      "columns",
      "referenced_schema",
      "referenced_table",
      "referenced_columns",
      "on_delete",
      "on_update",
      "deferrable",
      "initially_deferred",
    ],
    contract: [
      "schema",
      "table",
      "name",
      "kind",
      "spec",
      "columns",
      "referencedSchema",
      "referencedTable",
      "referencedColumns",
      "onDelete",
      "onUpdate",
      "deferrable",
      "initiallyDeferred",
    ],
  },
  indexes: {
    sql: ["schema", "table", "name", "unique", "definition"],
    contract: ["schema", "table", "name", "unique", "definition"],
  },
  functions: {
    sql: ["schema", "name", "identity_args", "args", "returns", "security", "language", "volatility", "config"],
    contract: ["schema", "name", "identityArgs", "args", "returns", "security", "language", "volatility", "searchPath"],
  },
  triggers: {
    sql: ["schema", "table", "name", "timing", "events", "function"],
    contract: ["schema", "table", "name", "timing", "events", "function"],
  },
  policies: {
    sql: ["schema", "table", "name", "permissive", "command", "roles", "using", "with_check"],
    contract: ["schema", "table", "name", "permissive", "command", "roles", "using", "withCheck"],
  },
  tableGrants: {
    sql: ["schema", "table", "grantee", "privilege", "grantable"],
    contract: ["schema", "table", "roles", "privileges", "grantable"],
  },
  columnGrants: {
    sql: ["schema", "table", "column", "grantee", "privilege", "grantable"],
    contract: ["schema", "table", "columns", "roles", "privileges", "grantable"],
  },
  functionGrants: {
    sql: ["schema", "name", "args", "grantee", "privilege", "grantable"],
    contract: ["schema", "name", "args", "roles", "privileges", "grantable"],
  },
  storageBuckets: {
    sql: ["id", "name", "public", "file_size_limit", "allowed_mime_types"],
    contract: ["id", "name", "public", "fileSizeLimit", "allowedMimeTypes"],
  },
  vendorHistory: {
    sql: ["version"],
    contract: ["versions"],
  },
});

export const OBSERVATION_STATES = Object.freeze({
  PRESENT: "present",
  ABSENT: "absent",
  MISSING: "missing",
  UNKNOWN: "unknown",
});

export function hasOwn(obj, key) {
  return Boolean(obj) && Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Distinguish present values, legally absent SQL NULL, omitted keys, and
 * unknown/empty required scalars. `allowAbsent` is for USING / WITH CHECK.
 */
export function observationState(obj, key, options = {}) {
  const allowAbsent = Boolean(options.allowAbsent);
  const allowEmpty = Boolean(options.allowEmpty);
  if (!hasOwn(obj, key)) {
    return { state: OBSERVATION_STATES.MISSING, value: undefined, key };
  }
  const value = obj[key];
  if (value === undefined) {
    return { state: OBSERVATION_STATES.MISSING, value: undefined, key };
  }
  if (value === null) {
    return {
      state: allowAbsent ? OBSERVATION_STATES.ABSENT : OBSERVATION_STATES.MISSING,
      value: null,
      key,
    };
  }
  if (typeof value === "string" && value.trim() === "" && !allowEmpty) {
    return { state: OBSERVATION_STATES.UNKNOWN, value, key };
  }
  return { state: OBSERVATION_STATES.PRESENT, value, key };
}

function fail(code, detail) {
  const err = new Error(`${code}: ${detail}`);
  err.code = code;
  throw err;
}

function qualify(raw, defaultSchema = "public") {
  const cleaned = String(raw).replaceAll('"', "").replace(/\s+/g, "");
  if (cleaned.includes(".")) {
    const [schema, name] = cleaned.split(".");
    return { schema: schema.toLowerCase(), name: name.toLowerCase() };
  }
  return { schema: defaultSchema, name: cleaned.toLowerCase() };
}

function identName(raw) {
  return String(raw).replaceAll('"', "").trim();
}

function normalizeWs(text) {
  return String(text ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeType(type) {
  const t = normalizeWs(type).toLowerCase();
  return t
    .replace(/\btimestamp with time zone\b/g, "timestamptz")
    .replace(/\btimestamp without time zone\b/g, "timestamp")
    .replace(/\bcharacter varying\b/g, "varchar")
    .replace(/\bdouble precision\b/g, "float8");
}

function normalizeExpr(expr) {
  return normalizeWs(expr).replace(/\s*,\s*/g, ", ").toLowerCase();
}

function splitTopLevel(text, sep = ",") {
  const out = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "(") depth += 1;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    else if (ch === sep && depth === 0) {
      out.push(text.slice(start, i));
      start = i + 1;
    }
  }
  out.push(text.slice(start));
  return out.map((s) => s.trim()).filter(Boolean);
}

function matchingParen(text, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function sameOrderedList(a = [], b = []) {
  if (a.length !== b.length) return false;
  return a.every((v, i) => String(v) === String(b[i]));
}

export function parseIndexColumns(idx) {
  if (Array.isArray(idx?.columns) && idx.columns.length) {
    return idx.columns.map((c) => String(c).toLowerCase());
  }
  const spec = String(idx?.spec ?? idx?.definition ?? "");
  const open = spec.indexOf("(");
  if (open === -1) return [];
  const close = matchingParen(spec, open);
  if (close === -1) return [];
  return parseColumnList(spec.slice(open, close + 1));
}

export function indexTableKey(idx) {
  const table = String(idx?.table ?? "").replaceAll('"', "").toLowerCase();
  if (!table) return "";
  return table.includes(".") ? table : `public.${table}`;
}

export function isConstraintImpliedIndex(index, tables) {
  if (index?.unique === false) return false;
  const tableKey = indexTableKey(index);
  const cols = parseIndexColumns(index);
  if (!tableKey || !cols.length) return false;
  const table = (tables ?? []).find((t) => tableRecordKey(t, tableKey) === tableKey);
  if (!table) return false;
  for (const cons of table.constraints ?? []) {
    const normalized = normalizeConstraint(cons, tableKey);
    if (normalized.unverified) continue;
    if (normalized.kind !== "PRIMARY KEY" && normalized.kind !== "UNIQUE") continue;
    if (sameOrderedList(normalized.columns, cols)) return true;
  }
  return false;
}

function parseColumnList(parenText) {
  const text = String(parenText ?? "").trim();
  if (!text) return [];
  const inner = text.startsWith("(") ? text.slice(1, matchingParen(text, 0)) : text;
  return splitTopLevel(inner, ",")
    .map((c) => identName(c).toLowerCase())
    .filter(Boolean);
}

function parseReferentialActions(rest) {
  const text = String(rest ?? "");
  const del = text.match(/\bON\s+DELETE\s+(NO\s+ACTION|RESTRICT|CASCADE|SET\s+NULL|SET\s+DEFAULT)/i);
  const upd = text.match(/\bON\s+UPDATE\s+(NO\s+ACTION|RESTRICT|CASCADE|SET\s+NULL|SET\s+DEFAULT)/i);
  const notDeferrable = /\bNOT\s+DEFERRABLE\b/i.test(text);
  const deferrable = !notDeferrable && /\bDEFERRABLE\b/i.test(text);
  const initiallyDeferred = /\bINITIALLY\s+DEFERRED\b/i.test(text);
  return {
    onDelete: del ? del[1].replace(/\s+/g, " ").toUpperCase() : "NO ACTION",
    onUpdate: upd ? upd[1].replace(/\s+/g, " ").toUpperCase() : "NO ACTION",
    deferrable: deferrable || initiallyDeferred,
    initiallyDeferred,
  };
}

function tableKeyOf(raw, fallback = "public.unknown") {
  if (raw?.table) {
    const t = String(raw.table).replaceAll('"', "").toLowerCase();
    return t.includes(".") ? t : `public.${t}`;
  }
  if (raw?.schema && raw?.name) {
    return `${String(raw.schema).toLowerCase()}.${String(raw.name).toLowerCase()}`;
  }
  return String(fallback).toLowerCase();
}

export function tableRecordKey(table, fallback = "public.unknown") {
  if (table?.key) return String(table.key).toLowerCase();
  return tableKeyOf(table, fallback);
}

export function findTableRecord(tables, schema, name) {
  const key = `${String(schema ?? "public").toLowerCase()}.${String(name ?? "").toLowerCase()}`;
  const list = Array.isArray(tables) ? tables : [];
  return (
    list.find((t) => tableRecordKey(t, key) === key) ??
    list.find((t) => String(t?.name ?? "").toLowerCase() === String(name ?? "").toLowerCase() &&
      String(t?.schema ?? "public").toLowerCase() === String(schema ?? "public").toLowerCase()) ??
    null
  );
}

export function primaryKeyColumnsOf(tables, schema, name) {
  const table = findTableRecord(tables, schema, name);
  if (!table) {
    return { columns: null, unverified: true, reason: "referenced table not present in contract" };
  }
  if (!Array.isArray(table.constraints)) {
    return { columns: null, unverified: true, reason: "referenced table constraints missing from observation" };
  }
  const pks = [];
  for (const raw of table.constraints) {
    const normalized = normalizeConstraint(raw, tableRecordKey(table));
    if (normalized.kind !== "PRIMARY KEY") continue;
    if (normalized.unverified) {
      return { columns: null, unverified: true, reason: normalized.reason ?? "referenced primary key unparseable" };
    }
    pks.push(normalized);
  }
  if (pks.length === 0) {
    return { columns: null, unverified: true, reason: "referenced primary key not in contract" };
  }
  if (pks.length > 1) {
    return { columns: null, unverified: true, reason: "referenced primary key ambiguous" };
  }
  return { columns: pks[0].columns, unverified: false, reason: null };
}

export function resolveForeignKeyReferencedColumns(constraint, tables) {
  const cons = normalizeConstraint(constraint, constraint?.table);
  if (cons.unverified || cons.kind !== "FOREIGN KEY") {
    return {
      columns: null,
      unverified: true,
      mode: cons.referencedColumnsMode ?? null,
      reason: cons.reason ?? "not a foreign key",
    };
  }
  if (cons.referencedColumnsMode === "explicit") {
    if (!cons.referencedColumns?.length) {
      return { columns: null, unverified: true, mode: "explicit", reason: "explicit referenced columns empty" };
    }
    return { columns: cons.referencedColumns, unverified: false, mode: "explicit", reason: null };
  }
  if (cons.referencedColumnsMode === "implicit-pk") {
    const pk = primaryKeyColumnsOf(tables, cons.referencedSchema, cons.referencedTable);
    if (pk.unverified) {
      return { columns: null, unverified: true, mode: "implicit-pk", reason: pk.reason };
    }
    return { columns: pk.columns, unverified: false, mode: "implicit-pk-resolved", reason: null };
  }
  return {
    columns: null,
    unverified: true,
    mode: cons.referencedColumnsMode,
    reason: `unknown referencedColumnsMode ${cons.referencedColumnsMode}`,
  };
}

/**
 * Structured constraint identity. Kind-only matching is refused.
 * CHECK expressions are compared after whitespace/case normalization,
 * not as proven semantic equivalents.
 */
export function normalizeConstraint(raw, fallbackTable) {
  const table = tableKeyOf(raw, fallbackTable);
  const schema = table.includes(".") ? table.split(".")[0] : "public";
  const name = raw?.name ? identName(raw.name).toLowerCase() : null;
  const kind = String(raw?.kind ?? raw?.type ?? "").replace(/\s+/g, " ").toUpperCase();
  const spec = raw?.spec ?? raw?.definition ?? raw?.checkExpression ?? "";

  if (!["PRIMARY KEY", "UNIQUE", "FOREIGN KEY", "CHECK"].includes(kind)) {
    return {
      kind: kind || "UNKNOWN",
      table,
      schema,
      name,
      unverified: true,
      reason: kind ? `unsupported constraint kind ${kind}` : "constraint kind missing",
    };
  }

  if (kind === "CHECK") {
    let expr = raw?.checkExpression ?? raw?.expression ?? null;
    if (!expr && spec) {
      const text = String(spec);
      const checkAt = text.search(/\bCHECK\b/i);
      const open = text.indexOf("(", checkAt === -1 ? 0 : checkAt);
      const close = open === -1 ? -1 : matchingParen(text, open);
      if (close !== -1) expr = text.slice(open + 1, close);
    }
    if (!expr || !String(expr).trim()) {
      return { kind, table, schema, name, unverified: true, reason: "CHECK expression unparseable" };
    }
    const checkExpression = normalizeExpr(expr);
    return {
      kind,
      table,
      schema,
      name,
      columns: [],
      checkExpression,
      identity: `CHECK:${table}:${checkExpression}`,
      unverified: false,
    };
  }

  if (kind === "PRIMARY KEY" || kind === "UNIQUE") {
    let columns = Array.isArray(raw?.columns) ? raw.columns.map((c) => String(c).toLowerCase()) : null;
    if (!columns?.length && spec) {
      const open = String(spec).indexOf("(");
      const close = open === -1 ? -1 : matchingParen(String(spec), open);
      if (close !== -1) columns = parseColumnList(String(spec).slice(open, close + 1));
    }
    if (!columns?.length) {
      return { kind, table, schema, name, unverified: true, reason: "constraint columns unparseable" };
    }
    return {
      kind,
      table,
      schema,
      name,
      columns,
      identity: `${kind}:${table}:(${columns.join(",")})`,
      unverified: false,
    };
  }

  let columns = Array.isArray(raw?.columns) ? raw.columns.map((c) => String(c).toLowerCase()) : null;
  let referencedSchema = raw?.referencedSchema ? String(raw.referencedSchema).toLowerCase() : null;
  let referencedTable = raw?.referencedTable ? String(raw.referencedTable).toLowerCase() : null;
  if (referencedTable && referencedTable.includes(".")) {
    const q = qualify(referencedTable);
    referencedSchema = q.schema;
    referencedTable = q.name;
  }
  let referencedColumns = Array.isArray(raw?.referencedColumns)
    ? raw.referencedColumns.map((c) => String(c).toLowerCase())
    : null;
  let referencedColumnsMode = raw?.referencedColumnsMode ?? null;
  let actions = {
    onDelete: raw?.onDelete ? String(raw.onDelete).replace(/\s+/g, " ").toUpperCase() : null,
    onUpdate: raw?.onUpdate ? String(raw.onUpdate).replace(/\s+/g, " ").toUpperCase() : null,
    deferrable: typeof raw?.deferrable === "boolean" ? raw.deferrable : null,
    initiallyDeferred: typeof raw?.initiallyDeferred === "boolean" ? raw.initiallyDeferred : null,
  };

  if ((!columns?.length || !referencedTable) && spec) {
    const text = String(spec);
    const open = text.indexOf("(");
    const close = open === -1 ? -1 : matchingParen(text, open);
    if (!columns?.length && close !== -1) {
      columns = parseColumnList(text.slice(open, close + 1));
    }
    const ref = text.match(
      /\bREFERENCES\s+((?:"[^"]+"|[a-zA-Z_][\w$]*)(?:\s*\.\s*(?:"[^"]+"|[a-zA-Z_][\w$]*))?)\s*(\([^)]*\))?/i,
    );
    if (ref) {
      const q = qualify(ref[1]);
      referencedSchema = q.schema;
      referencedTable = q.name;
      if (ref[2]) {
        referencedColumns = parseColumnList(ref[2]);
        referencedColumnsMode = "explicit";
      } else if (!referencedColumnsMode) {
        referencedColumnsMode = "implicit-pk";
      }
    }
    const parsedActions = parseReferentialActions(text);
    actions = {
      onDelete: actions.onDelete ?? parsedActions.onDelete,
      onUpdate: actions.onUpdate ?? parsedActions.onUpdate,
      deferrable: actions.deferrable ?? parsedActions.deferrable,
      initiallyDeferred: actions.initiallyDeferred ?? parsedActions.initiallyDeferred,
    };
  }

  if (!referencedColumnsMode) {
    referencedColumnsMode = referencedColumns?.length ? "explicit" : "implicit-pk";
  }
  if (!columns?.length || !referencedTable) {
    return { kind, table, schema, name, unverified: true, reason: "foreign key unparseable" };
  }

  return {
    kind,
    table,
    schema,
    name,
    columns,
    referencedSchema: referencedSchema ?? "public",
    referencedTable,
    referencedColumns: referencedColumnsMode === "explicit" ? referencedColumns ?? [] : null,
    referencedColumnsMode,
    onDelete: actions.onDelete ?? "NO ACTION",
    onUpdate: actions.onUpdate ?? "NO ACTION",
    deferrable: Boolean(actions.deferrable),
    initiallyDeferred: Boolean(actions.initiallyDeferred),
    identity: `FOREIGN KEY:${table}:(${columns.join(",")})->${referencedSchema ?? "public"}.${referencedTable}(${
      referencedColumnsMode === "explicit" ? (referencedColumns ?? []).join(",") : "<implicit-pk>"
    })`,
    unverified: false,
  };
}

export function constraintsEquivalent(expectedRaw, observedRaw, tableKey, context = {}) {
  const expected = normalizeConstraint(expectedRaw, tableKey);
  const observed = normalizeConstraint(observedRaw, observedRaw?.table ?? tableKey);
  if (expected.unverified || observed.unverified) {
    return { match: false, unverified: true, expected, observed };
  }
  if (expected.kind !== observed.kind || expected.table !== observed.table) {
    return { match: false, unverified: false, expected, observed };
  }
  if (expected.name && observed.name && expected.name !== observed.name) {
    return { match: false, unverified: false, field: "name", expected, observed };
  }
  if (expected.kind === "CHECK") {
    return {
      match: expected.checkExpression === observed.checkExpression,
      unverified: false,
      expected,
      observed,
    };
  }
  if (expected.kind === "PRIMARY KEY" || expected.kind === "UNIQUE") {
    return {
      match: sameOrderedList(expected.columns, observed.columns),
      unverified: false,
      expected,
      observed,
    };
  }
  if (!sameOrderedList(expected.columns, observed.columns)) {
    return { match: false, unverified: false, field: "columns", expected, observed };
  }
  if (
    expected.referencedSchema !== observed.referencedSchema ||
    expected.referencedTable !== observed.referencedTable
  ) {
    return { match: false, unverified: false, field: "referencedTable", expected, observed };
  }
  const expectedResolved = resolveForeignKeyReferencedColumns(expected, context.expectedTables);
  const observedResolved = resolveForeignKeyReferencedColumns(observed, context.observedTables);
  if (expectedResolved.unverified || observedResolved.unverified) {
    return {
      match: false,
      unverified: true,
      field: "referencedColumns",
      reason: expectedResolved.reason ?? observedResolved.reason,
      expected,
      observed,
    };
  }
  if (!sameOrderedList(expectedResolved.columns ?? [], observedResolved.columns ?? [])) {
    return { match: false, unverified: false, field: "referencedColumns", expected, observed };
  }
  if (expected.onDelete !== observed.onDelete || expected.onUpdate !== observed.onUpdate) {
    return { match: false, unverified: false, field: "referentialAction", expected, observed };
  }
  if (expected.deferrable !== observed.deferrable || expected.initiallyDeferred !== observed.initiallyDeferred) {
    return { match: false, unverified: false, field: "deferrability", expected, observed };
  }
  return { match: true, unverified: false, expected, observed, expectedResolved, observedResolved };
}

const TYPE_ONLY_ARG = /^(integer|int|int4|int2|int8|smallint|bigint|text|uuid|boolean|bool|numeric|decimal|real|double|float8|float4|varchar|character|char|timestamp|timestamptz|date|time|json|jsonb|bytea|name|regclass|anyelement|anyarray|record|void|trigger)\b/i;

export function parseFunctionArgs(argsText) {
  const raw = String(argsText ?? "").trim();
  const text = raw.startsWith("(") ? raw : `(${raw})`;
  const close = matchingParen(text, 0);
  const inner = close === -1 ? text.replace(/^\(|\)$/g, "") : text.slice(1, close);
  if (!inner.trim()) {
    return { args: "()", argTypes: [], inputTypes: [], modes: [], unverified: false };
  }
  const parts = splitTopLevel(inner, ",");
  const args = [];
  for (const part of parts) {
    let p = part.trim();
    if (!p) continue;
    let mode = "IN";
    const modeMatch = p.match(/^(IN\s+OUT|INOUT|OUT|IN|VARIADIC)\b/i);
    if (modeMatch) {
      mode = modeMatch[1].replace(/\s+/g, " ").toUpperCase().replace("IN OUT", "INOUT");
      p = p.slice(modeMatch[0].length).trim();
    }
    const named = p.match(/^((?:"[^"]+"|[a-zA-Z_][\w$]*))\s+([\s\S]+)$/);
    let type;
    if (named && !TYPE_ONLY_ARG.test(named[1])) {
      type = named[2];
    } else {
      type = p;
    }
    args.push({ mode, type: normalizeType(type) });
  }
  const inputTypes = args
    .filter((a) => a.mode === "IN" || a.mode === "INOUT" || a.mode === "VARIADIC")
    .map((a) => a.type);
  return {
    args: `(${args.map((a) => a.type).join(",")})`,
    argTypes: args.map((a) => a.type),
    inputTypes,
    modes: args.map((a) => a.mode),
    unverified: false,
  };
}

export function functionIdentityKey(fn) {
  const schema = (fn.schema ?? "public").toLowerCase();
  const name = String(fn.name).toLowerCase();
  const parsed = Array.isArray(fn.inputTypes) ? fn : parseFunctionArgs(fn.args ?? fn.identityArgs ?? "()");
  return `${schema}.${name}(${(parsed.inputTypes ?? []).join(",")})`;
}

function parseSearchPath(header) {
  const match = String(header ?? "").match(/\bSET\s+search_path\s*(?:TO|=)\s*([^;]+)/i);
  if (!match) return null;
  return normalizeWs(match[1]).toLowerCase();
}

function parseVolatility(header) {
  if (/\bIMMUTABLE\b/i.test(header)) return "IMMUTABLE";
  if (/\bSTABLE\b/i.test(header)) return "STABLE";
  return "VOLATILE";
}

function parseReturns(header) {
  const match = String(header ?? "").match(/\bRETURNS\s+/i);
  if (!match) return null;
  const rest = header.slice(match.index + match[0].length).trim();
  if (/^TABLE\s*\(/i.test(rest)) {
    const open = rest.indexOf("(");
    const close = matchingParen(rest, open);
    if (close === -1) return { returns: null, unverified: true };
    return { returns: normalizeType(`table${rest.slice(open, close + 1)}`), unverified: false };
  }
  const type = rest.split(/\s+(LANGUAGE|SECURITY|VOLATILE|STABLE|IMMUTABLE|STRICT|CALLED|SET|AS)\b/i)[0];
  return { returns: normalizeType(type), unverified: false };
}

export function normalizeFunction(raw) {
  const schema = (raw?.schema ?? "public").toLowerCase();
  const name = String(raw?.name ?? "").toLowerCase();
  const parsed = Array.isArray(raw?.inputTypes)
    ? {
        args: raw.args ?? `(${raw.inputTypes.join(",")})`,
        argTypes: raw.argTypes ?? raw.inputTypes,
        inputTypes: raw.inputTypes,
        unverified: false,
      }
    : parseFunctionArgs(raw?.args ?? raw?.identityArgs ?? raw?.identity_args ?? "()");
  const returns = raw?.returns
    ? normalizeType(raw.returns)
    : parseReturns(raw?.header ?? "")?.returns ?? null;
  const security = raw?.security
    ? String(raw.security).toUpperCase()
    : /\bSECURITY\s+DEFINER\b/i.test(raw?.header ?? "")
      ? "DEFINER"
      : "INVOKER";
  const volatility = raw?.volatility
    ? String(raw.volatility).toUpperCase()
    : parseVolatility(raw?.header ?? "");
  const language = raw?.language ? String(raw.language).toLowerCase() : null;
  const searchPath = raw?.searchPath ?? raw?.search_path ?? parseSearchPath(raw?.header ?? raw?.config ?? "");
  const key = `${schema}.${name}(${(parsed.inputTypes ?? []).join(",")})`;
  return {
    schema,
    name,
    args: parsed.args,
    argTypes: parsed.argTypes,
    inputTypes: parsed.inputTypes,
    key,
    returns,
    security,
    volatility,
    language,
    searchPath: searchPath ? normalizeWs(String(searchPath)).toLowerCase() : null,
    unverified: Boolean(parsed.unverified),
    sourceFile: raw?.sourceFile,
  };
}

function functionGrantKey(g) {
  const fn = String(g.function ?? g.name ?? "").toLowerCase();
  const args = g.args ? String(g.args).toLowerCase() : "";
  const grantable = g.grantable === true || g.is_grantable === true ? "grantable" : "";
  return `${fn}${args}::${(g.roles ?? []).map((r) => String(r).toLowerCase()).sort().join(",")}::${(g.privileges ?? []).join(",")}::${grantable}`;
}

function stripPlainComments(sql) {
  return String(sql)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ");
}

function splitDollarQuotes(sql) {
  const parts = [];
  let i = 0;
  const src = String(sql);
  while (i < src.length) {
    const dollar = src.indexOf("$", i);
    if (dollar === -1) {
      parts.push({ type: "plain", text: src.slice(i) });
      break;
    }
    if (dollar > i) parts.push({ type: "plain", text: src.slice(i, dollar) });
    const tagMatch = src.slice(dollar).match(/^\$[A-Za-z_]*\$/);
    if (!tagMatch) {
      parts.push({ type: "plain", text: src[dollar] });
      i = dollar + 1;
      continue;
    }
    const tag = tagMatch[0];
    const end = src.indexOf(tag, dollar + tag.length);
    if (end === -1) {
      parts.push({ type: "plain", text: src.slice(dollar) });
      break;
    }
    parts.push({
      type: "quoted",
      tag,
      text: src.slice(dollar + tag.length, end),
    });
    i = end + tag.length;
  }
  return parts;
}

function parseArrayLiterals(body) {
  const arrays = [];
  const re = /ARRAY\s*\[([\s\S]*?)\]/gi;
  let match;
  while ((match = re.exec(body))) {
    const names = [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    if (names.length) arrays.push(names);
  }
  return arrays;
}

function parseCreateTableColumns(parenBody, tableKey, filename) {
  const columns = [];
  const constraints = [];
  for (const piece of splitTopLevel(parenBody, ",")) {
    const raw = piece.trim();
    if (!raw) continue;
    const constraint = raw.match(
      /^(?:CONSTRAINT\s+((?:"[^"]+"|[a-zA-Z_][\w$]*))\s+)?(PRIMARY\s+KEY|UNIQUE|FOREIGN\s+KEY|CHECK)\b([\s\S]*)$/i,
    );
    if (constraint) {
      const kind = constraint[2].replace(/\s+/g, " ").toUpperCase();
      constraints.push(
        normalizeConstraint(
          {
            name: constraint[1] ? identName(constraint[1]) : null,
            kind,
            spec: normalizeWs(constraint[3]),
            table: tableKey,
            sourceFile: filename,
          },
          tableKey,
        ),
      );
      continue;
    }
    const col = raw.match(/^((?:"[^"]+"|[a-zA-Z_][\w$]*))\s+([a-zA-Z_][\w$]*(?:\s*\.\s*[a-zA-Z_][\w$]*)?)(\s*\([^)]*\))?([\s\S]*)$/);
    if (!col) continue;
    const name = identName(col[1]).toLowerCase();
    const type = normalizeType(`${col[2]}${col[3] ?? ""}`);
    const rest = col[4] ?? "";
    const nullable = !/\bNOT\s+NULL\b/i.test(rest) && !/\bPRIMARY\s+KEY\b/i.test(rest);
    if (/\bPRIMARY\s+KEY\b/i.test(rest)) {
      constraints.push(
        normalizeConstraint(
          { name: null, kind: "PRIMARY KEY", spec: `(${name})`, table: tableKey, sourceFile: filename },
          tableKey,
        ),
      );
    }
    if (/\bUNIQUE\b/i.test(rest) && !/\bUNIQUE\s+INDEX\b/i.test(rest)) {
      constraints.push(
        normalizeConstraint(
          { name: null, kind: "UNIQUE", spec: `(${name})`, table: tableKey, sourceFile: filename },
          tableKey,
        ),
      );
    }
    const fk = rest.match(
      /\bREFERENCES\s+((?:"[^"]+"|[a-zA-Z_][\w$]*)(?:\s*\.\s*(?:"[^"]+"|[a-zA-Z_][\w$]*))?)\s*(\([^)]*\))?([\s\S]*)/i,
    );
    if (fk) {
      constraints.push(
        normalizeConstraint(
          {
            name: null,
            kind: "FOREIGN KEY",
            spec: `(${name}) REFERENCES ${qualify(fk[1]).schema}.${qualify(fk[1]).name}${fk[2] ?? ""}${fk[3] ?? ""}`,
            table: tableKey,
            sourceFile: filename,
          },
          tableKey,
        ),
      );
    }
    const check = rest.match(/\bCHECK\s*\(/i);
    if (check) {
      constraints.push(
        normalizeConstraint(
          { name: null, kind: "CHECK", spec: normalizeWs(rest.slice(check.index)), table: tableKey, sourceFile: filename },
          tableKey,
        ),
      );
    }
    columns.push({
      name,
      type,
      nullable,
      sensitive: SENSITIVE_COLUMN_HINTS.some((h) => name.includes(h)),
      table: tableKey,
      sourceFile: filename,
    });
  }
  return { columns, constraints };
}

function parsePolicyTail(tail) {
  let rest = tail.trim();
  let permissive = true;
  const asMatch = rest.match(/^AS\s+(PERMISSIVE|RESTRICTIVE)\b/i);
  if (asMatch) {
    permissive = asMatch[1].toUpperCase() !== "RESTRICTIVE";
    rest = rest.slice(asMatch[0].length).trim();
  }
  let command = "ALL";
  const forMatch = rest.match(/^FOR\s+(ALL|SELECT|INSERT|UPDATE|DELETE)\b/i);
  if (forMatch) {
    command = forMatch[1].toUpperCase();
    rest = rest.slice(forMatch[0].length).trim();
  }
  let roles = ["public"];
  const toMatch = rest.match(/^TO\s+([^]*?)(?=\s+USING\b|\s+WITH\s+CHECK\b|$)/i);
  if (toMatch) {
    roles = splitTopLevel(toMatch[1], ",")
      .map((r) => identName(r).toLowerCase())
      .filter(Boolean);
    rest = rest.slice(toMatch[0].length).trim();
  }
  let using = null;
  const usingMatch = rest.match(/^USING\s*\(/i);
  if (usingMatch) {
    const open = rest.indexOf("(");
    const close = matchingParen(rest, open);
    if (close !== -1) {
      using = normalizeExpr(rest.slice(open + 1, close));
      rest = rest.slice(close + 1).trim();
    }
  }
  let withCheck = null;
  const checkMatch = rest.match(/^WITH\s+CHECK\s*\(/i);
  if (checkMatch) {
    const open = rest.indexOf("(");
    const close = matchingParen(rest, open);
    if (close !== -1) {
      withCheck = normalizeExpr(rest.slice(open + 1, close));
    }
  }
  return { command, roles, using, withCheck, permissive };
}

function ensureTable(tables, ident, filename) {
  if (!tables.has(ident.key)) {
    tables.set(ident.key, {
      ...ident,
      key: ident.key,
      sourceFile: filename,
      columns: [],
      constraints: [],
      rlsEnabled: false,
      rlsForced: false,
      grants: [],
      columnGrants: [],
    });
  }
  return tables.get(ident.key);
}

export function grantKey(g) {
  const grantable = g.grantable === true || g.is_grantable === true ? "grantable" : "";
  const roles = (g.roles ?? []).map((r) => String(r).toLowerCase()).sort();
  const privileges = (g.privileges ?? []).map((p) => String(p).toUpperCase()).sort();
  const columns = (g.columns ?? []).map((c) => String(c).toLowerCase()).sort();
  return `${g.table}::${roles.join(",")}::${privileges.join(",")}::${columns.join(",")}::${grantable}`;
}

function grantObservationComplete(g) {
  return Array.isArray(g?.roles) && g.roles.length > 0 && Array.isArray(g?.privileges) && g.privileges.length > 0;
}

function parseGrantList(list) {
  if (/^ALL\b/i.test(list.trim())) return ["ALL"];
  return splitTopLevel(list, ",")
    .map((p) => normalizeWs(p).toUpperCase())
    .filter(Boolean);
}

function parseGrantTargets(raw) {
  const text = String(raw ?? "");
  const grantable = /\bWITH\s+GRANT\s+OPTION\b/i.test(text);
  const cleaned = text
    .replace(/\bWITH\s+GRANT\s+OPTION\b/gi, "")
    .replace(/\bGRANTED\s+BY\b[\s\S]*/i, "");
  const roles = splitTopLevel(cleaned, ",")
    .map((r) => identName(r).toLowerCase())
    .filter(Boolean);
  return { roles, grantable };
}

function applyGrant(tableObj, privileges, roles, columns, revoke, grantable = false) {
  const rec = {
    privileges: privileges.slice().sort(),
    roles: roles.slice().sort(),
    columns: (columns ?? []).map((c) => c.toLowerCase()).sort(),
    table: tableObj.key,
    grantable: Boolean(grantable),
  };
  const key = grantKey(rec);
  if (columns?.length) {
    tableObj.columnGrants = tableObj.columnGrants.filter((g) => grantKey(g) !== key);
    if (!revoke) tableObj.columnGrants.push(rec);
  } else {
    tableObj.grants = tableObj.grants.filter((g) => grantKey(g) !== key);
    if (!revoke) tableObj.grants.push(rec);
  }
}

function expandDoForeach(body, filename, into) {
  const arrays = parseArrayLiterals(body);
  const policyTemplates = [
    ...body.matchAll(
      /CREATE\s+POLICY\s+((?:"[^"]+"|[a-zA-Z_][\w$]*))\s+ON\s+((?:public\.)?%(?:1\$)?[sI])([\s\S]*?)(?:\$[A-Za-z_]*\$|'|$)/gi,
    ),
  ];
  const grantTemplates = [
    ...body.matchAll(
      /GRANT\s+([^O]+?)\s+ON\s+(?:TABLE\s+)?(?:public\.)?%(?:1\$)?I\s+TO\s+([a-zA-Z_]+)/gi,
    ),
  ];
  const rlsTemplates = /ALTER\s+TABLE\s+(?:public\.)?%(?:1\$)?I\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(
    body,
  );
  const names = arrays.flat();
  let expanded = 0;
  if (names.length && (policyTemplates.length || grantTemplates.length || rlsTemplates)) {
    for (const tableName of names) {
      const ident = qualify(tableName);
      ident.key = `${ident.schema}.${ident.name}`;
      const tableObj = ensureTable(into.tables, ident, filename);
      if (rlsTemplates) tableObj.rlsEnabled = true;
      for (const tmpl of policyTemplates) {
        const rawName = identName(tmpl[1]).replace(/%1\$s/gi, tableName).replace(/%s/gi, tableName);
        const parsed = parsePolicyTail(tmpl[3] ?? "");
        const key = `${ident.key}::${rawName}`;
        into.policies.set(key, {
          name: rawName,
          schema: ident.schema,
          table: ident.key,
          key,
          sourceFile: filename,
          ...parsed,
        });
        expanded += 1;
      }
      for (const tmpl of grantTemplates) {
        applyGrant(
          tableObj,
          parseGrantList(tmpl[1]),
          [tmpl[2].toLowerCase()],
          [],
          false,
        );
        expanded += 1;
      }
    }
  }

  const staticPolicy = /CREATE\s+POLICY\b/i.test(body);
  const staticCreate =
    /CREATE\s+(TABLE|FUNCTION|TRIGGER|INDEX)\b/i.test(body) && !policyTemplates.length;
  const executeCreate = /EXECUTE\b[\s\S]*\bCREATE\s+(TABLE|POLICY|FUNCTION|TRIGGER|INDEX)\b/i.test(
    body,
  );
  if (executeCreate && !expanded) {
    into.unverified.push({
      kind: "dynamic_ddl",
      sourceFile: filename,
      reason: "DO/EXECUTE CREATE could not be expanded statically",
      required: true,
      verification: "NOT_VERIFIED",
    });
  }
  if (staticPolicy) {
    extractPolicies(body, filename, into);
  }
  if (staticCreate && !executeCreate) {
    extractPlainDdl(body, filename, into);
  }
}

function extractPolicies(body, filename, into) {
  const re = new RegExp(
    `CREATE\\s+POLICY\\s+(${IDENT})\\s+ON\\s+(${QUAL})([\\s\\S]*?)(?:;|$)`,
    "gi",
  );
  let match;
  while ((match = re.exec(body))) {
    const table = qualify(match[2]);
    table.key = `${table.schema}.${table.name}`;
    const name = identName(match[1]);
    const parsed = parsePolicyTail(match[3] ?? "");
    const key = `${table.key}::${name}`;
    into.policies.set(key, {
      name,
      schema: table.schema,
      table: table.key,
      key,
      sourceFile: filename,
      ...parsed,
    });
  }
}

function extractPlainDdl(body, filename, into) {
  const src = stripPlainComments(body);

  const tableRe = new RegExp(
    `CREATE\\s+TABLE\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(?:ONLY\\s+)?(${QUAL})\\s*(\\()`,
    "gi",
  );
  let match;
  while ((match = tableRe.exec(src))) {
    const ident = qualify(match[1]);
    ident.key = `${ident.schema}.${ident.name}`;
    const open = match.index + match[0].length - 1;
    const close = matchingParen(src, open);
    const tableObj = ensureTable(into.tables, ident, filename);
    if (close !== -1) {
      const parsed = parseCreateTableColumns(src.slice(open + 1, close), ident.key, filename);
      for (const col of parsed.columns) {
        tableObj.columns = tableObj.columns.filter((c) => c.name !== col.name);
        tableObj.columns.push(col);
      }
      tableObj.constraints.push(...parsed.constraints);
    } else {
      into.unverified.push({
        kind: "table",
        key: ident.key,
        sourceFile: filename,
        reason: "CREATE TABLE body was not parseable",
        required: true,
        verification: "NOT_VERIFIED",
      });
    }
    if (!/IF\s+NOT\s+EXISTS/i.test(match[0])) into.nonIdempotentCreateTable += 1;
    else into.idempotentCreateTable += 1;
  }

  const dropTableRe = new RegExp(`DROP\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(${QUAL})`, "gi");
  while ((match = dropTableRe.exec(src))) {
    const ident = qualify(match[1]);
    into.tables.delete(`${ident.schema}.${ident.name}`);
  }

  const dropPolicyRe = new RegExp(
    `DROP\\s+POLICY\\s+(?:IF\\s+EXISTS\\s+)?(${IDENT})\\s+ON\\s+(${QUAL})`,
    "gi",
  );
  while ((match = dropPolicyRe.exec(src))) {
    const table = qualify(match[2]);
    const name = identName(match[1]);
    into.policies.delete(`${table.schema}.${table.name}::${name}`);
  }

  extractPolicies(src, filename, into);

  const addColRe = new RegExp(
    `ALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(${QUAL})\\s+ADD\\s+COLUMN\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?((?:"[^"]+"|[a-zA-Z_][\\w$]*))\\s+([^,;]+)`,
    "gi",
  );
  while ((match = addColRe.exec(src))) {
    const ident = qualify(match[1]);
    ident.key = `${ident.schema}.${ident.name}`;
    const tableObj = ensureTable(into.tables, ident, filename);
    const name = identName(match[2]).toLowerCase();
    const rest = match[3];
    const typeMatch = rest.match(/^([a-zA-Z_][\w$]*(?:\s*\.\s*[a-zA-Z_][\w$]*)?)(\s*\([^)]*\))?/);
    const type = normalizeType(typeMatch ? `${typeMatch[1]}${typeMatch[2] ?? ""}` : rest);
    const nullable = !/\bNOT\s+NULL\b/i.test(rest);
    tableObj.columns = tableObj.columns.filter((c) => c.name !== name);
    tableObj.columns.push({
      name,
      type,
      nullable,
      sensitive: SENSITIVE_COLUMN_HINTS.some((h) => name.includes(h)),
      table: ident.key,
      sourceFile: filename,
    });
  }

  const addConstraintRe = new RegExp(
    `ALTER\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?(${QUAL})\\s+ADD\\s+(?:CONSTRAINT\\s+(${IDENT})\\s+)?(PRIMARY\\s+KEY|UNIQUE|FOREIGN\\s+KEY|CHECK)\\b([^;]*)`,
    "gi",
  );
  while ((match = addConstraintRe.exec(src))) {
    const ident = qualify(match[1]);
    ident.key = `${ident.schema}.${ident.name}`;
    const tableObj = ensureTable(into.tables, ident, filename);
    tableObj.constraints.push(
      normalizeConstraint(
        {
          name: match[2] ? identName(match[2]) : null,
          kind: match[3].replace(/\s+/g, " ").toUpperCase(),
          spec: normalizeWs(match[4] ?? ""),
          table: ident.key,
          sourceFile: filename,
        },
        ident.key,
      ),
    );
  }

  const rlsRe = new RegExp(
    `ALTER\\s+TABLE\\s+(${QUAL})\\s+(ENABLE|DISABLE|FORCE|NO\\s+FORCE)\\s+ROW\\s+LEVEL\\s+SECURITY`,
    "gi",
  );
  while ((match = rlsRe.exec(src))) {
    const ident = qualify(match[1]);
    ident.key = `${ident.schema}.${ident.name}`;
    const tableObj = ensureTable(into.tables, ident, filename);
    const action = match[2].replace(/\s+/g, " ").toUpperCase();
    if (action === "ENABLE") tableObj.rlsEnabled = true;
    if (action === "DISABLE") tableObj.rlsEnabled = false;
    if (action === "FORCE") tableObj.rlsForced = true;
    if (action === "NO FORCE") tableObj.rlsForced = false;
  }

  const indexRe = new RegExp(
    `CREATE\\s+(UNIQUE\\s+)?INDEX\\s+(?:IF\\s+NOT\\s+EXISTS\\s+)?(${IDENT})\\s+ON\\s+(${QUAL})\\s*(\\([^;]+)`,
    "gi",
  );
  while ((match = indexRe.exec(src))) {
    const table = qualify(match[3]);
    const name = identName(match[2]).toLowerCase();
    into.indexes.set(name, {
      name,
      table: `${table.schema}.${table.name}`,
      unique: Boolean(match[1]),
      spec: normalizeWs(match[4]),
      sourceFile: filename,
    });
  }

  const dropIndexRe = new RegExp(`DROP\\s+INDEX\\s+(?:IF\\s+EXISTS\\s+)?(${QUAL})`, "gi");
  while ((match = dropIndexRe.exec(src))) {
    const name = qualify(match[1]).name;
    into.indexes.delete(name);
  }

  const fnStartRe = /CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+/gi;
  while ((match = fnStartRe.exec(src))) {
    const rest = src.slice(match.index + match[0].length);
    const nameMatch = rest.match(new RegExp(`^(${QUAL})`));
    if (!nameMatch) {
      into.unverified.push({
        kind: "function",
        sourceFile: filename,
        reason: "CREATE FUNCTION name was not parseable",
        required: true,
        verification: "NOT_VERIFIED",
      });
      continue;
    }
    let i = nameMatch[0].length;
    while (rest[i] && /\s/.test(rest[i])) i += 1;
    if (rest[i] !== "(") {
      into.unverified.push({
        kind: "function",
        sourceFile: filename,
        reason: "CREATE FUNCTION argument list was not parseable",
        required: true,
        verification: "NOT_VERIFIED",
      });
      continue;
    }
    const close = matchingParen(rest, i);
    if (close === -1) {
      into.unverified.push({
        kind: "function",
        sourceFile: filename,
        reason: "CREATE FUNCTION argument list was not closed",
        required: true,
        verification: "NOT_VERIFIED",
      });
      continue;
    }
    const argsText = rest.slice(i, close + 1);
    const headerAndBody = rest.slice(close + 1);
    const asMatch = headerAndBody.match(/\bAS\s+/i);
    if (!asMatch) {
      into.unverified.push({
        kind: "function",
        sourceFile: filename,
        reason: "CREATE FUNCTION header was not parseable",
        required: true,
        verification: "NOT_VERIFIED",
      });
      continue;
    }
    const header = headerAndBody.slice(0, asMatch.index);
    const ident = qualify(nameMatch[1]);
    const normalized = normalizeFunction({
      schema: ident.schema,
      name: ident.name,
      args: argsText,
      header,
      sourceFile: filename,
    });
    into.functions.set(normalized.key, normalized);
  }

  const triggerRe = new RegExp(
    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?TRIGGER\\s+(${IDENT})\\s+(BEFORE|AFTER|INSTEAD\\s+OF)\\s+([A-Z\\sOR]+?)\\s+ON\\s+(${QUAL})[\\s\\S]*?EXECUTE\\s+(?:FUNCTION|PROCEDURE)\\s+(${QUAL})`,
    "gi",
  );
  while ((match = triggerRe.exec(src))) {
    const table = qualify(match[4]);
    const name = identName(match[1]).toLowerCase();
    const fn = qualify(match[5]);
    const key = `${table.schema}.${table.name}::${name}`;
    into.triggers.set(key, {
      name,
      table: `${table.schema}.${table.name}`,
      timing: match[2].replace(/\s+/g, " ").toUpperCase(),
      events: normalizeWs(match[3]).toUpperCase(),
      function: `${fn.schema}.${fn.name}`,
      key,
      sourceFile: filename,
    });
  }

  const grantRe = new RegExp(
    `(GRANT|REVOKE)\\s+(.+?)(?:\\s*\\(([^)]*)\\))?\\s+ON\\s+(TABLE\\s+)?(${QUAL})\\s+(?:TO|FROM)\\s+([^;]+)`,
    "gi",
  );
  while ((match = grantRe.exec(src))) {
    if (/^FUNCTION\b/i.test(match[5])) continue;
    const ident = qualify(match[5]);
    ident.key = `${ident.schema}.${ident.name}`;
    const tableObj = ensureTable(into.tables, ident, filename);
    const privileges = parseGrantList(match[2]);
    const { roles, grantable } = parseGrantTargets(match[6]);
    const columns = match[3]
      ? splitTopLevel(match[3], ",").map((c) => identName(c).toLowerCase())
      : [];
    applyGrant(tableObj, privileges, roles, columns, match[1].toUpperCase() === "REVOKE", grantable);
  }

  const grantFnRe = new RegExp(
    `(GRANT|REVOKE)\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+(${QUAL})\\s*`,
    "gi",
  );
  while ((match = grantFnRe.exec(src))) {
    let cursor = match.index + match[0].length;
    let args = "";
    if (src[cursor] === "(") {
      const close = matchingParen(src, cursor);
      if (close === -1) {
        into.unverified.push({
          kind: "function_grant",
          sourceFile: filename,
          reason: "GRANT ON FUNCTION argument list was not closed",
          required: true,
          verification: "NOT_VERIFIED",
        });
        continue;
      }
      args = src.slice(cursor, close + 1);
      cursor = close + 1;
    }
    const tail = src.slice(cursor);
    const toFrom = tail.match(/^\s*(?:TO|FROM)\s+([^;]+)/i);
    if (!toFrom) continue;
    const ident = qualify(match[2]);
    const { roles, grantable } = parseGrantTargets(toFrom[1]);
    const parsed = args ? parseFunctionArgs(args) : { inputTypes: [], args: "" };
    const fnKey = args
      ? `${ident.schema}.${ident.name}(${parsed.inputTypes.join(",")})`
      : `${ident.schema}.${ident.name}`;
    const rec = {
      function: fnKey,
      name: ident.name,
      schema: ident.schema,
      args: parsed.args || "",
      inputTypes: parsed.inputTypes,
      privileges: ["EXECUTE"],
      roles: roles.sort(),
      grantable,
      revoke: match[1].toUpperCase() === "REVOKE",
      sourceFile: filename,
    };
    const stored = functionGrantKey(rec);
    if (rec.revoke) into.functionGrants.delete(stored);
    else into.functionGrants.set(stored, rec);
  }

  const bucketRe =
    /INSERT\s+INTO\s+storage\.buckets\s*\(([^)]*)\)\s*VALUES\s*\(([^;]*)\)/gi;
  while ((match = bucketRe.exec(src))) {
    const cols = splitTopLevel(match[1], ",").map((c) => identName(c).toLowerCase());
    const vals = splitTopLevel(match[2], ",");
    const rec = { sourceFile: filename };
    cols.forEach((c, i) => {
      rec[c] = String(vals[i] ?? "")
        .trim()
        .replace(/^'+|'+$/g, "");
    });
    if (rec.id || rec.name) {
      into.storageBuckets.set(String(rec.id || rec.name), rec);
    } else {
      into.unverified.push({
        kind: "storage_bucket",
        sourceFile: filename,
        reason: "storage.buckets insert was not parseable",
        required: true,
        verification: "NOT_VERIFIED",
      });
    }
  }
}

export function extractExpectedObjects(sqlByFilename = {}) {
  const into = {
    tables: new Map(),
    policies: new Map(),
    indexes: new Map(),
    functions: new Map(),
    triggers: new Map(),
    functionGrants: new Map(),
    storageBuckets: new Map(),
    unverified: [],
    idempotentCreateTable: 0,
    nonIdempotentCreateTable: 0,
  };

  const files = Object.entries(sqlByFilename).sort(([a], [b]) => a.localeCompare(b));
  for (const [filename, sql] of files) {
    const parts = splitDollarQuotes(sql);
    let pendingDo = false;
    let plain = "";
    for (const part of parts) {
      if (part.type === "plain") {
        const trimmed = part.text.trimEnd();
        pendingDo = /\bDO\s*$/i.test(stripPlainComments(trimmed));
        plain += part.text;
        continue;
      }
      if (pendingDo) {
        expandDoForeach(part.text, filename, into);
        pendingDo = false;
        continue;
      }
      // function / comment bodies: do not scan for DDL
    }
    extractPlainDdl(plain, filename, into);
  }

  const tables = [...into.tables.values()].sort((a, b) => a.key.localeCompare(b.key));
  const policies = [...into.policies.values()].sort((a, b) => a.key.localeCompare(b.key));
  const indexes = [...into.indexes.values()].sort((a, b) => a.name.localeCompare(b.name));
  const functions = [...into.functions.values()].sort((a, b) => a.key.localeCompare(b.key));
  const triggers = [...into.triggers.values()].sort((a, b) => a.key.localeCompare(b.key));
  const functionGrants = [...into.functionGrants.values()];
  const storageBuckets = [...into.storageBuckets.values()];

  for (const table of tables) {
    for (const cons of table.constraints ?? []) {
      if (cons.unverified) {
        into.unverified.push({
          kind: "constraint",
          table: table.key,
          reason: cons.reason ?? "constraint unparseable",
          required: true,
          verification: "NOT_VERIFIED",
        });
      }
    }
  }
  for (const fn of functions) {
    if (fn.unverified) {
      into.unverified.push({
        kind: "function",
        key: fn.key,
        reason: "function identity unparseable",
        required: true,
        verification: "NOT_VERIFIED",
      });
    }
  }

  const comparedObjectClasses = [
    "tables",
    "columns",
    "constraints",
    "constraintIdentity",
    "indexes",
    "functions",
    "functionIdentity",
    "functionReturns",
    "functionSecurity",
    "functionVolatility",
    "functionSearchPath",
    "functionGrants",
    "functionGrantBidirectional",
    "triggers",
    "triggerDefinitions",
    "rls",
    "forceRls",
    "policies",
    "policyPermissiveness",
    "policyExpressions",
    "policyObservationCompleteness",
    "grants",
    "columnGrants",
    "storageBuckets",
    "implicitPrimaryKeyForeignKeys",
    "unexpectedColumns",
    "unexpectedConstraints",
    "unexpectedIndexes",
    "unexpectedTriggers",
    "unexpectedStorage",
    "grantOptions",
  ];

  return {
    tables,
    policies,
    indexes,
    functions,
    triggers,
    functionGrants,
    storageBuckets,
    unverified: into.unverified,
    tableCount: tables.length,
    policyCount: policies.length,
    indexCount: indexes.length,
    functionCount: functions.length,
    triggerCount: triggers.length,
    unverifiedCount: into.unverified.length,
    idempotentCreateTable: into.idempotentCreateTable,
    nonIdempotentCreateTable: into.nonIdempotentCreateTable,
    limitations: CONTRACT_LIMITATIONS,
    comparedObjectClasses,
    securityProof: false,
    existenceOnly: false,
    schemaEquivalence: false,
    contractKind: "static-sql-expected-objects",
  };
}

function observedTableKey(t) {
  const schema = (t.schema ?? "public").toLowerCase();
  const name = String(t.name).toLowerCase();
  return `${schema}.${name}`;
}

function observedPolicyKey(p) {
  const table = String(p.table).replaceAll('"', "").toLowerCase();
  const qualified = table.includes(".") ? table : `public.${table}`;
  return `${qualified}::${p.name}`;
}

function indexBy(list, keyFn) {
  const map = new Map();
  for (const item of list ?? []) map.set(keyFn(item), item);
  return map;
}

function sameStringList(a = [], b = []) {
  const aa = [...a].map((x) => String(x).toLowerCase()).sort();
  const bb = [...b].map((x) => String(x).toLowerCase()).sort();
  return aa.length === bb.length && aa.every((v, i) => v === bb[i]);
}

function requireObserved(expectedList, observedList, className, incomplete) {
  if (expectedList.length === 0) return;
  if (observedList == null) incomplete.push(className);
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
      schemaEquivalence: false,
      existenceOnly: false,
    };
  }

  const incomplete = [];
  if (Array.isArray(catalog.shapeIncomplete)) incomplete.push(...catalog.shapeIncomplete);
  requireObserved(expected.tables ?? [], catalog.tables, "tables", incomplete);
  if ((expected.policies ?? []).length && catalog.policies == null) {
    incomplete.push("policies");
  }
  if ((expected.functions ?? []).length && catalog.functions == null) {
    incomplete.push("functions");
  }
  if ((expected.functionGrants ?? []).length && catalog.functionGrants == null) {
    incomplete.push("functionGrants");
  }
  if ((expected.triggers ?? []).length && catalog.triggers == null) {
    incomplete.push("triggers");
  }
  if ((expected.indexes ?? []).length && catalog.indexes == null) {
    incomplete.push("indexes");
  }
  if ((expected.storageBuckets ?? []).length && catalog.storageBuckets == null) {
    incomplete.push("storageBuckets");
  }

  const observedTables = indexBy(catalog.tables ?? [], observedTableKey);
  const observedPolicies = indexBy(catalog.policies ?? [], observedPolicyKey);
  const observedFunctions = indexBy(catalog.functions ?? [], (f) => functionIdentityKey(f));
  const observedTriggers = indexBy(catalog.triggers ?? [], (t) => {
    const table = String(t.table).includes(".")
      ? String(t.table).toLowerCase()
      : `public.${String(t.table).toLowerCase()}`;
    return `${table}::${String(t.name).toLowerCase()}`;
  });
  const observedIndexes = indexBy(catalog.indexes ?? [], (i) => String(i.name).toLowerCase());

  const missingTables = (expected.tables ?? []).filter((t) => !observedTables.has(t.key));
  const expectedTableKeys = new Set((expected.tables ?? []).map((t) => t.key));
  const unexpectedTables = (catalog.tables ?? []).filter((t) => {
    const schema = (t.schema ?? "public").toLowerCase();
    if (VENDOR_SCHEMAS.includes(schema)) return false;
    return !expectedTableKeys.has(observedTableKey(t));
  });

  const missingPolicies = (expected.policies ?? []).filter(
    (p) => !observedPolicies.has(p.key),
  );
  const expectedPolicyKeys = new Set((expected.policies ?? []).map((p) => p.key));
  const unexpectedPolicies = (catalog.policies ?? []).filter((p) => {
    const table = String(p.table).replaceAll('"', "").toLowerCase();
    const schema = table.includes(".") ? table.split(".")[0] : "public";
    if (VENDOR_SCHEMAS.includes(schema) && schema !== "public") return false;
    return !expectedPolicyKeys.has(observedPolicyKey(p));
  });

  const columnMismatches = [];
  const constraintMismatches = [];
  const grantMismatches = [];
  const columnGrantMismatches = [];
  const rlsMismatches = [];

  for (const table of expected.tables ?? []) {
    const observed = observedTables.get(table.key);
    if (!observed) continue;
    const expectedCols = table.columns ?? [];
    if (expectedCols.length && !observed.columns) {
      incomplete.push(`columns:${table.key}`);
    } else if (Array.isArray(observed.columns)) {
      const byName = indexBy(observed.columns, (c) => String(c.name).toLowerCase());
      for (const col of expectedCols) {
        const got = byName.get(col.name);
        if (!got) {
          columnMismatches.push({ table: table.key, column: col.name, reason: "missing" });
          continue;
        }
        const typeObs = observationState(got, "type");
        if (typeObs.state !== OBSERVATION_STATES.PRESENT) {
          incomplete.push(`columnType:${table.key}.${col.name}`);
        } else if (normalizeType(typeObs.value) !== col.type) {
          columnMismatches.push({
            table: table.key,
            column: col.name,
            reason: "type",
            expected: col.type,
            observed: normalizeType(typeObs.value),
          });
        }
        const nullObs = observationState(got, "nullable", { allowEmpty: true });
        if (nullObs.state !== OBSERVATION_STATES.PRESENT || typeof got.nullable !== "boolean") {
          incomplete.push(`columnNullable:${table.key}.${col.name}`);
        } else if (got.nullable !== col.nullable) {
          columnMismatches.push({
            table: table.key,
            column: col.name,
            reason: "nullability",
            expected: col.nullable,
            observed: got.nullable,
          });
        }
      }
      const expectedNames = new Set(expectedCols.map((c) => String(c.name).toLowerCase()));
      for (const got of observed.columns) {
        const name = String(got.name ?? "").toLowerCase();
        if (!name || expectedNames.has(name)) continue;
        columnMismatches.push({
          table: table.key,
          column: name,
          reason: "unexpected",
          sensitive: SENSITIVE_COLUMN_HINTS.some((h) => name.includes(h)),
        });
      }
    }
    const expectedConstraints = table.constraints ?? [];
    if (expectedConstraints.length && !observed.constraints) {
      incomplete.push(`constraints:${table.key}`);
    } else if (Array.isArray(observed.constraints)) {
      const used = new Set();
      for (const cons of expectedConstraints) {
        let matched = false;
        let unverified = false;
        observed.constraints.forEach((got, idx) => {
          if (matched || used.has(idx)) return;
          const result = constraintsEquivalent(cons, got, table.key, {
            expectedTables: expected.tables,
            observedTables: catalog.tables,
          });
          if (result.unverified) unverified = true;
          else if (result.match) {
            matched = true;
            used.add(idx);
          }
        });
        if (unverified && !matched) {
          constraintMismatches.push({
            table: table.key,
            kind: cons.kind,
            identity: cons.identity,
            reason: "unverified",
          });
        } else if (!matched) {
          constraintMismatches.push({
            table: table.key,
            kind: cons.kind,
            identity: cons.identity ?? cons.spec,
            columns: cons.columns,
            checkExpression: cons.checkExpression,
            referencedTable: cons.referencedTable,
            reason: "mismatch",
          });
        }
      }
      observed.constraints.forEach((got, idx) => {
        if (used.has(idx)) return;
        const normalized = normalizeConstraint(got, table.key);
        constraintMismatches.push({
          table: table.key,
          kind: normalized.kind,
          identity: normalized.identity ?? normalized.spec,
          reason: normalized.unverified ? "unverified" : "unexpected",
        });
      });
    }
    if (table.rlsEnabled || table.rlsForced) {
      const enabledState = hasOwn(observed, "rlsEnabled")
        ? observationState(observed, "rlsEnabled", { allowEmpty: true })
        : observationState(observed.rls ?? {}, "enabled", { allowEmpty: true });
      const forcedState = hasOwn(observed, "rlsForced")
        ? observationState(observed, "rlsForced", { allowEmpty: true })
        : observationState(observed.rls ?? {}, "forced", { allowEmpty: true });
      if (table.rlsEnabled && enabledState.state !== OBSERVATION_STATES.PRESENT) {
        incomplete.push(`rlsEnabled:${table.key}`);
      } else if (table.rlsEnabled && enabledState.value === false) {
        rlsMismatches.push({ table: table.key, field: "enabled" });
      }
      if (table.rlsForced && forcedState.state !== OBSERVATION_STATES.PRESENT) {
        incomplete.push(`rlsForced:${table.key}`);
      } else if (table.rlsForced && forcedState.value === false) {
        rlsMismatches.push({ table: table.key, field: "forced" });
      }
    }
    if ((table.grants ?? []).length && !hasOwn(observed, "grants") && observed.grants == null) {
      incomplete.push(`grants:${table.key}`);
    } else if (hasOwn(observed, "grants") || (table.grants ?? []).length) {
      const gotList = observed.grants ?? [];
      if (gotList.some((g) => !grantObservationComplete(g))) {
        incomplete.push(`grants:${table.key}`);
      }
      const got = new Set(gotList.map((g) => grantKey({ ...g, table: table.key })));
      const exp = new Set((table.grants ?? []).map((g) => grantKey({ ...g, table: table.key })));
      for (const g of table.grants ?? []) {
        if (!got.has(grantKey({ ...g, table: table.key }))) {
          grantMismatches.push({ table: table.key, grant: g, reason: "missing" });
        }
      }
      for (const g of gotList) {
        const key = grantKey({ ...g, table: table.key });
        if (!exp.has(key)) {
          grantMismatches.push({ table: table.key, grant: g, reason: "unexpected" });
        }
      }
    }
    if ((table.columnGrants ?? []).length && !hasOwn(observed, "columnGrants") && observed.columnGrants == null) {
      incomplete.push(`columnGrants:${table.key}`);
    } else if (hasOwn(observed, "columnGrants") || (table.columnGrants ?? []).length) {
      const gotList = observed.columnGrants ?? [];
      if (gotList.some((g) => !grantObservationComplete(g))) {
        incomplete.push(`columnGrants:${table.key}`);
      }
      const got = new Set(gotList.map((g) => grantKey({ ...g, table: table.key })));
      const exp = new Set((table.columnGrants ?? []).map((g) => grantKey({ ...g, table: table.key })));
      for (const g of table.columnGrants ?? []) {
        if (!got.has(grantKey({ ...g, table: table.key }))) {
          columnGrantMismatches.push({ table: table.key, grant: g, sensitive: true, reason: "missing" });
        }
      }
      for (const g of gotList) {
        const key = grantKey({ ...g, table: table.key });
        if (!exp.has(key)) {
          columnGrantMismatches.push({ table: table.key, grant: g, sensitive: true, reason: "unexpected" });
        }
      }
    }
  }

  const policyMismatches = [];
  for (const policy of expected.policies ?? []) {
    const got = observedPolicies.get(policy.key);
    if (!got) continue;
    const commandObs = observationState(got, "command");
    const rolesObs = observationState(got, "roles", { allowEmpty: true });
    const permissiveObs = observationState(got, "permissive", { allowEmpty: true });
    const usingObs = observationState(got, "using", { allowAbsent: true });
    const checkObs = observationState(got, "withCheck", { allowAbsent: true });
    if (commandObs.state !== OBSERVATION_STATES.PRESENT) {
      incomplete.push(`policyField:${policy.key}:command`);
    } else if (String(commandObs.value).toUpperCase() !== policy.command) {
      policyMismatches.push({ key: policy.key, field: "command" });
    }
    if (rolesObs.state !== OBSERVATION_STATES.PRESENT || !Array.isArray(got.roles)) {
      incomplete.push(`policyField:${policy.key}:roles`);
    } else if (!sameStringList(got.roles, policy.roles)) {
      policyMismatches.push({ key: policy.key, field: "roles" });
    }
    if (permissiveObs.state !== OBSERVATION_STATES.PRESENT || typeof got.permissive !== "boolean") {
      incomplete.push(`policyField:${policy.key}:permissive`);
    } else if (got.permissive !== (policy.permissive !== false)) {
      policyMismatches.push({ key: policy.key, field: "permissive" });
    }
    if (usingObs.state === OBSERVATION_STATES.MISSING || usingObs.state === OBSERVATION_STATES.UNKNOWN) {
      incomplete.push(`policyField:${policy.key}:using`);
    } else if (usingObs.state === OBSERVATION_STATES.ABSENT) {
      if (policy.using != null && String(policy.using).trim() !== "") {
        policyMismatches.push({ key: policy.key, field: "using" });
      }
    } else if (normalizeExpr(usingObs.value) !== normalizeExpr(policy.using ?? "")) {
      policyMismatches.push({ key: policy.key, field: "using" });
    }
    if (checkObs.state === OBSERVATION_STATES.MISSING || checkObs.state === OBSERVATION_STATES.UNKNOWN) {
      incomplete.push(`policyField:${policy.key}:withCheck`);
    } else if (checkObs.state === OBSERVATION_STATES.ABSENT) {
      if (policy.withCheck != null && String(policy.withCheck).trim() !== "") {
        policyMismatches.push({ key: policy.key, field: "withCheck" });
      }
    } else if (normalizeExpr(checkObs.value) !== normalizeExpr(policy.withCheck ?? "")) {
      policyMismatches.push({ key: policy.key, field: "withCheck" });
    }
  }

  const expectedFunctionKeys = new Set((expected.functions ?? []).map((f) => functionIdentityKey(f)));
  const missingFunctions = (expected.functions ?? []).filter((f) => !observedFunctions.has(functionIdentityKey(f)));
  const unexpectedFunctions = (catalog.functions ?? []).filter((f) => {
    const schema = (f.schema ?? "public").toLowerCase();
    if (VENDOR_SCHEMAS.includes(schema) && schema !== "public") return false;
    return !expectedFunctionKeys.has(functionIdentityKey(f));
  });
  const functionSecurityMismatches = [];
  const functionMismatches = [];
  for (const fn of expected.functions ?? []) {
    const exp = normalizeFunction(fn);
    const gotRaw = observedFunctions.get(exp.key);
    if (!gotRaw) continue;
    const got = normalizeFunction(gotRaw);
    if (got.unverified || exp.unverified) {
      functionMismatches.push({ key: exp.key, field: "unverified" });
      continue;
    }
    const returnsObs = hasOwn(gotRaw, "returns")
      ? observationState(gotRaw, "returns")
      : hasOwn(gotRaw, "header")
        ? { state: got.returns ? OBSERVATION_STATES.PRESENT : OBSERVATION_STATES.UNKNOWN, value: got.returns }
        : { state: OBSERVATION_STATES.MISSING, value: undefined };
    if (returnsObs.state !== OBSERVATION_STATES.PRESENT) {
      incomplete.push(`functionReturns:${exp.key}`);
    } else if (exp.returns && normalizeType(returnsObs.value) !== exp.returns) {
      functionMismatches.push({
        key: exp.key,
        field: "returns",
        expected: exp.returns,
        observed: normalizeType(returnsObs.value),
      });
    }
    const securityPresent = hasOwn(gotRaw, "security") || Boolean(gotRaw.header);
    if (!securityPresent) {
      incomplete.push(`functionSecurity:${exp.key}`);
    } else if (got.security && got.security !== exp.security) {
      functionSecurityMismatches.push({
        key: exp.key,
        expected: exp.security,
        observed: got.security,
      });
    }
    const volatilityPresent = hasOwn(gotRaw, "volatility") || Boolean(gotRaw.header);
    if (!volatilityPresent) {
      incomplete.push(`functionVolatility:${exp.key}`);
    } else if (exp.volatility && got.volatility && exp.volatility !== got.volatility) {
      functionMismatches.push({
        key: exp.key,
        field: "volatility",
        expected: exp.volatility,
        observed: got.volatility,
      });
    }
    if (exp.searchPath && got.searchPath && exp.searchPath !== got.searchPath) {
      functionMismatches.push({
        key: exp.key,
        field: "searchPath",
        expected: exp.searchPath,
        observed: got.searchPath,
      });
    }
    if (exp.searchPath && !got.searchPath && !hasOwn(gotRaw, "searchPath") && !hasOwn(gotRaw, "search_path") && gotRaw.config == null) {
      incomplete.push(`functionSearchPath:${exp.key}`);
    }
  }

  const functionGrantMismatches = [];
  const expectedFunctionGrants = (expected.functionGrants ?? []).filter((g) => !g.revoke);
  if (expectedFunctionGrants.length && catalog.functionGrants == null) {
    incomplete.push("functionGrants");
  } else if (catalog.functionGrants != null || expectedFunctionGrants.length) {
    if (expectedFunctionGrants.length && catalog.functionGrants == null) {
      incomplete.push("functionGrants");
    } else {
      const observedGrants = catalog.functionGrants ?? [];
      const got = new Set(observedGrants.map(functionGrantKey));
      const exp = new Set(expectedFunctionGrants.map(functionGrantKey));
      for (const g of expectedFunctionGrants) {
        if (!got.has(functionGrantKey(g))) {
          functionGrantMismatches.push({ ...g, reason: "missing" });
        }
      }
      for (const g of observedGrants) {
        if (!exp.has(functionGrantKey(g))) {
          functionGrantMismatches.push({ ...g, reason: "unexpected" });
        }
      }
    }
  }

  const triggerKeyOf = (t) => {
    const table = String(t.table).includes(".")
      ? String(t.table).toLowerCase()
      : `public.${String(t.table).toLowerCase()}`;
    return `${table}::${String(t.name).toLowerCase()}`;
  };
  const expectedTriggerKeys = new Set((expected.triggers ?? []).map((t) => t.key ?? triggerKeyOf(t)));
  const missingTriggers = (expected.triggers ?? []).filter((t) => !observedTriggers.has(t.key ?? triggerKeyOf(t)));
  const unexpectedTriggers = (catalog.triggers ?? []).filter((t) => {
    const table = String(t.table ?? "").toLowerCase();
    const schema = table.includes(".") ? table.split(".")[0] : "public";
    if (VENDOR_SCHEMAS.includes(schema) && schema !== "public") return false;
    return !expectedTriggerKeys.has(triggerKeyOf(t));
  });
  const triggerMismatches = [];
  for (const trig of expected.triggers ?? []) {
    const got = observedTriggers.get(trig.key ?? triggerKeyOf(trig));
    if (!got) continue;
    for (const field of ["timing", "events", "function"]) {
      const state = observationState(got, field);
      if (state.state !== OBSERVATION_STATES.PRESENT) {
        incomplete.push(`triggerField:${trig.key}:${field}`);
      }
    }
    if (trig.timing && got.timing && String(got.timing).toUpperCase() !== String(trig.timing).toUpperCase()) {
      triggerMismatches.push({ key: trig.key, field: "timing" });
    }
    if (trig.events && got.events && normalizeWs(got.events).toUpperCase() !== normalizeWs(trig.events).toUpperCase()) {
      triggerMismatches.push({ key: trig.key, field: "events" });
    }
    if (trig.function && got.function && String(got.function).toLowerCase() !== String(trig.function).toLowerCase()) {
      triggerMismatches.push({ key: trig.key, field: "function" });
    }
  }
  const expectedIndexNames = new Set((expected.indexes ?? []).map((i) => String(i.name).toLowerCase()));
  const missingIndexes = (expected.indexes ?? []).filter((i) => {
    if (!catalog.indexes) return false;
    return !observedIndexes.has(i.name);
  });
  const indexMismatches = [];
  for (const exp of expected.indexes ?? []) {
    const got = observedIndexes.get(String(exp.name).toLowerCase());
    if (!got) continue;
    const expCols = parseIndexColumns(exp);
    const gotCols = parseIndexColumns(got);
    if (expCols.length && !gotCols.length && !got.spec && !got.definition && !got.columns) {
      incomplete.push(`indexDefinition:${exp.name}`);
      continue;
    }
    if (expCols.length && gotCols.length && !sameOrderedList(expCols, gotCols)) {
      indexMismatches.push({ name: exp.name, field: "columns", expected: expCols, observed: gotCols });
    }
    if (typeof exp.unique === "boolean" && typeof got.unique === "boolean" && exp.unique !== got.unique) {
      indexMismatches.push({ name: exp.name, field: "unique" });
    }
    if (exp.table && got.table && indexTableKey(exp) !== indexTableKey(got)) {
      indexMismatches.push({ name: exp.name, field: "table" });
    }
  }
  const unexpectedIndexes = (catalog.indexes ?? []).filter((i) => {
    const name = String(i.name ?? "").toLowerCase();
    if (expectedIndexNames.has(name)) return false;
    return !isConstraintImpliedIndex(i, expected.tables);
  });

  const storageId = (b) => String(b.id || b.name);
  const expectedStorageIds = new Set((expected.storageBuckets ?? []).map(storageId));
  const missingStorage = (expected.storageBuckets ?? []).filter((b) => {
    if (!catalog.storageBuckets) return false;
    const id = storageId(b);
    return !(catalog.storageBuckets ?? []).some((o) => storageId(o) === id);
  });
  const unexpectedStorage = (catalog.storageBuckets ?? []).filter((b) => !expectedStorageIds.has(storageId(b)));

  const unverifiedRequired = (expected.unverified ?? []).filter((u) => u.required !== false);

  return {
    available: true,
    status: "observed",
    missingTables,
    unexpectedTables,
    missingPolicies,
    unexpectedPolicies,
    policyMismatches,
    columnMismatches,
    constraintMismatches,
    grantMismatches,
    columnGrantMismatches,
    rlsMismatches,
    missingFunctions,
    unexpectedFunctions,
    functionMismatches,
    functionSecurityMismatches,
    functionGrantMismatches,
    missingTriggers,
    unexpectedTriggers,
    triggerMismatches,
    missingIndexes,
    unexpectedIndexes,
    indexMismatches,
    missingStorage,
    unexpectedStorage,
    unverifiedRequired,
    shapeIncomplete: incomplete,
    matchingTables: (expected.tables?.length ?? 0) - missingTables.length,
    matchingPolicies: (expected.policies?.length ?? 0) - missingPolicies.length,
    expectedTableCount: expected.tables?.length ?? 0,
    expectedPolicyCount: expected.policies?.length ?? 0,
    securityProof: false,
    existenceOnly: false,
    schemaEquivalence: false,
    contractKind: expected.contractKind ?? "static-sql-expected-objects",
    limitations: CONTRACT_LIMITATIONS,
  };
}

export function catalogBlocksCompletion(comparison) {
  if (!comparison?.available) return "CATALOG_NOT_CHECKED";
  if (comparison.unverifiedRequired?.length) return "CATALOG_REQUIREMENTS_UNVERIFIED";
  if (comparison.shapeIncomplete?.length) return "CATALOG_SHAPE_INCOMPLETE";
  if (comparison.missingTables?.length) return "LEDGER_SCHEMA_ABSENT";
  if (comparison.missingPolicies?.length) return "CATALOG_POLICY_MISSING";
  if (comparison.policyMismatches?.length) return "CATALOG_POLICY_MISMATCH";
  if (comparison.columnMismatches?.length) return "CATALOG_COLUMN_MISMATCH";
  if (comparison.constraintMismatches?.some((c) => c.reason === "unverified")) {
    return "CATALOG_CONSTRAINT_UNVERIFIED";
  }
  if (comparison.constraintMismatches?.length) return "CATALOG_CONSTRAINT_MISMATCH";
  if (comparison.rlsMismatches?.length) return "CATALOG_RLS_MISMATCH";
  if (comparison.grantMismatches?.length) return "CATALOG_GRANT_MISMATCH";
  if (comparison.columnGrantMismatches?.length) return "CATALOG_COLUMN_GRANT_MISMATCH";
  if (comparison.missingFunctions?.length) return "CATALOG_FUNCTION_MISSING";
  if (comparison.functionMismatches?.length) return "CATALOG_FUNCTION_MISMATCH";
  if (comparison.functionSecurityMismatches?.length) {
    return "CATALOG_FUNCTION_SECURITY_MISMATCH";
  }
  if (comparison.functionGrantMismatches?.length) return "CATALOG_FUNCTION_GRANT_MISMATCH";
  if (comparison.missingTriggers?.length) return "CATALOG_TRIGGER_MISSING";
  if (comparison.triggerMismatches?.length) return "CATALOG_TRIGGER_MISMATCH";
  if (comparison.missingIndexes?.length) return "CATALOG_INDEX_MISSING";
  if (comparison.indexMismatches?.length) return "CATALOG_INDEX_MISMATCH";
  if (comparison.missingStorage?.length) return "CATALOG_STORAGE_MISMATCH";
  if (comparison.unexpectedStorage?.length) return "CATALOG_STORAGE_MISMATCH";
  if (
    comparison.unexpectedTables?.length ||
    comparison.unexpectedPolicies?.length ||
    comparison.unexpectedFunctions?.length ||
    comparison.unexpectedIndexes?.length ||
    comparison.unexpectedTriggers?.length
  ) {
    return "CATALOG_UNEXPECTED_OBJECTS";
  }
  return null;
}

export function observedCatalogFromExpected(expected) {
  return {
    status: "observed",
    tables: (expected.tables ?? []).map((t) => ({
      schema: t.schema,
      name: t.name,
      columns: (t.columns ?? []).map((c) => ({
        name: c.name,
        type: c.type,
        nullable: c.nullable,
      })),
      constraints: t.constraints ?? [],
      rlsEnabled: Boolean(t.rlsEnabled),
      rlsForced: Boolean(t.rlsForced),
      grants: t.grants ?? [],
      columnGrants: t.columnGrants ?? [],
    })),
    policies: (expected.policies ?? []).map((p) => ({
      name: p.name,
      table: p.table,
      command: p.command,
      roles: p.roles ?? [],
      using: p.using ?? null,
      withCheck: p.withCheck ?? null,
      permissive: p.permissive !== false,
    })),
    functions: (expected.functions ?? []).map((f) => {
      const n = normalizeFunction(f);
      return {
        schema: n.schema,
        name: n.name,
        args: n.args,
        inputTypes: n.inputTypes,
        returns: n.returns,
        security: n.security,
        volatility: n.volatility,
        searchPath: n.searchPath,
        language: n.language,
      };
    }),
    functionGrants: expected.functionGrants ?? [],
    triggers: (expected.triggers ?? []).map((t) => ({
      name: t.name,
      table: t.table,
      timing: t.timing ?? null,
      events: t.events ?? null,
      function: t.function ?? null,
    })),
    indexes: expected.indexes ?? [],
    storageBuckets: expected.storageBuckets ?? [],
  };
}

function firstDefined(row, ...keys) {
  for (const key of keys) {
    if (hasOwn(row, key)) return row[key];
  }
  return undefined;
}

/**
 * Offline mapper from CATALOG_OBSERVE_SQL-shaped row bags to the catalog
 * object compareCatalog consumes. Does not execute SQL. Missing class keys
 * are incomplete. SQL NULL USING/WITH CHECK remains a present key with
 * value null (legally absent).
 */
export function mapObservedRowsToCatalog(rows) {
  if (!rows || typeof rows !== "object") {
    return { status: "NOT_CHECKED", shapeIncomplete: ["catalog"] };
  }
  const incomplete = [];
  const requireClass = (name) => {
    if (!hasOwn(rows, name)) incomplete.push(name);
    return hasOwn(rows, name);
  };

  requireClass("tables");
  requireClass("columns");
  requireClass("constraints");
  requireClass("functions");
  requireClass("policies");
  requireClass("functionGrants");
  requireClass("triggers");
  requireClass("indexes");
  requireClass("tableGrants");
  requireClass("columnGrants");
  requireClass("storageBuckets");

  const columnRows = rows.columns ?? [];
  const constraintRows = rows.constraints ?? [];
  const grantRows = rows.tableGrants ?? [];
  const columnGrantRows = rows.columnGrants ?? [];

  const tables = (rows.tables ?? []).map((t) => {
    const schema = String(firstDefined(t, "schema", "nspname") ?? "public").toLowerCase();
    const name = String(firstDefined(t, "name", "relname") ?? "").toLowerCase();
    const key = `${schema}.${name}`;
    const tableColumns = columnRows.filter(
      (c) =>
        String(firstDefined(c, "table", "relname") ?? "").toLowerCase() === name &&
        String(firstDefined(c, "schema") ?? schema).toLowerCase() === schema,
    );
    const tableConstraints = constraintRows
      .filter(
        (c) =>
          String(firstDefined(c, "table", "relname") ?? "").toLowerCase() === name &&
          String(firstDefined(c, "schema") ?? schema).toLowerCase() === schema,
      )
      .map((c) => {
        const kind = firstDefined(c, "kind", "contype");
        const referencedColumns = firstDefined(c, "referenced_columns", "referencedColumns");
        const hasRefCols = hasOwn(c, "referenced_columns") || hasOwn(c, "referencedColumns");
        return {
          name: firstDefined(c, "name", "conname") ?? null,
          kind,
          spec: firstDefined(c, "definition", "spec") ?? "",
          columns: firstDefined(c, "columns") ?? null,
          table: key,
          referencedSchema: firstDefined(c, "referenced_schema", "referencedSchema") ?? null,
          referencedTable: firstDefined(c, "referenced_table", "referencedTable") ?? null,
          referencedColumns: hasRefCols ? referencedColumns ?? [] : undefined,
          referencedColumnsMode:
            String(kind ?? "").toUpperCase() === "FOREIGN KEY"
              ? hasRefCols && Array.isArray(referencedColumns) && referencedColumns.length
                ? "explicit"
                : hasRefCols
                  ? "explicit"
                  : "implicit-pk"
              : undefined,
          onDelete: firstDefined(c, "on_delete", "onDelete") ?? null,
          onUpdate: firstDefined(c, "on_update", "onUpdate") ?? null,
          deferrable: firstDefined(c, "deferrable") ?? null,
          initiallyDeferred: firstDefined(c, "initially_deferred", "initiallyDeferred") ?? null,
        };
      });
    const grants = grantRows
      .filter(
        (g) =>
          String(firstDefined(g, "table") ?? "").toLowerCase() === name &&
          String(firstDefined(g, "schema") ?? schema).toLowerCase() === schema,
      )
      .map((g) => ({
        table: key,
        roles: [String(firstDefined(g, "grantee", "roles") ?? "public").toLowerCase()],
        privileges: [String(firstDefined(g, "privilege", "privileges") ?? "").toUpperCase()],
        columns: [],
        grantable: Boolean(g.grantable),
      }));
    const mappedColumnGrants = columnGrantRows
      .filter(
        (g) =>
          String(firstDefined(g, "table") ?? "").toLowerCase() === name &&
          String(firstDefined(g, "schema") ?? schema).toLowerCase() === schema,
      )
      .map((g) => ({
        table: key,
        roles: [String(firstDefined(g, "grantee") ?? "public").toLowerCase()],
        privileges: [String(firstDefined(g, "privilege") ?? "").toUpperCase()],
        columns: [String(firstDefined(g, "column") ?? "").toLowerCase()],
        grantable: Boolean(g.grantable),
      }));
    return {
      schema,
      name,
      key,
      rlsEnabled: firstDefined(t, "rls_enabled", "rlsEnabled") ?? null,
      rlsForced: firstDefined(t, "rls_forced", "rlsForced") ?? null,
      columns: tableColumns.map((c) => ({
        name: String(firstDefined(c, "name") ?? "").toLowerCase(),
        type: firstDefined(c, "type"),
        nullable: firstDefined(c, "nullable"),
      })),
      constraints: tableConstraints,
      grants,
      columnGrants: mappedColumnGrants,
    };
  });

  const policies = (rows.policies ?? []).map((p) => ({
    name: firstDefined(p, "name", "polname"),
    table: `${String(firstDefined(p, "schema") ?? "public").toLowerCase()}.${String(firstDefined(p, "table") ?? "").toLowerCase()}`,
    command: firstDefined(p, "command"),
    roles: firstDefined(p, "roles"),
    permissive: firstDefined(p, "permissive"),
    using: hasOwn(p, "using") ? p.using : hasOwn(p, "polqual") ? p.polqual : undefined,
    withCheck: hasOwn(p, "with_check")
      ? p.with_check
      : hasOwn(p, "withCheck")
        ? p.withCheck
        : undefined,
  }));

  const functions = (rows.functions ?? []).map((f) => ({
    schema: firstDefined(f, "schema") ?? "public",
    name: firstDefined(f, "name"),
    args: firstDefined(f, "identity_args", "identityArgs", "args"),
    identityArgs: firstDefined(f, "identity_args", "identityArgs"),
    returns: firstDefined(f, "returns"),
    security: firstDefined(f, "security"),
    language: firstDefined(f, "language"),
    volatility: firstDefined(f, "volatility"),
    config: firstDefined(f, "config"),
    searchPath: firstDefined(f, "searchPath", "search_path"),
  }));

  const functionGrants = (rows.functionGrants ?? []).map((g) => ({
    function: `${String(firstDefined(g, "schema") ?? "public").toLowerCase()}.${String(firstDefined(g, "name") ?? "").toLowerCase()}`,
    name: firstDefined(g, "name"),
    schema: firstDefined(g, "schema") ?? "public",
    args: firstDefined(g, "args") ? `(${String(firstDefined(g, "args"))})` : "",
    roles: [String(firstDefined(g, "grantee") ?? "public").toLowerCase()],
    privileges: [String(firstDefined(g, "privilege") ?? "EXECUTE").toUpperCase()],
    grantable: Boolean(g.grantable),
  }));

  const triggers = (rows.triggers ?? []).map((t) => ({
    name: firstDefined(t, "name"),
    table: `${String(firstDefined(t, "schema") ?? "public").toLowerCase()}.${String(firstDefined(t, "table") ?? "").toLowerCase()}`,
    timing: firstDefined(t, "timing"),
    events: firstDefined(t, "events"),
    function: firstDefined(t, "function"),
  }));

  return {
    status: "observed",
    tables,
    policies,
    functions,
    functionGrants,
    triggers,
    indexes: rows.indexes ?? [],
    storageBuckets: rows.storageBuckets ?? [],
    vendorHistory: rows.vendorHistory ?? [],
    shapeIncomplete: incomplete,
    mappedFromObservePlan: true,
  };
}

export function versionOfFilename(filename) {
  return String(filename).slice(0, 14);
}

export { fail };
