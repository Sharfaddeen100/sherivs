/**
 * CoreGrid Scholar runtime → kernel reality-flow tests.
 *
 * Scholar entities, relationships and observations flow through the universal
 * kernel draft contracts, each type/relation validated against the Scholar
 * ontology. The kernel validates structure; the runtime owns the vocabulary.
 */

import { describe, expect, it } from "vitest";
import {
  SCHOLAR_ENTITY_TYPES,
  SCHOLAR_RELATIONSHIP_TYPES,
  scholarEntityDraft,
  scholarObservationDraft,
  scholarRelationshipDraft,
} from "@/lib/runtime/scholar-reality";

const NOW = "2026-09-03T00:00:00.000Z";

describe("Scholar reality flows — entities", () => {
  it("records every ontology entity type through the kernel entity contract", () => {
    for (const entityType of SCHOLAR_ENTITY_TYPES) {
      const draft = scholarEntityDraft(entityType, { tenantId: "tenant-1" }, NOW);
      expect(draft.entity_type).toBe(entityType);
      expect(draft.classification).toBe("INTERNAL");
      expect(draft.recorded_at).toBe(NOW);
    }
  });

  it("rejects entity types not declared in the Scholar ontology", () => {
    expect(() => scholarEntityDraft("universe", {}, NOW)).toThrow(
      /not declared in the Scholar ontology/,
    );
  });
});

describe("Scholar reality flows — relationships", () => {
  it("records every ontology relationship type between distinct entities", () => {
    for (const relationType of SCHOLAR_RELATIONSHIP_TYPES) {
      const draft = scholarRelationshipDraft(
        relationType,
        { sourceEntityId: "entity-a", targetEntityId: "entity-b", tenantId: "tenant-1" },
        NOW,
      );
      expect(draft.relation_type).toBe(relationType);
      expect(draft.source_entity_id).toBe("entity-a");
      expect(draft.target_entity_id).toBe("entity-b");
    }
  });

  it("rejects undeclared and self relationships", () => {
    expect(() =>
      scholarRelationshipDraft("rules", { sourceEntityId: "a", targetEntityId: "b" }, NOW),
    ).toThrow(/not declared in the Scholar ontology/);
    expect(() =>
      scholarRelationshipDraft("enrolls", { sourceEntityId: "a", targetEntityId: "a" }, NOW),
    ).toThrow(/must differ/);
  });
});

describe("Scholar reality flows — observations", () => {
  it("records observations about ontology entities through the kernel contract", () => {
    const draft = scholarObservationDraft(
      "learner",
      "observed",
      { subjectEntityId: "learner-1", confidence: 0.9, tenantId: "tenant-1" },
      NOW,
    );
    expect(draft.kind).toBe("observed");
    expect(draft.subject_entity_id).toBe("learner-1");
    expect(draft.recorded_at).toBe(NOW);
  });

  it("rejects undeclared subjects and invalid kinds", () => {
    expect(() =>
      scholarObservationDraft("planet", "observed", { subjectEntityId: "x" }, NOW),
    ).toThrow(/not declared in the Scholar ontology/);
    expect(() =>
      scholarObservationDraft("learner", "verified" as never, { subjectEntityId: "x" }, NOW),
    ).toThrow(/kind/);
  });
});
