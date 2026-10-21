import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * The drift-watch workflow pipes verify-domain-neutrality through `tee` and
 * reads the final STATUS= line. process.exit() after ~2,000 lines of output
 * drops stdout still queued for the pipe, so the verdict went missing and the
 * baseline-tamper tripwire failed as UNREADABLE. The verdict path must set
 * process.exitCode and let stdout drain.
 */
describe("domain-neutrality guard flushes its verdict", () => {
  const src = readFileSync("scripts/verify-domain-neutrality.mjs", "utf8");
  const verdictSection = src.slice(src.indexOf("if (NEW.length > 0)"));

  it("does not call process.exit() on the verdict path", () => {
    expect(verdictSection).toContain("STATUS=PASS");
    expect(verdictSection).toContain("STATUS=FAIL");
    expect(verdictSection).not.toMatch(/process\.exit\(/);
    expect(verdictSection).toMatch(/process\.exitCode = 1/);
  });
});
