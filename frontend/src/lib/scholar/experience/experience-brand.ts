/**
 * CoreGrid Scholar — Experience engine: organization brand identity.
 *
 * Every organization receives a brand configuration (logo, colours, fonts,
 * tone, language, domain). No organization requires custom frontend
 * development: the brand is data the experience engine applies.
 */

export const BRAND_TONES = ["formal", "warm", "faith_centred", "academic", "technical"] as const;
export type BrandTone = (typeof BRAND_TONES)[number];

export interface BrandIdentity {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  tone: BrandTone;
  /** BCP-47 style tag (e.g. "en", "en-NG", "fr", "ar"). */
  language: string;
  /** Hostname the organization's presence is served on (tenant isolation). */
  domain: string | null;
}

const DEFAULT_BRAND: BrandIdentity = {
  name: "Organization",
  logoUrl: null,
  primaryColor: "#1d4ed8",
  secondaryColor: "#0f172a",
  fontFamily: "Inter",
  tone: "formal",
  language: "en",
  domain: null,
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const LANGUAGE_RE = /^[a-z]{2}(-[A-Za-z0-9]{2,8})*$/;
const DOMAIN_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

export function defaultBrand(overrides: Partial<BrandIdentity> = {}): BrandIdentity {
  return { ...DEFAULT_BRAND, ...overrides };
}

export function validateBrandIdentity(brand: BrandIdentity): string[] {
  const issues: string[] = [];
  if (brand.name.trim().length < 2) issues.push("brand name is required");
  if (!HEX_RE.test(brand.primaryColor))
    issues.push(`primaryColor "${brand.primaryColor}" must be #RRGGBB`);
  if (!HEX_RE.test(brand.secondaryColor)) {
    issues.push(`secondaryColor "${brand.secondaryColor}" must be #RRGGBB`);
  }
  if (brand.fontFamily.trim().length === 0) issues.push("fontFamily is required");
  if (!BRAND_TONES.includes(brand.tone)) issues.push(`unknown brand tone "${brand.tone}"`);
  if (!LANGUAGE_RE.test(brand.language)) issues.push(`language "${brand.language}" must be BCP-47`);
  if (brand.domain !== null && !DOMAIN_RE.test(brand.domain)) {
    issues.push(`domain "${brand.domain}" is not a hostname`);
  }
  if (brand.logoUrl !== null && !/^https?:\/\//.test(brand.logoUrl)) {
    issues.push("logoUrl must be an http(s) URL");
  }
  return issues;
}
