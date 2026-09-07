/**
 * CoreGrid — legacy identity-store membership kinds (P02/P08 domain boundary).
 *
 * This file is NOT UI. It only declares the identity-store `AppRole` union
 * that auth/session consumers still read. Dashboard redirects and display
 * labels were removed in the de-hardcoding wave: the post-login landing and
 * chrome are derived from workspace navigation contributions resolved
 * against authorized capabilities (`workspace-engine/nav-catalog.ts`).
 * New work should migrate to P02 identity + P08 authorization contracts.
 */
export type AppRole =
  | "super_admin"
  | "hq"
  | "admin"
  | "principal"
  | "teacher"
  | "bursar"
  | "parent"
  | "student"
  | "driver";
