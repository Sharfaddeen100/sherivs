/** Server-side AAL2 gate for internal (super admin / staff) server functions. */
import { assertAal2, mfaRequiredFromEnv } from "@/lib/security/mfa-policy";

export function assertInternalAal2(claims: { aal?: unknown } | null | undefined): void {
  assertAal2(claims, mfaRequiredFromEnv(process.env.SHERIVS_MFA_REQUIRED));
}
