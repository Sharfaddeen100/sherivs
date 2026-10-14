/**
 * Restore ledger state machine.
 *
 * Relation to Supabase CLI history:
 * - Supabase CLI records `supabase_migrations.schema_migrations(version, …)`
 *   when `supabase db push` applies files from a linked project.
 * - This runner does not use `supabase db push` (config.toml is production).
 * - On success it inserts the timestamp prefix into
 *   `supabase_migrations.schema_migrations` so a later correctly-linked CLI
 *   does not replay non-idempotent files.
 * - Rich restore evidence lives in
 *   `supabase_migrations.sherivs_staging_ledger` (same vendor schema, extra
 *   table — does not replace or rename schema_migrations).
 *
 * Atomicity:
 * - STARTED is committed on its own connection/transaction before SQL apply.
 * - Migration SQL + schema_migrations insert + SUCCEEDED update run in one
 *   transaction on a different per-file connection.
 * - If that transaction rolls back, STARTED remains. The runner then writes
 *   FAILED on a third short connection. A crash in between leaves STARTED
 *   with no completion — continuation is refused (reconciliation required).
 * - A migration is never marked succeeded before that transaction commits.
 */

import { randomUUID } from "node:crypto";
import {
  LEDGER_SCHEMA,
  LEDGER_STATUS,
  LEDGER_TABLE,
  PINNED_SOURCE_COMMIT,
  SCHEMA_MIGRATIONS_TABLE,
  TX_OUTCOME,
} from "./constants.mjs";
import { redactError, redactText } from "./redact.mjs";

export const BOOTSTRAP_SQL = `
CREATE SCHEMA IF NOT EXISTS ${LEDGER_SCHEMA};

CREATE TABLE IF NOT EXISTS ${LEDGER_SCHEMA}.${LEDGER_TABLE} (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq integer NOT NULL,
  filename text NOT NULL,
  content_checksum text NOT NULL,
  source_commit text NOT NULL,
  manifest_id text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  attempt_id text NOT NULL,
  execution_phase text,
  error_redacted text,
  transaction_outcome text,
  reconciliation_required boolean NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX IF NOT EXISTS sherivs_staging_ledger_attempt_file
  ON ${LEDGER_SCHEMA}.${LEDGER_TABLE} (attempt_id, filename);

CREATE TABLE IF NOT EXISTS ${LEDGER_SCHEMA}.${SCHEMA_MIGRATIONS_TABLE} (
  version text PRIMARY KEY
);
`.trim();

function versionOf(filename) {
  return filename.slice(0, 14);
}

export function evaluateLedger(rows, manifest, options = {}) {
  const files = manifest.files;
  const byName = new Map();
  for (const row of rows ?? []) {
    const prev = byName.get(row.filename) ?? [];
    prev.push(row);
    byName.set(row.filename, prev);
  }

  if (!rows?.length) {
    return { action: "fresh_apply", ok: true, reason: "ledger_empty" };
  }

  const blocking = [];
  let succeededMatching = 0;

  for (const expected of files) {
    const history = byName.get(expected.filename) ?? [];
    if (history.length === 0) continue;
    const latest = history[history.length - 1];
    if (latest.status === LEDGER_STATUS.STARTED && !latest.completed_at) {
      blocking.push({
        code: "LEDGER_INCOMPLETE",
        filename: expected.filename,
        detail: "started-but-incomplete; reconciliation required",
      });
      continue;
    }
    if (latest.status === LEDGER_STATUS.FAILED) {
      blocking.push({
        code: "LEDGER_FAILED",
        filename: expected.filename,
        detail: "failed record blocks continuation",
      });
      continue;
    }
    if (
      latest.status === LEDGER_STATUS.AMBIGUOUS ||
      latest.status === LEDGER_STATUS.RECONCILIATION_REQUIRED ||
      latest.reconciliation_required
    ) {
      blocking.push({
        code: "LEDGER_AMBIGUOUS",
        filename: expected.filename,
        detail: "ambiguous/reconciliation-required record blocks continuation",
      });
      continue;
    }
    if (latest.status === LEDGER_STATUS.SUCCEEDED) {
      if (latest.content_checksum !== expected.sha256) {
        blocking.push({
          code: "LEDGER_CHECKSUM_MISMATCH",
          filename: expected.filename,
          detail: "succeeded row checksum does not match approved manifest",
        });
        continue;
      }
      if (latest.source_commit !== (options.sourceCommit ?? PINNED_SOURCE_COMMIT)) {
        blocking.push({
          code: "LEDGER_SOURCE_MISMATCH",
          filename: expected.filename,
          detail: "succeeded row source commit does not match pin",
        });
        continue;
      }
      if (latest.manifest_id !== manifest.manifestId) {
        blocking.push({
          code: "LEDGER_MANIFEST_MISMATCH",
          filename: expected.filename,
          detail: "succeeded row manifest id does not match pin",
        });
        continue;
      }
      succeededMatching += 1;
    }
  }

  if (blocking.length) {
    return {
      action: "refuse",
      ok: false,
      reason: blocking[0].code,
      blocking,
    };
  }

  if (succeededMatching === files.length) {
    return {
      action: "already_complete",
      ok: true,
      reason: "all_71_succeeded_matching",
      succeededMatching,
    };
  }

  if (succeededMatching > 0) {
    return {
      action: "refuse",
      ok: false,
      reason: "LEDGER_PARTIAL_PREFIX",
      detail:
        "partial success is not auto-resumed; recreate staging or obtain explicit resume authorization",
      succeededMatching,
    };
  }

  return {
    action: "refuse",
    ok: false,
    reason: "LEDGER_UNEXPECTED",
    detail: "ledger has rows but none are a matching success prefix",
  };
}

