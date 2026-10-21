import { Check, X } from "lucide-react";
import { passwordRules, passwordStrength } from "@/lib/security/password-strength";

const BAR = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-emerald-500", "bg-emerald-500"];

/** Live strength bar plus the policy checklist (announced politely to screen readers). */
export function PasswordStrengthMeter({ password, email }: { password: string; email?: string }) {
  const strength = passwordStrength(password, email);
  const rules = passwordRules(password, email);
  return (
    <div className="space-y-2" data-testid="password-strength">
      <div className="flex items-center gap-2">
        <div
          className="flex flex-1 gap-1"
          role="meter"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={strength.score}
          aria-valuetext={strength.label || "Empty"}
        >
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                password && i <= Math.max(strength.score, 1) ? BAR[strength.score] : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="w-16 text-right text-xs font-medium text-muted-foreground" aria-live="polite">
          {strength.label}
        </span>
      </div>
      <ul className="grid gap-1 text-xs sm:grid-cols-2">
        {rules.map((r) => (
          <li
            key={r.id}
            data-ok={r.ok}
            className={`flex items-center gap-1.5 ${r.ok ? "text-emerald-500" : "text-muted-foreground"}`}
          >
            {r.ok ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
            <span>
              {r.label}
              <span className="sr-only">{r.ok ? " (met)" : " (not met)"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
