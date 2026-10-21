/**
 * Sherivs Scholar — Phase 10 Communication Platform unit tests
 * (communication-conversation).
 *
 * Validates:
 * - Conversation contract creation (F.3).
 * - Conversation state transitions.
 * - Tenant-bounded participant membership (DN).
 * - Read receipts and independent acknowledgement (BX, BY).
 */

import { describe, expect, it } from "vitest";
import { tenantId } from "@/lib/tenant-core";
import {
  createConversation,
  transitionConversation,
  canAddParticipant,
  markReadReceipt,
  recordAcknowledgement,
  type Conversation,
  type ReadReceipt,
} from "@/lib/communication-conversation";

const TENANT_A = tenantId("tenant-a");
const TENANT_B = tenantId("tenant-b");
const NOW = "2026-01-01T00:00:00Z";

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  const created = createConversation({
    tenantId: TENANT_A,
    participants: ["user-1", "user-2"],
    channel: "in_app",
    subject: "Project sync",
    now: NOW,
  });
  if (!created.ok) throw new Error("fixture failed");
  return { ...created.conversation, ...overrides };
}

describe("createConversation (F.3)", () => {
  it("creates an active conversation with two participants", () => {
    const conversation = makeConversation();
    expect(conversation.state).toBe("active");
    expect(conversation.participants).toHaveLength(2);
    expect(conversation.lastActivityAt).toBe(NOW);
  });

  it("rejects fewer than two participants", () => {
    const result = createConversation({
      tenantId: TENANT_A,
      participants: ["user-1"],
      channel: "in_app",
      subject: "Solo?",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects duplicate participants", () => {
    const result = createConversation({
      tenantId: TENANT_A,
      participants: ["user-1", "user-1"],
      channel: "in_app",
      subject: "Dupe",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty subject", () => {
    const result = createConversation({
      tenantId: TENANT_A,
      participants: ["user-1", "user-2"],
      channel: "in_app",
      subject: "",
      now: NOW,
    });
    expect(result.ok).toBe(false);
  });
});

describe("transitionConversation", () => {
  it("supports active -> archived -> active -> locked -> archived", () => {
    const archived = transitionConversation(makeConversation(), "archived", NOW);
    if (!archived.ok) throw new Error("fixture failed");
    const reactivated = transitionConversation(archived.conversation, "active", NOW);
    if (!reactivated.ok) throw new Error("fixture failed");
    const locked = transitionConversation(reactivated.conversation, "locked", NOW);
    if (!locked.ok) throw new Error("fixture failed");
    const backToArchived = transitionConversation(locked.conversation, "archived", NOW);
    expect(backToArchived.ok).toBe(true);
  });

  it("rejects deleted -> active (terminal)", () => {
    const conversation = makeConversation({ state: "deleted" });
    const result = transitionConversation(conversation, "active", NOW);
    expect(result.ok).toBe(false);
  });
});

describe("canAddParticipant (DN)", () => {
  it("allows adding participants from the conversation's tenant only", () => {
    const conversation = makeConversation();
    expect(canAddParticipant(conversation, TENANT_A)).toBe(true);
    expect(canAddParticipant(conversation, TENANT_B)).toBe(false);
    expect(canAddParticipant(conversation, null)).toBe(false);
  });
});

describe("Read receipts and acknowledgement (BX, BY)", () => {
  it("moves read state forward and never regresses it", () => {
    let receipt: ReadReceipt | null = null;
    receipt = markReadReceipt(receipt, "msg-1", "user-1", "delivered", NOW);
    receipt = markReadReceipt(receipt, "msg-1", "user-1", "read", NOW);
    expect(receipt?.state).toBe("read");
    // An "unread" attempt does not regress an existing receipt (privacy, BX).
    receipt = markReadReceipt(receipt, "msg-1", "user-1", "unread", NOW);
    expect(receipt?.state).toBe("read");
  });

  it("records acknowledgement independently of read state (BY)", () => {
    const ack = recordAcknowledgement("msg-1", "user-1", "admin-1", NOW);
    expect(ack.messageId).toBe("msg-1");
    expect(ack.acknowledgedAt).toBe(NOW);
    expect(ack.recordedBy).toBe("admin-1");
  });
});
