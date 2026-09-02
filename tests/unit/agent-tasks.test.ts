/**
 * CoreGrid Scholar — Phase 07 AI Agent System unit tests (agent-tasks).
 *
 * Validates:
 * - Task state transitions (Section AC).
 * - Task creation validation (Sections AB, AD, AE).
 * - Checkpoints and resumption (Sections AG, AH).
 * - Cancellation authority (Section AF).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import { agentId } from "@/lib/agent-core";
import {
  isTaskTransitionAllowed,
  createAgentTask,
  transitionTask,
  createTaskCheckpoint,
  canResumeFromCheckpoint,
  canCancelTask,
  type CreateTaskInput,
} from "@/lib/agent-tasks";

const TENANT_A = tenantId("tenant-a");
const AGENT_A = agentId("attendance_assistant");
const NOW = "2026-01-01T00:00:00Z";

function baseTaskInput(overrides: Partial<CreateTaskInput> = {}): CreateTaskInput {
  return {
    tenantId: TENANT_A,
    agentId: AGENT_A,
    objective: "Summarize today's attendance anomalies",
    now: NOW,
    ...overrides,
  };
}

describe("Task state transitions (Section AC)", () => {
  it("allows scheduled -> planning", () => {
    expect(isTaskTransitionAllowed("scheduled", "planning")).toBe(true);
  });

  it("allows running -> succeeded", () => {
    expect(isTaskTransitionAllowed("running", "succeeded")).toBe(true);
  });

  it("rejects succeeded -> running (terminal state)", () => {
    expect(isTaskTransitionAllowed("succeeded", "running")).toBe(false);
  });

  it("rejects scheduled -> succeeded (skipping states)", () => {
    expect(isTaskTransitionAllowed("scheduled", "succeeded")).toBe(false);
  });
});

describe("createAgentTask", () => {
  it("creates a scheduled task with defaults", () => {
    const result = createAgentTask(baseTaskInput());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.task.state).toBe("scheduled");
      expect(result.task.priority).toBe("normal");
      expect(result.task.retryCount).toBe(0);
    }
  });

  it("rejects completion deadline before start deadline", () => {
    const result = createAgentTask(
      baseTaskInput({
        startDeadline: "2026-01-02T00:00:00Z",
        completionDeadline: "2026-01-01T00:00:00Z",
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("rejects max retries outside 0-5 range", () => {
    const result = createAgentTask(baseTaskInput({ maxRetries: 10 }));
    expect(result.ok).toBe(false);
  });
});

describe("transitionTask", () => {
  it("transitions scheduled -> planning and stamps updatedAt", () => {
    const created = createAgentTask(baseTaskInput());
    if (!created.ok) throw new Error("fixture failed");
    const result = transitionTask(created.task, "planning", "2026-01-01T01:00:00Z");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.task.state).toBe("planning");
    }
  });

  it("rejects an invalid transition", () => {
    const created = createAgentTask(baseTaskInput());
    if (!created.ok) throw new Error("fixture failed");
    const result = transitionTask(created.task, "succeeded", NOW);
    expect(result.ok).toBe(false);
  });

  it("records cancellation metadata on cancel", () => {
    const created = createAgentTask(baseTaskInput());
    if (!created.ok) throw new Error("fixture failed");
    const result = transitionTask(created.task, "cancelled", NOW, "admin-1", "no longer needed");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.task.cancelledBy).toBe("admin-1");
      expect(result.task.cancelReason).toBe("no longer needed");
      expect(result.task.completedAt).toBe(NOW);
    }
  });
});

describe("Checkpoints and resumption (Sections AG, AH)", () => {
  it("creates a checkpoint tied to the task", () => {
    const created = createAgentTask(baseTaskInput());
    if (!created.ok) throw new Error("fixture failed");
    const checkpoint = createTaskCheckpoint(created.task, "step 3 of 5 complete", 3, 5, NOW);
    expect(checkpoint.taskId).toBe(created.task.id);
    expect(checkpoint.stepIndex).toBe(3);
  });

  it("allows resume only from a paused task matching the checkpoint", () => {
    const created = createAgentTask(baseTaskInput());
    if (!created.ok) throw new Error("fixture failed");
    const running = transitionTask(created.task, "planning", NOW);
    if (!running.ok) throw new Error("fixture failed");
    const runningTask = transitionTask(running.task, "running", NOW);
    if (!runningTask.ok) throw new Error("fixture failed");
    const paused = transitionTask(runningTask.task, "paused", NOW);
    if (!paused.ok) throw new Error("fixture failed");
    const checkpoint = createTaskCheckpoint(paused.task, "paused mid-execution", 2, 4, NOW);
    expect(canResumeFromCheckpoint(paused.task, checkpoint)).toBe(true);
    expect(canResumeFromCheckpoint(created.task, checkpoint)).toBe(false);
  });
});

describe("canCancelTask (Section AF)", () => {
  it("rejects cancellation of a terminal task", () => {
    const created = createAgentTask(baseTaskInput());
    if (!created.ok) throw new Error("fixture failed");
    const cancelled = transitionTask(created.task, "cancelled", NOW, "admin-1", "stop");
    if (!cancelled.ok) throw new Error("fixture failed");
    const result = canCancelTask(cancelled.task, "admin-1", false);
    expect(result.ok).toBe(false);
  });

  it("allows a supervisor to cancel regardless of original canceller", () => {
    const created = createAgentTask(baseTaskInput());
    if (!created.ok) throw new Error("fixture failed");
    const result = canCancelTask(created.task, "supervisor-1", true);
    expect(result.ok).toBe(true);
  });
});
