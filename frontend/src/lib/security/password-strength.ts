import { PASSWORD_MIN_LENGTH, passwordPolicyError } from "./password-policy";

/**
 * Live password-strength evaluation for the new-password forms. The rules
 * mirror password-policy.ts (and the Supabase Auth settings): the meter is
 * guidance, passwordPolicyError() is the gate, GoTrue is the authority.
 */

/** Very common passwords / patterns refused client-side even if they meet the rules. */
const COMMON = new Set(
  [
    "password", "password1", "password12", "password123", "password1234", "passw0rd",
    "qwerty", "qwerty123", "qwertyuiop", "1q2w3e4r", "1qaz2wsx", "abc123", "abcd1234",
    "iloveyou", "welcome", "welcome1", "welcome123", "admin", "admin123", "administrator",
    "letmein", "monkey", "dragon", "football", "baseball", "sunshine", "princess",
    "starwars", "trustno1", "superman", "batman", "master", "changeme", "default",
    "123456", "1234567", "12345678", "123456789", "1234567890", "111111", "000000",
    "nigeria", "nigeria123", "lagos", "lagos123", "abuja123", "school", "school123",
    "teacher", "teacher123", "student", "student123", "sherivs", "sherivs123",
  ].map((s) => s.toLowerCase()),
);

/** Strip a trailing run of digits/symbols so "Password123!" is caught as "password". */
function core(pw: string): string {
  return pw.toLowerCase().replace(/[^a-z]+$/g, "").replace(/^[^a-z]+/g, "");
}

export function isCommonPassword(pw: string): boolean {
  const lower = pw.toLowerCase();
  if (COMMON.has(lower) || COMMON.has(core(pw))) return true;
  if (/^(.)\1+$/.test(pw)) return true; // aaaaaaaaaa
  if ("01234567890123456789".includes(pw) || "abcdefghijklmnopqrstuvwxyz".includes(lower)) return true;
  return false;
}

export type PasswordRule = { id: string; label: string; ok: boolean };

export function passwordRules(pw: string, email?: string): PasswordRule[] {
  const local = email?.split("@")[0]?.toLowerCase();
  return [
    { id: "length", label: `At least ${PASSWORD_MIN_LENGTH} characters`, ok: pw.length >= PASSWORD_MIN_LENGTH },
    { id: "lower", label: "A lowercase letter", ok: /[a-z]/.test(pw) },
    { id: "upper", label: "An uppercase letter", ok: /[A-Z]/.test(pw) },
    { id: "digit", label: "A number", ok: /[0-9]/.test(pw) },
    {
      id: "email",
      label: "Doesn't contain your email name",
      ok: !(local && local.length >= 4 && pw.toLowerCase().includes(local)),
    },
    { id: "common", label: "Not a common password", ok: pw.length > 0 && !isCommonPassword(pw) },
  ];
}

export type Strength = { score: 0 | 1 | 2 | 3 | 4; label: string; acceptable: boolean };

export function passwordStrength(pw: string, email?: string): Strength {
  if (!pw) return { score: 0, label: "", acceptable: false };
  const acceptable = newPasswordError(pw, email) === null;
  if (!acceptable) {
    const passed = passwordRules(pw, email).filter((r) => r.ok).length;
    return { score: passed >= 4 ? 1 : 0, label: "Too weak", acceptable };
  }
  let score = 2;
  if (pw.length >= 14) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const s = Math.min(score, 4) as 2 | 3 | 4;
  return { score: s, label: s === 2 ? "Fair" : s === 3 ? "Good" : "Strong", acceptable };
}

/** Full gate for a NEW password: base policy plus common-password rejection. */
export function newPasswordError(pw: string, email?: string): string | null {
  const base = passwordPolicyError(pw, email);
  if (base) return base;
  if (isCommonPassword(pw)) return "That password is too common. Choose something harder to guess.";
  return null;
}
