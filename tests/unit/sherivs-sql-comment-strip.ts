/**
 * Offline PostgreSQL-oriented SQL comment stripper for static tests.
 *
 * This is not a PostgreSQL parser and does not prove catalog behavior.
 * It classifies source into code, comments, and literals so assertions can
 * inspect executable text instead of documentation.
 *
 * SQL-level vs plpgsql-level:
 *   Inside a dollar-quoted function body, `--` and `/*` are NOT SQL comments;
 *   they are literal text in the stored function source. After the body is
 *   extracted, the same scanner is applied to that text as plpgsql source.
 *
 * Limitations (no full SQL parser):
 *   - Unterminated quotes/comments consume through EOF.
 *   - Dollar tags are ASCII `$` + optional `[A-Za-z_][A-Za-z0-9_]*` + `$`.
 *     Same-tag dollar quotes cannot nest (PostgreSQL rule); different tags
 *     inside an outer body are literal text.
 *   - Ordinary `'` strings use `''` escapes. `E'...'` / `e'...'` also honor
 *     backslash escapes. `U&`, `B`, `X`, `N` prefixes are not special-cased
 *     (the quote that follows is still a string).
 *   - `standard_conforming_strings = off` is not modeled for non-E strings.
 *   - psql meta-commands (`\echo`, backtick) are not modeled.
 *   - Operator characters adjacent to `--` still start a line comment,
 *     matching PostgreSQL (`1--x`).
 */

export type SqlPartKind = "code" | "comment" | "literal";

export type SqlPart = {
  kind: SqlPartKind;
  text: string;
};

function isIdentChar(ch: string | undefined): boolean {
  return Boolean(ch && /[A-Za-z0-9_]/.test(ch));
}

function dollarTagAt(sql: string, i: number): string | null {
  if (sql[i] !== "$") return null;
  if (sql[i + 1] === "$") return "$$";
  const slice = sql.slice(i);
  const match = slice.match(/^\$[A-Za-z_][A-Za-z0-9_]*\$/);
  return match ? match[0] : null;
}

function blankKeepNewlines(text: string): string {
  return text.replace(/[^\n]/g, " ");
}

export function scanPostgresSql(sql: string): SqlPart[] {
  const parts: SqlPart[] = [];
  const n = sql.length;
  let i = 0;
  let codeStart = 0;

  const flushCode = (end: number) => {
    if (end > codeStart) {
      parts.push({ kind: "code", text: sql.slice(codeStart, end) });
    }
  };

  while (i < n) {
    const c = sql[i];
    const nch = sql[i + 1];

    const tag = dollarTagAt(sql, i);
    if (tag) {
      const close = sql.indexOf(tag, i + tag.length);
      flushCode(i);
      if (close < 0) {
        parts.push({ kind: "literal", text: sql.slice(i) });
        return parts;
      }
      parts.push({ kind: "literal", text: sql.slice(i, close + tag.length) });
      i = close + tag.length;
      codeStart = i;
      continue;
    }

    const eString =
      (c === "E" || c === "e") && nch === "'" && (i === 0 || !isIdentChar(sql[i - 1]));
    if (c === "'" || eString) {
      flushCode(i);
      let j = eString ? i + 2 : i + 1;
      while (j < n) {
        if (eString && sql[j] === "\\") {
          j += 2;
          continue;
        }
        if (sql[j] === "'" && sql[j + 1] === "'") {
          j += 2;
          continue;
        }
        if (sql[j] === "'") {
          j += 1;
          break;
        }
        j += 1;
      }
      parts.push({ kind: "literal", text: sql.slice(i, j) });
      i = j;
      codeStart = i;
      continue;
    }

    if (c === '"') {
      flushCode(i);
      let j = i + 1;
      while (j < n) {
        if (sql[j] === '"' && sql[j + 1] === '"') {
          j += 2;
          continue;
        }
        if (sql[j] === '"') {
          j += 1;
          break;
        }
        j += 1;
      }
      parts.push({ kind: "literal", text: sql.slice(i, j) });
      i = j;
      codeStart = i;
      continue;
    }

    if (c === "-" && nch === "-") {
      flushCode(i);
      let j = i + 2;
      while (j < n && sql[j] !== "\n") j += 1;
      parts.push({ kind: "comment", text: sql.slice(i, j) });
      i = j;
      codeStart = i;
      continue;
    }

    if (c === "/" && nch === "*") {
      flushCode(i);
      let depth = 1;
      let j = i + 2;
      while (j < n && depth > 0) {
        if (sql[j] === "/" && sql[j + 1] === "*") {
          depth += 1;
          j += 2;
          continue;
        }
        if (sql[j] === "*" && sql[j + 1] === "/") {
          depth -= 1;
          j += 2;
          continue;
        }
        j += 1;
      }
      parts.push({ kind: "comment", text: sql.slice(i, j) });
      i = j;
      codeStart = i;
      continue;
    }

    i += 1;
  }

  flushCode(n);
  return parts;
}

/** Replace SQL-level comments with spaces. Literals and code are kept. */
export function stripSqlComments(sql: string): string {
  return scanPostgresSql(sql)
    .map((part) => (part.kind === "comment" ? blankKeepNewlines(part.text) : part.text))
    .join("");
}

/**
 * Keep only SQL-level executable tokens. Comments and literals become spaces.
 * Dollar-quoted function bodies are literals at SQL level; analyze them with
 * this function after extraction if plpgsql comments must be stripped.
 */
export function executableSqlCode(sql: string): string {
  return scanPostgresSql(sql)
    .map((part) => (part.kind === "code" ? part.text : blankKeepNewlines(part.text)))
    .join("");
}

function dollarInterior(literal: string): string {
  const tag = dollarTagAt(literal, 0);
  if (!tag) {
    throw new Error("literal is not dollar-quoted");
  }
  if (!literal.endsWith(tag) || literal.length < tag.length * 2) {
    throw new Error("unterminated dollar-quoted literal");
  }
  return literal.slice(tag.length, literal.length - tag.length);
}

/**
 * Return the first dollar-quoted body after CREATE OR REPLACE FUNCTION <name>().
 * Search ignores comments. The first dollar-quoted literal after AS is the body.
 */
export function extractDollarQuotedFunctionBody(sql: string, qualifiedName: string): string {
  const needle = `function ${qualifiedName}()`.replace(/\s+/g, " ").toLowerCase();
  let codeWindow = "";
  let phase: "find" | "as" | "body" = "find";
  for (const part of scanPostgresSql(sql)) {
    if (phase === "find") {
      if (part.kind !== "code") continue;
      codeWindow = `${codeWindow}${part.text}`.replace(/\s+/g, " ");
      const lowered = codeWindow.toLowerCase();
      if (
        lowered.includes(needle) &&
        /create\s+(or\s+replace\s+)?function/.test(lowered)
      ) {
        phase = /\bAS\b/i.test(part.text) ? "body" : "as";
      }
      continue;
    }
    if (phase === "as") {
      if (part.kind === "comment") continue;
      if (part.kind === "code" && /\bAS\b/i.test(part.text)) {
        phase = "body";
        continue;
      }
      continue;
    }
    if (part.kind === "comment") continue;
    if (part.kind === "code" && part.text.trim() === "") continue;
    if (part.kind === "literal" && dollarTagAt(part.text, 0)) {
      return dollarInterior(part.text);
    }
    throw new Error(`expected dollar-quoted body for ${qualifiedName}`);
  }
  throw new Error(`function ${qualifiedName} not found`);
}
