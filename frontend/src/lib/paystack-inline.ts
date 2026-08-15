/**
 * Paystack Inline checkout helper.
 *
 * Loads https://js.paystack.co/v2/inline.js once and resumes a transaction
 * using the `access_code` returned by our `initFeePayment` server fn. This
 * renders the Paystack modal inline (no popup window, no blockers).
 *
 * Source of truth for "paid" remains the webhook; we still poll verify as
 * a defence-in-depth on the client.
 */
declare global {
  interface Window {
    PaystackPop?: {
      resumeTransaction: (accessCode: string, opts?: PaystackResumeOpts) => void;
      newTransaction?: (opts: Record<string, unknown>) => void;
    };
  }
}

type PaystackResumeOpts = {
  onSuccess?: (tx: { reference: string; status: string }) => void;
  onCancel?: () => void;
  onLoad?: () => void;
  onError?: (err: { message?: string }) => void;
};

let loader: Promise<void> | null = null;
export function loadPaystackInline(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (window.PaystackPop) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v2/inline.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loader = null;
      reject(new Error("Could not load Paystack checkout"));
    };
    document.head.appendChild(s);
  });
  return loader;
}

export async function openPaystackInline(
  accessCode: string,
  opts: PaystackResumeOpts = {},
): Promise<void> {
  await loadPaystackInline();
  if (!window.PaystackPop) throw new Error("Paystack failed to initialise");
  window.PaystackPop.resumeTransaction(accessCode, opts);
}
