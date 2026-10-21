import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** "current-password" for sign-in / re-auth, "new-password" for new passwords. */
  autoComplete: "current-password" | "new-password";
  /** Accessible name of the field, used in the toggle's aria-label. */
  fieldLabel?: string;
  inputClassName?: string;
};

/**
 * Password field with a show/hide (eye) toggle and a Caps Lock warning.
 * The input keeps its autocomplete hint so password managers still fill and
 * save it; toggling only swaps type="password" / "text".
 */
export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { fieldLabel = "password", inputClassName = "uos-input", className, onKeyUp, onKeyDown, onBlur, ...rest },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const warnId = useId();

  const readCaps = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === "function") setCapsLock(e.getModifierState("CapsLock"));
  };

  return (
    <div className={className}>
      <div className="relative">
        <input
          {...rest}
          ref={ref}
          type={visible ? "text" : "password"}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          aria-describedby={capsLock ? warnId : rest["aria-describedby"]}
          className={`${inputClassName} pr-11`}
          onKeyUp={(e) => {
            readCaps(e);
            onKeyUp?.(e);
          }}
          onKeyDown={(e) => {
            readCaps(e);
            onKeyDown?.(e);
          }}
          onBlur={(e) => {
            setCapsLock(false);
            onBlur?.(e);
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? `Hide ${fieldLabel}` : `Show ${fieldLabel}`}
          aria-pressed={visible}
          title={visible ? "Hide" : "Show"}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
        >
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
      {capsLock && (
        <p id={warnId} role="status" className="mt-1.5 text-xs font-medium text-amber-500">
          Caps Lock is on
        </p>
      )}
    </div>
  );
});
