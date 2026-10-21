/**
 * Sign-in page copy and capabilities per host (console.sherivs.com vs the
 * organization app). Presentation only, never authorization: the console stays
 * gated after sign-in by the console host gate and its own role / MFA guards.
 */
import { PLATFORM_NAME } from "@/lib/platform";
import type { ExperienceHostKind } from "./experience-host";

export type AuthPageMode = "signin" | "signup";

export interface AuthPageExperience {
  /** Heading override; null keeps the mode-based heading. */
  heading: string | null;
  subtext: string;
  /** Self-service sign-up. Console staff are created only by invite. */
  allowSignup: boolean;
}

export function authPageExperience(hostKind: ExperienceHostKind): AuthPageExperience {
  if (hostKind === "internal") {
    return {
      heading: `${PLATFORM_NAME} Console`,
      subtext: `Staff sign-in. Access is restricted to ${PLATFORM_NAME} staff.`,
      allowSignup: false,
    };
  }
  return {
    heading: null,
    subtext: `Sign in to ${PLATFORM_NAME} — your organization's operating environment.`,
    allowSignup: true,
  };
}

/** The mode actually used: sign-up is never honoured where it is not allowed. */
export function effectiveAuthMode(
  requested: AuthPageMode | string | null | undefined,
  experience: Pick<AuthPageExperience, "allowSignup">,
): AuthPageMode {
  return requested === "signup" && experience.allowSignup ? "signup" : "signin";
}
