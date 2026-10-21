/**
 * Sherivs Scholar — Cluster O core tests (§131–132, 116–118, 176–180).
 * Operation contracts, AI context object, AI safety boundary, evolution guards.
 */
import { describe, expect, it } from "vitest";
import {
  resolveOperationContract,
  validateOperationContracts,
  type OperationContract,
} from "@/lib/scholar/api-contracts";
import { buildAiContext } from "@/lib/scholar/ai-context";
import { aiMayCreateStudentRecord, decideAiAction, type AiProposal } from "@/lib/scholar/ai-safety";
import {
  BOUNDARY_CONCERNS,
  PHASE_BOUNDARY_OWNERS,
  assertNonDestructiveEvolution,
  boundaryOwner,
  curriculumHistoryIssues,
} from "@/lib/scholar/boundaries";

describe("api-contracts (§131–132, O1)", () => {
  const contracts: OperationContract[] = [
    {
      id: "scholar.config.publish",
      kind: "command",
      surface: "configuration",
      inputShape: "PublishConfigInput",
      outputKind: "BlueprintVersion",
      requiresAuthorization: true,
    },
    {
      id: "scholar.attendance.mark",
      kind: "event",
      surface: "attendance",
      inputShape: "AttendanceMarkInput",
      outputKind: "KernelEvent",
      requiresAuthorization: true,
    },
    {
      id: "scholar.grading.resolve",
      kind: "query",
      surface: "assessment",
      inputShape: "GradeQuery",
      outputKind: "GradeResult",
      requiresAuthorization: true,
    },
  ];

  it("accepts declared contracts and resolves by id", () => {
    expect(validateOperationContracts(contracts)).toEqual([]);
    expect(resolveOperationContract(contracts, "scholar.attendance.mark")?.surface).toBe(
      "attendance",
    );
    expect(resolveOperationContract(contracts, "missing")).toBe(null);
  });

  it("rejects unauthenticated operations — every Scholar op requires auth", () => {
    const issues = validateOperationContracts([
      {
        id: "scholar.x",
        kind: "query",
        surface: "assessment",
        inputShape: "A",
        outputKind: "B",
        requiresAuthorization: false,
      },
    ]);
    expect(issues.join(" ")).toContain("requires authorization");
  });
});

describe("ai-context (§116–118, O3)", () => {
  it("builds a bounded AI context object from server-resolved roles", () => {
    const context = buildAiContext({
      tenantId: "tenant-1",
      identityId: "ident-ai-1",
      roles: ["school_admin"],
      subjectRef: "cls-1a",
      purpose: "summarize attendance",
    });
    if ("issue" in context) throw new Error("unexpected issue");
    expect(context.tenantId).toBe("tenant-1");
    expect(context.roles).toEqual(["school_admin"]);
  });

  it("refuses contexts without a tenant, identity or purpose", () => {
    expect(
      buildAiContext({ tenantId: "", identityId: "x", roles: [], purpose: "p" }),
    ).toHaveProperty("issue");
    expect(
      buildAiContext({ tenantId: "t", identityId: "", roles: [], purpose: "p" }),
    ).toHaveProperty("issue");
    expect(
      buildAiContext({ tenantId: "t", identityId: "x", roles: [], purpose: "" }),
    ).toHaveProperty("issue");
  });
});

describe("ai-safety (§117, O3)", () => {
  it("denies AI mutations of authoritative state by default", () => {
    const proposal: AiProposal = {
      action: "alter_grade",
      targetKind: "grade",
      summary: "Bump learner grade",
    };
    const decision = decideAiAction(proposal);
    expect(decision.allowed).toBe(false);
    expect(decision.reasons.join(" ")).toContain("may not be executed by AI");
  });

  it("allows read/summarize/generate actions with explanations", () => {
    expect(
      decideAiAction({ action: "summarize", targetKind: "attendance", summary: "Monthly summary" })
        .allowed,
    ).toBe(true);
    expect(
      decideAiAction({ action: "read", targetKind: "register", summary: "Read register" }).allowed,
    ).toBe(true);
    expect(
      decideAiAction({ action: "generate", targetKind: "lesson-plan", summary: "" }).allowed,
    ).toBe(false);
  });

  it("never lets AI create a student record (§117)", () => {
    expect(
      aiMayCreateStudentRecord({ targetKind: "student", summary: "Create a new student" }),
    ).toBe(false);
  });
});

describe("boundaries + evolution (§142–153, 176–180, O2/O4/O8)", () => {
  it("records external phase ownership for every declared boundary", () => {
    expect(PHASE_BOUNDARY_OWNERS.digital_twin).toBe("P16");
    expect(PHASE_BOUNDARY_OWNERS.schedule_optimization).toBe("P12");
    expect(boundaryOwner("digital_twin")).toEqual(["P16"]);
    expect(boundaryOwner("not_a_boundary")).toEqual([]);
    expect(BOUNDARY_CONCERNS).toContain("visual_ui");
  });

  it("rejects non-destructive evolution violations (§178/§180)", () => {
    expect(
      assertNonDestructiveEvolution({
        scope: "curriculum",
        before: ["2023", "2024"],
        after: ["2024"],
      }),
    ).toHaveLength(1);
    expect(
      assertNonDestructiveEvolution({
        scope: "structure",
        before: ["form1"],
        after: ["form1", "form2"],
      }),
    ).toEqual([]);
  });

  it("reuses the curriculum history-preservation contract", () => {
    expect(curriculumHistoryIssues(["2023", "2024"], ["2024"])).toHaveLength(1);
    expect(curriculumHistoryIssues(["2023"], ["2023", "2024"])).toEqual([]);
  });
});
