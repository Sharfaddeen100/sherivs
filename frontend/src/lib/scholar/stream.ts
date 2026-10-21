/**
 * Sherivs Scholar — streams (Phase-04 §24).
 *
 * Streams are configuration: science, arts, commercial, technical, vocational
 * and agricultural are the documented vocabulary of African secondary schools,
 * and custom streams are always permitted. A stream has a name, a code and a
 * kind — nothing else is presumed about it.
 */

export type StreamKind =
  "science" | "arts" | "commercial" | "technical" | "vocational" | "agricultural" | "custom";

export const STREAM_KINDS: readonly StreamKind[] = [
  "science",
  "arts",
  "commercial",
  "technical",
  "vocational",
  "agricultural",
  "custom",
] as const;

export interface StreamDefinition {
  code: string;
  name: string;
  kind: StreamKind;
  sortOrder?: number;
}

export type StreamsValidation =
  { ok: true; streams: StreamDefinition[] } | { ok: false; issues: string[] };

export function validateStreams(input: readonly StreamDefinition[]): StreamsValidation {
  const issues: string[] = [];
  const codes = new Set<string>();

  for (const stream of input) {
    const code = stream.code.trim();
    if (!code) {
      issues.push("a stream requires a code");
      continue;
    }
    if (codes.has(code)) issues.push(`duplicate stream code "${code}"`);
    codes.add(code);
    if (!stream.name.trim()) issues.push(`stream "${code}": name is required`);
    if (!STREAM_KINDS.includes(stream.kind)) {
      issues.push(`stream "${code}": kind must be one of ${STREAM_KINDS.join(", ")}`);
    }
  }

  return issues.length === 0 ? { ok: true, streams: [...input] } : { ok: false, issues };
}
