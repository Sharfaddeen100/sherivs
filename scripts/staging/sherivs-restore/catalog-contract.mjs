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
  tables: `SELECT n.nspname AS schema, c.relname AS name
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
  policies: `SELECT n.nspname AS schema,
                    c.relname AS table,
                    p.polname AS name,
                    CASE p.polcmd WHEN 'r' THEN 'SELECT' WHEN 'a' THEN 'INSERT'
                         WHEN 'w' THEN 'UPDATE' WHEN 'd' THEN 'DELETE' ELSE 'ALL' END AS command,
                    pg_get_expr(p.polqual, p.polrelid) AS using,
                    pg_get_expr(p.polwithcheck, p.polrelid) AS with_check
               FROM pg_policy p
               JOIN pg_class c ON c.oid = p.polrelid
               JOIN pg_namespace n ON n.oid = c.relnamespace
              WHERE n.nspname = 'public'`,
  vendorHistory: `SELECT version
                    FROM supabase_migrations.schema_migrations
                   ORDER BY version`,
  note: "read-only observation plan for a future authorized catalog mission; this process does not execute it",
});

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
      constraints.push({
        name: constraint[1] ? identName(constraint[1]) : null,
        kind,
        spec: normalizeWs(constraint[3]),
        table: tableKey,
        sourceFile: filename,
      });
      continue;
    }
    const col = raw.match(/^((?:"[^"]+"|[a-zA-Z_][\w$]*))\s+([a-zA-Z_][\w$]*(?:\s*\.\s*[a-zA-Z_][\w$]*)?)(\s*\([^)]*\))?([\s\S]*)$/);
    if (!col) continue;
    const name = identName(col[1]).toLowerCase();
    const type = normalizeType(`${col[2]}${col[3] ?? ""}`);
    const rest = col[4] ?? "";
    const nullable = !/\bNOT\s+NULL\b/i.test(rest) && !/\bPRIMARY\s+KEY\b/i.test(rest);
    if (/\bPRIMARY\s+KEY\b/i.test(rest)) {
      constraints.push({
        name: null,
        kind: "PRIMARY KEY",
        spec: `(${name})`,
        table: tableKey,
        sourceFile: filename,
      });
    }
    if (/\bUNIQUE\b/i.test(rest) && !/\bUNIQUE\s+INDEX\b/i.test(rest)) {
      constraints.push({
        name: null,
        kind: "UNIQUE",
        spec: `(${name})`,
        table: tableKey,
        sourceFile: filename,
      });
    }
    const fk = rest.match(/\bREFERENCES\s+((?:"[^"]+"|[a-zA-Z_][\w$]*)(?:\s*\.\s*(?:"[^"]+"|[a-zA-Z_][\w$]*))?)/i);
    if (fk) {
      constraints.push({
        name: null,
        kind: "FOREIGN KEY",
        spec: `(${name}) REFERENCES ${qualify(fk[1]).schema}.${qualify(fk[1]).name}`,
        table: tableKey,
        sourceFile: filename,
      });
    }
    const check = rest.match(/\bCHECK\s*\(/i);
    if (check) {
      constraints.push({
        name: null,
        kind: "CHECK",
        spec: normalizeWs(rest.slice(check.index)),
        table: tableKey,
        sourceFile: filename,
      });
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

function grantKey(g) {
  return `${g.table}::${(g.roles ?? []).join(",")}::${(g.privileges ?? []).join(",")}::${(g.columns ?? []).join(",")}`;
}

function parseGrantList(list) {
  if (/^ALL\b/i.test(list.trim())) return ["ALL"];
  return splitTopLevel(list, ",")
    .map((p) => normalizeWs(p).toUpperCase())
    .filter(Boolean);
}

function applyGrant(tableObj, privileges, roles, columns, revoke) {
  const rec = {
    privileges: privileges.slice().sort(),
    roles: roles.slice().sort(),
    columns: (columns ?? []).map((c) => c.toLowerCase()).sort(),
    table: tableObj.key,
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
    tableObj.constraints.push({
      name: match[2] ? identName(match[2]) : null,
      kind: match[3].replace(/\s+/g, " ").toUpperCase(),
      spec: normalizeWs(match[4] ?? ""),
      table: ident.key,
      sourceFile: filename,
    });
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

  const fnRe = new RegExp(
    `CREATE\\s+(?:OR\\s+REPLACE\\s+)?FUNCTION\\s+(${QUAL})\\s*(\\([^)]*\\))([\\s\\S]*?)\\bAS\\s+`,
    "gi",
  );
  while ((match = fnRe.exec(src))) {
    const ident = qualify(match[1]);
    const args = normalizeWs(match[2]);
    const header = match[3] ?? "";
    const security = /\bSECURITY\s+DEFINER\b/i.test(header)
      ? "DEFINER"
      : /\bSECURITY\s+INVOKER\b/i.test(header)
        ? "INVOKER"
        : "INVOKER";
    const language = (header.match(/\bLANGUAGE\s+([a-zA-Z_]+)/i) ?? [])[1] ?? null;
    const returns = (header.match(/\bRETURNS\s+([a-zA-Z_][\w$]*)/i) ?? [])[1] ?? null;
    const key = `${ident.schema}.${ident.name}${args.toLowerCase()}`;
    into.functions.set(key, {
      schema: ident.schema,
      name: ident.name,
      args: args.toLowerCase(),
      key,
      security,
      language: language ? language.toLowerCase() : null,
      returns: returns ? returns.toLowerCase() : null,
      sourceFile: filename,
    });
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
    const roles = splitTopLevel(match[6], ",").map((r) => identName(r).toLowerCase());
    const columns = match[3]
      ? splitTopLevel(match[3], ",").map((c) => identName(c).toLowerCase())
      : [];
    applyGrant(tableObj, privileges, roles, columns, match[1].toUpperCase() === "REVOKE");
  }

  const grantFnRe = new RegExp(
    `(GRANT|REVOKE)\\s+EXECUTE\\s+ON\\s+FUNCTION\\s+(${QUAL})\\s*(?:\\([^)]*\\))?\\s+(?:TO|FROM)\\s+([^;]+)`,
    "gi",
  );
  while ((match = grantFnRe.exec(src))) {
    const ident = qualify(match[2]);
    const roles = splitTopLevel(match[3], ",").map((r) => identName(r).toLowerCase());
    const key = `${ident.schema}.${ident.name}`;
    into.functionGrants.set(key, {
      function: key,
      privileges: ["EXECUTE"],
      roles: roles.sort(),
      revoke: match[1].toUpperCase() === "REVOKE",
      sourceFile: filename,
    });
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

  const comparedObjectClasses = [
    "tables",
    "columns",
    "constraints",
    "indexes",
    "functions",
    "functionSecurity",
    "triggers",
    "rls",
    "policies",
    "policyExpressions",
    "grants",
    "columnGrants",
    "storageBuckets",
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
  requireObserved(expected.tables ?? [], catalog.tables, "tables", incomplete);
  if ((expected.policies ?? []).length && catalog.policies == null) {
    incomplete.push("policies");
  }
  if ((expected.functions ?? []).length && catalog.functions == null) {
    incomplete.push("functions");
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
  const observedFunctions = indexBy(
    catalog.functions ?? [],
    (f) => `${(f.schema ?? "public").toLowerCase()}.${String(f.name).toLowerCase()}${String(f.args ?? "").toLowerCase()}`,
  );
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
    if ((table.columns ?? []).length) {
      if (!observed.columns) incomplete.push(`columns:${table.key}`);
      else {
        const byName = indexBy(observed.columns, (c) => String(c.name).toLowerCase());
        for (const col of table.columns) {
          const got = byName.get(col.name);
          if (!got) {
            columnMismatches.push({ table: table.key, column: col.name, reason: "missing" });
            continue;
          }
          if (got.type && normalizeType(got.type) !== col.type) {
            columnMismatches.push({
              table: table.key,
              column: col.name,
              reason: "type",
              expected: col.type,
              observed: normalizeType(got.type),
            });
          }
          if (typeof got.nullable === "boolean" && got.nullable !== col.nullable) {
            columnMismatches.push({
              table: table.key,
              column: col.name,
              reason: "nullability",
              expected: col.nullable,
              observed: got.nullable,
            });
          }
        }
      }
    }
    if ((table.constraints ?? []).length) {
      if (!observed.constraints) incomplete.push(`constraints:${table.key}`);
      else {
        const gotKinds = observed.constraints.map((c) =>
          `${String(c.kind).toUpperCase()}:${normalizeWs(c.spec ?? "")}`,
        );
        for (const cons of table.constraints) {
          const needle = `${cons.kind}:${cons.spec}`;
          const found = gotKinds.some(
            (g) => g === needle || g.startsWith(`${cons.kind}:`),
          );
          if (!found) {
            constraintMismatches.push({
              table: table.key,
              kind: cons.kind,
              spec: cons.spec,
            });
          }
        }
      }
    }
    if (table.rlsEnabled || table.rlsForced) {
      const enabled = observed.rlsEnabled ?? observed.rls?.enabled;
      const forced = observed.rlsForced ?? observed.rls?.forced;
      if (enabled == null && observed.rlsEnabled == null && observed.rls == null) {
        incomplete.push(`rls:${table.key}`);
      } else {
        if (table.rlsEnabled && enabled === false) {
          rlsMismatches.push({ table: table.key, field: "enabled" });
        }
        if (table.rlsForced && forced === false) {
          rlsMismatches.push({ table: table.key, field: "forced" });
        }
      }
    }
    if ((table.grants ?? []).length) {
      if (!observed.grants) incomplete.push(`grants:${table.key}`);
      else {
        const got = new Set((observed.grants ?? []).map(grantKey));
        for (const g of table.grants) {
          if (!got.has(grantKey({ ...g, table: table.key }))) {
            grantMismatches.push({ table: table.key, grant: g });
          }
        }
      }
    }
    if ((table.columnGrants ?? []).length) {
      if (!observed.columnGrants) incomplete.push(`columnGrants:${table.key}`);
      else {
        const got = new Set((observed.columnGrants ?? []).map(grantKey));
        for (const g of table.columnGrants) {
          if (!got.has(grantKey({ ...g, table: table.key }))) {
            columnGrantMismatches.push({ table: table.key, grant: g, sensitive: true });
          }
        }
      }
    }
  }

  const policyMismatches = [];
  for (const policy of expected.policies ?? []) {
    const got = observedPolicies.get(policy.key);
    if (!got) continue;
    if (got.command || got.roles || got.using || got.withCheck) {
      if (got.command && String(got.command).toUpperCase() !== policy.command) {
        policyMismatches.push({ key: policy.key, field: "command" });
      }
      if (got.roles && !sameStringList(got.roles, policy.roles)) {
        policyMismatches.push({ key: policy.key, field: "roles" });
      }
      if (got.using != null && normalizeExpr(got.using) !== (policy.using ?? "")) {
        policyMismatches.push({ key: policy.key, field: "using" });
      }
      if (got.withCheck != null && normalizeExpr(got.withCheck) !== (policy.withCheck ?? "")) {
        policyMismatches.push({ key: policy.key, field: "withCheck" });
      }
    } else if (policy.command !== "ALL" || (policy.using || policy.withCheck)) {
      incomplete.push(`policyShape:${policy.key}`);
    }
  }

  const missingFunctions = (expected.functions ?? []).filter((f) => {
    if (observedFunctions.has(f.key)) return false;
    const byName = `${f.schema}.${f.name}`;
    return ![...observedFunctions.keys()].some((k) => k.startsWith(byName));
  });
  const functionSecurityMismatches = [];
  for (const fn of expected.functions ?? []) {
    const got =
      observedFunctions.get(fn.key) ??
      [...observedFunctions.values()].find(
        (o) =>
          (o.schema ?? "public").toLowerCase() === fn.schema &&
          String(o.name).toLowerCase() === fn.name,
      );
    if (got && got.security && String(got.security).toUpperCase() !== fn.security) {
      functionSecurityMismatches.push({ key: fn.key, expected: fn.security, observed: got.security });
    }
  }

  const missingTriggers = (expected.triggers ?? []).filter((t) => !observedTriggers.has(t.key));
  const missingIndexes = (expected.indexes ?? []).filter((i) => {
    if (!catalog.indexes) return false;
    return !observedIndexes.has(i.name);
  });

  const missingStorage = (expected.storageBuckets ?? []).filter((b) => {
    if (!catalog.storageBuckets) return false;
    const id = String(b.id || b.name);
    return !(catalog.storageBuckets ?? []).some((o) => String(o.id || o.name) === id);
  });

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
    functionSecurityMismatches,
    missingTriggers,
    missingIndexes,
    missingStorage,
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
  if (comparison.constraintMismatches?.length) return "CATALOG_CONSTRAINT_MISMATCH";
  if (comparison.rlsMismatches?.length) return "CATALOG_RLS_MISMATCH";
  if (comparison.grantMismatches?.length) return "CATALOG_GRANT_MISMATCH";
  if (comparison.columnGrantMismatches?.length) return "CATALOG_COLUMN_GRANT_MISMATCH";
  if (comparison.missingFunctions?.length) return "CATALOG_FUNCTION_MISSING";
  if (comparison.functionSecurityMismatches?.length) {
    return "CATALOG_FUNCTION_SECURITY_MISMATCH";
  }
  if (comparison.missingTriggers?.length) return "CATALOG_TRIGGER_MISSING";
  if (comparison.missingIndexes?.length) return "CATALOG_INDEX_MISSING";
  if (comparison.missingStorage?.length) return "CATALOG_STORAGE_MISMATCH";
  if (comparison.unexpectedTables?.length || comparison.unexpectedPolicies?.length) {
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
      columns: t.columns,
      constraints: t.constraints,
      rlsEnabled: t.rlsEnabled,
      rlsForced: t.rlsForced,
      grants: t.grants,
      columnGrants: t.columnGrants,
    })),
    policies: (expected.policies ?? []).map((p) => ({
      name: p.name,
      table: p.table,
      command: p.command,
      roles: p.roles,
      using: p.using,
      withCheck: p.withCheck,
    })),
    functions: expected.functions ?? [],
    triggers: expected.triggers ?? [],
    indexes: expected.indexes ?? [],
    storageBuckets: expected.storageBuckets ?? [],
  };
}

export function versionOfFilename(filename) {
  return String(filename).slice(0, 14);
}

export { fail };
