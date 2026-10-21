/** Minimal in-memory postgrest-like fake for NDPA unit tests. */
export type Row = Record<string, unknown>;

export function createFakeDb(seed: Record<string, Row[]> = {}) {
  const tables: Record<string, Row[]> = {};
  for (const [k, v] of Object.entries(seed)) tables[k] = v.map((r) => ({ ...r }));
  const log: { op: string; table: string; filters: [string, unknown][]; patch?: Row }[] = [];
  let seq = 0;

  function from(table: string) {
    tables[table] ??= [];
    let op: "select" | "insert" | "update" | "delete" = "select";
    let patch: Row | Row[] | undefined;
    const filters: [string, unknown][] = [];
    let inFilter: [string, unknown[]] | null = null;

    const match = (r: Row) =>
      filters.every(([c, v]) => r[c] === v) && (!inFilter || inFilter[1].includes(r[inFilter[0]]));

    function exec(single: boolean) {
      let data: Row[] = [];
      if (op === "insert") {
        const rows = (Array.isArray(patch) ? patch : [patch as Row]).map((r) => ({
          id: `gen-${++seq}`,
          ...r,
        }));
        tables[table].push(...rows);
        log.push({ op, table, filters: [], patch: rows[0] });
        data = rows;
      } else if (op === "update") {
        data = tables[table].filter(match);
        for (const r of data) Object.assign(r, patch as Row);
        log.push({ op, table, filters: [...filters], patch: patch as Row });
      } else if (op === "delete") {
        data = tables[table].filter(match);
        tables[table] = tables[table].filter((r) => !match(r));
        log.push({ op, table, filters: [...filters] });
      } else {
        data = tables[table].filter(match).map((r) => ({ ...r }));
      }
      if (single) return { data: data[0] ?? null, error: null };
      return { data, error: null };
    }

    const b: Record<string, unknown> = {
      select: () => b,
      insert: (p: Row | Row[]) => ((op = "insert"), (patch = p), b),
      update: (p: Row) => ((op = "update"), (patch = p), b),
      delete: () => ((op = "delete"), b),
      eq: (c: string, v: unknown) => (filters.push([c, v]), b),
      in: (c: string, v: unknown[]) => ((inFilter = [c, v]), b),
      maybeSingle: async () => exec(true),
      single: async () => exec(true),
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
        Promise.resolve(exec(false)).then(res, rej),
    };
    return b;
  }
  return { from, tables, log } as unknown as {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    from(t: string): any;
    tables: Record<string, Row[]>;
    log: { op: string; table: string; filters: [string, unknown][]; patch?: Row }[];
  };
}
