/**
 * CoreGrid — Phase 06 Workspace Engine tests: views/filters/sorting/grouping
 * (phase-06-workspace-engine.md §BC–BK).
 */
import { describe, expect, it } from "vitest";
import {
  nextViewVersion,
  validateSavedViews,
  visibleColumns,
  withTenantBoundary,
  type SavedView,
} from "@/lib/workspace-engine/views";

const APPROVED = new Set([
  "learner.status",
  "learner.level",
  "date.range",
  "class.id",
  "learner.name",
]);
const SENSITIVE = new Set(["learner.welfare_note"]);

function view(overrides: Partial<SavedView> = {}): SavedView {
  return {
    header: {
      id: "v-1",
      workspaceId: "ws-1",
      name: "SS2 learners",
      ownerId: "ident-t1",
      createdBy: "ident-t1",
      scope: "personal",
      visibility: "private",
      version: 1,
      createdAt: "2026-09-04T10:00:00.000Z",
    },
    filter: {
      conjunction: "and",
      clauses: [{ field: "learner.level", op: "eq", values: ["SS2"] }],
    },
    sort: [{ field: "learner.name", direction: "asc" }],
    ...overrides,
  };
}

describe("saved views (§BC–BD)", () => {
  it("accepts a valid personal view", () => {
    const result = validateSavedViews([view()], {
      workspaceIds: new Set(["ws-1"]),
      ownerIds: new Set(["ident-t1"]),
      approvedFields: APPROVED,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects duplicate ids and blank names", () => {
    const duplicate = validateSavedViews([view(), view()]);
    expect(duplicate.ok).toBe(false);
    if (!duplicate.ok) expect(duplicate.issues.join(" ")).toContain("duplicate saved view");

    const blankName = validateSavedViews([view({ header: { ...view().header, name: "  " } })]);
    expect(blankName.ok).toBe(false);
  });
});

describe("shared views + ownership (§BE–BF)", () => {
  it("requires shared visibility for non-personal scopes", () => {
    const result = validateSavedViews([
      view({ header: { ...view().header, scope: "role", visibility: "private" } }),
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.join(" ")).toContain("requires shared visibility");
  });

  it("versions views monotonically", () => {
    expect(nextViewVersion(view())).toBe(2);
  });
});

describe("filters (§BG–BH)", () => {
  it("accepts boolean filter combinations over approved fields", () => {
    const result = validateSavedViews(
      [
        view({
          filter: {
            conjunction: "or",
            clauses: [
              { field: "learner.status", op: "eq", values: ["enrolled"] },
              { field: "date.range", op: "between", values: ["2026-01-01", "2026-12-31"] },
            ],
          },
        }),
      ],
      { approvedFields: APPROVED },
    );
    expect(result.ok).toBe(true);
  });

  it("rejects unapproved filter fields (§BH) and unknown operators", () => {
    const badField = validateSavedViews(
      [
        view({
          filter: {
            conjunction: "and",
            clauses: [{ field: "password_hash", op: "eq", values: ["x"] }],
          },
        }),
      ],
      { approvedFields: APPROVED },
    );
    expect(badField.ok).toBe(false);
    if (!badField.ok) expect(badField.issues.join(" ")).toContain("not approved");

    const badOp = validateSavedViews([
      view({
        filter: {
          conjunction: "and",
          clauses: [{ field: "learner.status", op: "regex" as never, values: [] }],
        },
      }),
    ]);
    expect(badOp.ok).toBe(false);
  });

  it("composes the tenant-boundary filter defensively (§BH)", () => {
    const scoped = withTenantBoundary(view().filter, "tenant_id", "tenant:1");
    expect(scoped.clauses[0]).toEqual({ field: "tenant_id", op: "eq", values: ["tenant:1"] });
    expect(scoped.clauses).toHaveLength(2);
    expect(withTenantBoundary(null, "tenant_id", "tenant:1").clauses).toHaveLength(1);
  });
});

describe("sorting/grouping/columns (§BI–BK)", () => {
  it("rejects unapproved sort and grouping fields (§BI/BJ)", () => {
    const result = validateSavedViews(
      [
        view({
          sort: [{ field: "secret_score", direction: "desc" }],
          grouping: [{ field: "secret_group" }],
        }),
      ],
      { approvedFields: APPROVED },
    );
    expect(result.ok).toBe(false);
    const joined = result.ok ? "" : result.issues.join(" ");
    expect(joined).toContain('sort field "secret_score"');
    expect(joined).toContain('grouping field "secret_group"');
  });

  it("keeps sensitive columns policy-controlled (§BK)", () => {
    const withSensitive = view({
      columns: [
        { field: "learner.name", visible: true },
        { field: "learner.welfare_note", visible: true },
      ],
    });
    const blocked = validateSavedViews([withSensitive], { sensitiveFields: SENSITIVE });
    expect(blocked.ok).toBe(false);

    const granted = validateSavedViews([withSensitive], { sensitiveFields: SENSITIVE }, true);
    expect(granted.ok).toBe(true);

    expect(visibleColumns(withSensitive.columns, SENSITIVE)).toEqual(["learner.name"]);
  });
});