export function createMemoryLedger(seedRows = []) {
  const rows = seedRows.map((r) => ({ ...r }));
  return {
    kind: "memory",
    rows,
    async bootstrap() {
      return { ok: true };
    },
    async load() {
      return rows.slice();
    },
    async recordStarted(entry) {
      const row = {
        id: randomUUID(),
        status: LEDGER_STATUS.STARTED,
        started_at: new Date().toISOString(),
        completed_at: null,
        transaction_outcome: TX_OUTCOME.NOT_STARTED,
        reconciliation_required: false,
        error_redacted: null,
        ...entry,
      };
      rows.push(row);
      return row;
    },
    async markSucceededInTransaction(client, filename, attemptId, phase = "apply") {
      await client.query("SELECT 'ledger-succeeded-in-txn'");
      const row = rows.find(
        (r) => r.filename === filename && r.attempt_id === attemptId,
      );
      if (!row) {
        throw Object.assign(new Error("LEDGER_ROW_MISSING"), {
          code: "LEDGER_ROW_MISSING",
        });
      }
      row.status = LEDGER_STATUS.SUCCEEDED;
      row.completed_at = new Date().toISOString();
      row.execution_phase = phase;
      row.transaction_outcome = TX_OUTCOME.COMMITTED;
      row.reconciliation_required = false;
      return row;
    },
    async recordFailed(filename, attemptId, err, phase, txOutcome) {
      const row = rows.find(
        (r) => r.filename === filename && r.attempt_id === attemptId,
      );
      const redacted = redactError(err);
      if (!row) {
        const created = {
          id: randomUUID(),
          filename,
          attempt_id: attemptId,
          status: LEDGER_STATUS.FAILED,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          execution_phase: phase,
          transaction_outcome: txOutcome ?? TX_OUTCOME.UNKNOWN,
          reconciliation_required: true,
          error_redacted: redacted.message,
        };
        rows.push(created);
        return created;
      }
      row.status = LEDGER_STATUS.FAILED;
      row.completed_at = new Date().toISOString();
      row.execution_phase = phase;
      row.transaction_outcome = txOutcome ?? TX_OUTCOME.ROLLED_BACK;
      row.reconciliation_required = true;
      row.error_redacted = redacted.message;
      return row;
    },
  };
}

export function createSqlLedger(connector) {
  return {
    kind: "sql",
    async bootstrap() {
      await connector.withConnection("ledger-bootstrap", async (client) => {
        await client.query(BOOTSTRAP_SQL);
      });
      return { ok: true };
    },
    async load() {
      return connector.withConnection("ledger-load", async (client) => {
        const result = await client.query(
          `SELECT * FROM ${LEDGER_SCHEMA}.${LEDGER_TABLE} ORDER BY started_at ASC`,
        );
        return result.rows ?? [];
      });
    },
    async recordStarted(entry) {
      return connector.withConnection("ledger-started", async (client) => {
        const result = await client.query(
          `INSERT INTO ${LEDGER_SCHEMA}.${LEDGER_TABLE}
            (seq, filename, content_checksum, source_commit, manifest_id, status,
             started_at, attempt_id, execution_phase, transaction_outcome, reconciliation_required)
           VALUES ($1,$2,$3,$4,$5,$6, now(), $7, $8, $9, false)
           RETURNING *`,
          [
            entry.seq,
            entry.filename,
            entry.content_checksum,
            entry.source_commit,
            entry.manifest_id,
            LEDGER_STATUS.STARTED,
            entry.attempt_id,
            "started",
            TX_OUTCOME.NOT_STARTED,
          ],
        );
        return result.rows[0];
      });
    },
    async markSucceededInTransaction(client, filename, attemptId) {
      const result = await client.query(
        `UPDATE ${LEDGER_SCHEMA}.${LEDGER_TABLE}
            SET status = $1,
                completed_at = now(),
                execution_phase = $2,
                transaction_outcome = $3,
                reconciliation_required = false
          WHERE filename = $4 AND attempt_id = $5
          RETURNING *`,
        [
          LEDGER_STATUS.SUCCEEDED,
          "apply",
          TX_OUTCOME.COMMITTED,
          filename,
          attemptId,
        ],
      );
      return result.rows[0];
    },
    async recordFailed(filename, attemptId, err, phase, txOutcome) {
      const message = redactText(
        err instanceof Error ? err.message : String(err),
      );
      return connector.withConnection("ledger-failed", async (client) => {
        const result = await client.query(
          `UPDATE ${LEDGER_SCHEMA}.${LEDGER_TABLE}
              SET status = $1,
                  completed_at = now(),
                  execution_phase = $2,
                  transaction_outcome = $3,
                  reconciliation_required = true,
                  error_redacted = $4
            WHERE filename = $5 AND attempt_id = $6
            RETURNING *`,
          [
            LEDGER_STATUS.FAILED,
            phase,
            txOutcome ?? TX_OUTCOME.UNKNOWN,
            message,
            filename,
            attemptId,
          ],
        );
        return result.rows[0];
      });
    },
  };
}

export { versionOf, LEDGER_STATUS, TX_OUTCOME };
