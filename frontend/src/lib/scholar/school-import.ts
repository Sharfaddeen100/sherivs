/**
 * CoreGrid Scholar — school import (Phase-04 §158).
 *
 * Existing schools may be imported from spreadsheets, CSV, existing SIS, HR
 * systems, government systems or manual configuration. Import jobs are typed
 * and validated BEFORE anything is applied; unknown row kinds surface issues
 * instead of being silently skipped (no invention).
 */

export type ImportSource = "spreadsheet" | "csv" | "sis" | "hr" | "government" | "manual";

export const IMPORT_SOURCES: readonly ImportSource[] = [
  "spreadsheet",
  "csv",
  "sis",
  "hr",
  "government",
  "manual",
] as const;

export type ImportScope =
  "levels" | "programmes" | "students" | "staff" | "classes" | "subjects" | "curriculum" | "custom";

export const IMPORT_SCOPES: readonly ImportScope[] = [
  "levels",
  "programmes",
  "students",
  "staff",
  "classes",
  "subjects",
  "curriculum",
  "custom",
] as const;

export type ImportStatus = "queued" | "validating" | "applying" | "done" | "failed";

export interface ImportJob {
  id: string;
  source: ImportSource;
  scope: ImportScope;
  payloadRef: string;
  status: ImportStatus;
}

export interface ImportRow {
  scope: ImportScope;
  values: Record<string, unknown>;
}

export function validateImportJobs(input: readonly ImportJob[]): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();
  for (const job of input) {
    const id = job.id.trim();
    if (!id) {
      issues.push("an import job requires an id");
      continue;
    }
    if (ids.has(id)) issues.push(`duplicate import job id "${id}"`);
    ids.add(id);
    if (!IMPORT_SOURCES.includes(job.source)) {
      issues.push(`import job "${id}": source must be one of ${IMPORT_SOURCES.join(", ")}`);
    }
    if (!IMPORT_SCOPES.includes(job.scope)) {
      issues.push(`import job "${id}": scope must be one of ${IMPORT_SCOPES.join(", ")}`);
    }
    if (!job.payloadRef.trim()) issues.push(`import job "${id}": payloadRef is required`);
  }
  return issues;
}

/**
 * Validate a batch of import rows for one job scope. Rows of another scope,
 * or rows missing the scope marker, are rejected — never silently dropped.
 */
export function validateImportRows(rows: readonly ImportRow[], jobScope: ImportScope): string[] {
  const issues: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    if (row.scope !== jobScope) {
      issues.push(`row ${index}: scope "${row.scope}" does not match job scope "${jobScope}"`);
    }
    const identity = row.values["code"] ?? row.values["id"];
    const key = identity == null ? `row-${index}` : `${row.scope}:${String(identity)}`;
    if (seen.has(key)) issues.push(`row ${index}: duplicate identity "${key}"`);
    seen.add(key);
  }
  return issues;
}
