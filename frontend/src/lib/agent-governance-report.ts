/**
 * CoreGrid — Phase 07 AI Agent System: governance report.
 *
 * The phase's governing rule: "agents are execution entities; domain phases remain
 * owners of domain truth." This module reports what the agent system enforces, and
 * EXERCISES the two state machines it can drive deterministically — task
 * transitions and loop safety — so the surface cannot claim a rule the code does
 * not enforce.
 */
import {
  TASK_STATES,
  TASK_TRANSITIONS,
  isTaskTransitionAllowed,
  type TaskState,
} from "@/lib/agent-tasks";
import { checkLoopSafety, type LoopMonitorState } from "@/lib/agent-plans";

export interface AgentGovernanceRule {
  id: string;
  rule: string;
  /** The module that enforces it, and the suite that proves it. */
  enforcedBy: string;
  provedBy: string;
}

/** Rules the agent system enforces today, each tied to its implementation. */
export function agentGovernanceRules(): readonly AgentGovernanceRule[] {
  return [
    {
      id: "task-state-machine",
      rule: "An agent task may only move along declared transitions; anything else is refused.",
      enforcedBy: "frontend/src/lib/agent-tasks.ts",
      provedBy: "tests/unit/agent-tasks.test.ts",
    },
    {
      id: "memory-category-and-classification",
      rule: "Agent memory reads are gated by category and by a data-classification ceiling.",
      enforcedBy: "frontend/src/lib/agent-memory.ts",
      provedBy: "tests/unit/agent-memory.test.ts",
    },
    {
      id: "memory-trust",
      rule: "Only system-trusted instructions are treated as instructions; external content is data.",
      enforcedBy: "frontend/src/lib/agent-memory.ts",
      provedBy: "tests/unit/agent-memory.test.ts",
    },
    {
      id: "plan-validation",
      rule: "A plan step may only use tools the agent is allowed to call or delegate.",
      enforcedBy: "frontend/src/lib/agent-plans.ts",
      provedBy: "tests/unit/agent-plans.test.ts",
    },
    {
      id: "loop-safety",
      rule: "Runaway reasoning stops: repeated calls, repeated plans, repeated failures and total steps are bounded.",
      enforcedBy: "frontend/src/lib/agent-plans.ts",
      provedBy: "tests/unit/agent-plans.test.ts",
    },
    {
      id: "tenant-scoped-agents",
      rule: "Agent memory and executions are tenant-scoped; authority comes from Phase 02/08, never from the agent.",
      enforcedBy: "frontend/src/lib/security-agent-controls.ts",
      provedBy: "tests/unit/security-agent-controls.test.ts",
    },
  ];
}

export interface AgentCheck {
  id: string;
  proves: string;
  ok: boolean;
  detail: string;
}

/** Drive the two agent state machines with real inputs. */
export function runAgentGovernanceCheck(): readonly AgentCheck[] {
  const checks: AgentCheck[] = [];

  // Task transitions: the declared transition is allowed, an undeclared pair is not.
  const declared = TASK_TRANSITIONS.find((transition) => transition.allowed);
  const refusal = findRefusedPair();
  checks.push({
    id: "task-transition",
    proves: "a declared transition is permitted and an undeclared one is refused",
    ok:
      declared !== undefined &&
      isTaskTransitionAllowed(declared.from, declared.to) === true &&
      refusal !== undefined &&
      isTaskTransitionAllowed(refusal.from, refusal.to) === false,
    detail: declared
      ? `allowed=${declared.from}->${declared.to} refused=${refusal?.from}->${refusal?.to}`
      : "no declared transition found",
  });

  // Loop safety: at the step ceiling the monitor refuses to continue.
  const atCeiling: LoopMonitorState = {
    repeatedToolCallThreshold: 3,
    repeatedPlanThreshold: 3,
    repeatedFailureThreshold: 3,
    currentRetries: {},
    currentFailures: {},
    totalSteps: 10,
    maxTotalSteps: 10,
  };
  const underCeiling: LoopMonitorState = { ...atCeiling, totalSteps: 1 };
  const refused = checkLoopSafety(atCeiling, "tool-call-1", false, "2026-09-14T10:00:00.000Z");
  const allowed = checkLoopSafety(underCeiling, "tool-call-1", false, "2026-09-14T10:00:00.000Z");
  checks.push({
    id: "loop-safety",
    proves: "reasoning stops at the declared step ceiling and continues below it",
    ok: refused.safe === false && allowed.safe === true,
    detail: `atCeiling=${refused.safe === false ? "refused" : "allowed"} below=${
      allowed.safe ? "allowed" : "refused"
    }`,
  });

  return checks;
}

function findRefusedPair(): { from: TaskState; to: TaskState } | undefined {
  for (const from of TASK_STATES) {
    for (const to of TASK_STATES) {
      if (from === to) continue;
      if (!isTaskTransitionAllowed(from, to)) return { from, to };
    }
  }
  return undefined;
}

export interface AgentGovernanceReport {
  states: readonly TaskState[];
  declaredTransitions: number;
  rules: readonly AgentGovernanceRule[];
  checks: readonly AgentCheck[];
  passed: number;
  failed: number;
  healthy: boolean;
  failingChecks: readonly string[];
}

export function agentGovernanceReport(): AgentGovernanceReport {
  const checks = runAgentGovernanceCheck();
  const failing = checks.filter((check) => !check.ok).map((check) => check.id);
  return {
    states: TASK_STATES,
    declaredTransitions: TASK_TRANSITIONS.filter((transition) => transition.allowed).length,
    rules: agentGovernanceRules(),
    checks,
    passed: checks.length - failing.length,
    failed: failing.length,
    healthy: failing.length === 0,
    failingChecks: failing,
  };
}
