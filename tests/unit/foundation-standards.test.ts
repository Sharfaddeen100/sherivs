/**
 * Sherivs — Phase 01 foundation standards module (P01-4 / L4 projection).
 *
 * The foundation's standards must be readable by a surface and must match the
 * contract the phases already agreed on — never a second source of prose.
 */
import { describe, expect, it } from "vitest";

import {
  FOUNDATION_CAPABILITY_ID,
  foundationStandardsSnapshot,
  isFoundationStandard,
} from "@/lib/foundation-standards";
import { phaseContractById } from "@/lib/kernel/phase-contracts";

describe("Phase 01 — foundation standards project the real contract", () => {
  it("exposes the capability Phase 01 actually owns", () => {
    const contract = phaseContractById("01");
    expect(contract).toBeTruthy();
    expect(FOUNDATION_CAPABILITY_ID).toBe("foundation-standards-config-secrets-ci");
  });

  it("derives every standard from the phase-01 contract, not from a copy", () => {
    const contract = phaseContractById("01");
    const snapshot = foundationStandardsSnapshot();
    const provided = (contract?.contracts.provides ?? []).map((ref) => ref.id);

    expect(snapshot.standards.map((standard) => standard.id)).toEqual(provided);
    expect(snapshot.standards.length).toBeGreaterThan(0);
    for (const standard of snapshot.standards) {
      expect(standard.description.length, `${standard.id} needs a description`).toBeGreaterThan(0);
      expect(snapshot.guarantees).toContain(`${standard.id} — ${standard.description}`);
    }
  });

  it("recognises declared verification commands and rejects anything else", () => {
    expect(isFoundationStandard("npm:verify")).toBe(true);
    expect(isFoundationStandard("npm:verify:secrets")).toBe(true);
    expect(isFoundationStandard("npm:not-a-contract")).toBe(false);
  });
});
