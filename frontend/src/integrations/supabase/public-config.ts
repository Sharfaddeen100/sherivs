/**
 * Public Supabase client configuration contract.
 *
 * Browser bundles may use only VITE_SUPABASE_* public values.
 * Server rendering may use SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY when VITE
 * values are absent, but the two sources must not silently disagree.
 * Server-only secrets (service role, access token, database URLs) are never
 * accepted here.
 */

export class PublicSupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublicSupabaseConfigError";
  }
}

export type PublicSupabaseConfigInput = {
  viteUrl?: string;
  viteKey?: string;
  serverUrl?: string;
  serverKey?: string;
  isBrowser: boolean;
};

export type PublicSupabaseConfig = {
  url: string;
  publishableKey: string;
  source: "vite" | "server-public" | "vite+server-public";
};

function trim(value: string | undefined): string {
  return value == null ? "" : String(value).trim();
}

export function resolvePublicSupabaseConfig(input: PublicSupabaseConfigInput): PublicSupabaseConfig {
  const viteUrl = trim(input.viteUrl);
  const viteKey = trim(input.viteKey);
  const serverUrl = trim(input.serverUrl);
  const serverKey = trim(input.serverKey);

  if (input.isBrowser) {
    if (!viteUrl || !viteKey) {
      throw new PublicSupabaseConfigError(
        "Browser Supabase client requires VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY. Server-only SUPABASE_* values are not a browser fallback.",
      );
    }
    return { url: viteUrl, publishableKey: viteKey, source: "vite" };
  }

  if (viteUrl && serverUrl && viteUrl !== serverUrl) {
    throw new PublicSupabaseConfigError(
      "VITE_SUPABASE_URL and SUPABASE_URL disagree. Refusing silent cross-source fallback.",
    );
  }
  if (viteKey && serverKey && viteKey !== serverKey) {
    throw new PublicSupabaseConfigError(
      "VITE_SUPABASE_PUBLISHABLE_KEY and SUPABASE_PUBLISHABLE_KEY disagree. Refusing silent cross-source fallback.",
    );
  }

  const url = viteUrl || serverUrl;
  const publishableKey = viteKey || serverKey;
  if (!url || !publishableKey) {
    throw new PublicSupabaseConfigError(
      "Missing public Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (SSR may use SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY when they match).",
    );
  }

  return {
    url,
    publishableKey,
    source: viteUrl && serverUrl ? "vite+server-public" : viteUrl ? "vite" : "server-public",
  };
}
