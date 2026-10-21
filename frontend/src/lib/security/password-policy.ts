/**
 * Client-side password policy. Mirrors the Supabase Auth dashboard settings
 * the owner must set (Auth → Providers → Email): minimum length 10 and
 * "Lowercase, uppercase letters and digits". The server (GoTrue) is the
 * authority; this only gives early, friendly feedback.
 */
export const PASSWORD_MIN_LENGTH = 10;

export function passwordPolicyError(password: string, email?: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH)
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
    return "Password must include a lowercase letter, an uppercase letter and a digit.";
  const local = email?.split("@")[0]?.toLowerCase();
  if (local && local.length >= 4 && password.toLowerCase().includes(local))
    return "Password must not contain your email name.";
  return null;
}
