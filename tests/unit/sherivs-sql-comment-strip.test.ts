/**
 * Representative tests for the offline SQL comment stripper.
 * Static only. Does not connect to PostgreSQL and does not execute SQL.
 */
import { describe, expect, it } from "vitest";
import {
  executableSqlCode,
  extractDollarQuotedFunctionBody,
  scanPostgresSql,
  stripSqlComments,
} from "./sherivs-sql-comment-strip";

describe("SQL comment stripper — classification (static)", () => {
  it("keeps executable statements and blanks line comments", () => {
    const sql = `-- CREATE INDEX CONCURRENTLY should_not_count\nBEGIN;\nCREATE TABLE t();\nCOMMIT;`;
    expect(executableSqlCode(sql)).not.toMatch(/CREATE INDEX CONCURRENTLY/i);
    expect(executableSqlCode(sql)).toMatch(/^\s*BEGIN;/m);
    expect(executableSqlCode(sql)).toContain("CREATE TABLE t()");
    expect(stripSqlComments(sql)).toContain("CREATE TABLE t()");
  });

  it("still detects a real CREATE INDEX CONCURRENTLY statement", () => {
    const sql = "CREATE INDEX CONCURRENTLY idx ON t(id);";
    expect(executableSqlCode(sql)).toMatch(/CREATE INDEX CONCURRENTLY/i);
  });

  it("does not treat -- inside a single-quoted string as a comment", () => {
    const sql = "SELECT '-- not a comment';\nCREATE TABLE kept();";
    expect(stripSqlComments(sql)).toContain("'-- not a comment'");
    expect(stripSqlComments(sql)).toContain("CREATE TABLE kept()");
    expect(executableSqlCode(sql)).toContain("CREATE TABLE kept()");
    expect(executableSqlCode(sql)).not.toContain("not a comment");
  });

  it("does not treat -- inside dollar-quoted SQL as a SQL-level comment", () => {
    const sql = `CREATE FUNCTION f() RETURNS void LANGUAGE sql AS $$\n-- session_user\nSELECT 1;\n$$;`;
    expect(stripSqlComments(sql)).toMatch(/-- session_user/);
    expect(executableSqlCode(sql)).not.toMatch(/session_user/);
    const body = extractDollarQuotedFunctionBody(sql, "f");
    expect(body).toMatch(/-- session_user/);
    expect(stripSqlComments(body)).not.toMatch(/session_user/);
    expect(executableSqlCode(body)).toContain("SELECT 1");
  });

  it("nests block comments the PostgreSQL way", () => {
    const sql = "/* outer /* inner */ CREATE INDEX CONCURRENTLY x */ CREATE TABLE t();";
    expect(executableSqlCode(sql)).not.toMatch(/CREATE INDEX CONCURRENTLY/i);
    expect(executableSqlCode(sql)).toContain("CREATE TABLE t()");
  });

  it("does not start a block comment inside a string", () => {
    const sql = "SELECT '/*';\nCREATE TABLE t();";
    expect(executableSqlCode(sql)).toContain("CREATE TABLE t()");
  });

  it("does not treat COMMENT ON dollar-quoted prose as executable code", () => {
    const sql = `CREATE FUNCTION f() RETURNS void LANGUAGE sql AS $$ SELECT 1; $$;\nCOMMENT ON FUNCTION f() IS $comment$session_user and CREATE INDEX CONCURRENTLY$comment$;`;
    expect(executableSqlCode(sql)).toContain("CREATE FUNCTION f()");
    expect(executableSqlCode(sql)).not.toMatch(/session_user/);
    expect(executableSqlCode(sql)).not.toMatch(/CREATE INDEX CONCURRENTLY/i);
  });

  it("honors '' escapes inside ordinary strings", () => {
    const sql = "SELECT 'it''s -- still a string';\nCREATE TABLE t();";
    expect(stripSqlComments(sql)).toContain("CREATE TABLE t()");
    expect(scanPostgresSql(sql).some((p) => p.kind === "literal" && p.text.includes("-- still a string"))).toBe(
      true,
    );
  });

  it("honors E-string backslash escapes so comments cannot start inside them", () => {
    const sql = "SELECT E'it\\'s -- still';\nCREATE TABLE t();";
    expect(executableSqlCode(sql)).toContain("CREATE TABLE t()");
  });

  it("detects an auth.uid() IS NULL RETURN NEW bypass in executable plpgsql", () => {
    const bad = `BEGIN\n  IF auth.uid() IS NULL THEN\n    RETURN NEW;\n  END IF;\nEND;`;
    expect(stripSqlComments(bad)).toMatch(/IF\s+auth\.uid\(\)\s+IS\s+NULL\s+THEN/i);
    expect(executableSqlCode(bad)).toMatch(/RETURN NEW/);
    const commented = `-- IF auth.uid() IS NULL THEN RETURN NEW;\nBEGIN\n  RETURN NEW;\nEND;`;
    expect(stripSqlComments(commented)).not.toMatch(/IF\s+auth\.uid\(\)\s+IS\s+NULL\s+THEN/i);
  });
});
