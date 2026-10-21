/**
 * Sherivs Scholar — marketplace listing publisher (WAVE-R38).
 *
 * An organization's reality already declares which features it has. This module
 * PUBLISHES the marketplace catalog for that reality using the existing P27
 * contracts (`marketplace-core.ts`) — one listing per installed feature code —
 * instead of asking vendors to hand-write a catalog per organization.
 *
 * Boundary: publishing builds PRODUCT + LISTING records. Trust is never
 * self-asserted (`trustLevel` starts unverified), entitlement/gating decides who
 * may install, and nothing here writes to the database.
 */

import {
  MARKETPLACE_PRODUCT_TYPES,
  createMarketplaceProduct,
  createProductListing,
  marketplaceProductId,
  productListingId,
  productVersionId,
  type MarketplaceProduct,
  type ProductListing,
} from "@/lib/marketplace-core";
import { featureCodesForReality, type ScholarFeatureCode } from "../capability-codes";
import type { InstitutionReality } from "../roles/role-template-engine";

/** Always a type the marketplace recognizes (data, never a hardcoded string). */
export const DEFAULT_PRODUCT_TYPE = MARKETPLACE_PRODUCT_TYPES[0];

export interface RealityListing {
  featureCode: string;
  label: string;
  workspace: string;
  product: MarketplaceProduct;
  listing: ProductListing;
}

export interface PublishRealityListingsInput {
  reality: InstitutionReality;
  /** Verified vendor that publishes the runtime's catalogs. */
  vendorRef: string;
  locale?: string;
  /** Semver of the published bundle (one version covers the catalog). */
  bundleVersion?: string;
  productType?: (typeof MARKETPLACE_PRODUCT_TYPES)[number];
}

export interface RealityPublishResult {
  ok: boolean;
  issues: readonly string[];
  listings: readonly RealityListing[];
}

/**
 * Publish one listing per installed feature code. Deterministic order.
 */
export function publishRealityListings(input: PublishRealityListingsInput): RealityPublishResult {
  const issues: string[] = [];
  if (!input.vendorRef.trim()) {
    return { ok: false, issues: ["a verified vendor is required to publish"], listings: [] };
  }
  const bundleVersion = input.bundleVersion ?? "1.0.0";
  if (!/^\d+\.\d+\.\d+$/.test(bundleVersion)) {
    return { ok: false, issues: [`bundleVersion "${bundleVersion}" must be semver`], listings: [] };
  }

  const installed = featureCodesForReality(input.reality);
  const listings: RealityListing[] = [];

  for (const feature of installed) {
    const product = createMarketplaceProduct({
      id: marketplaceProductId(`scholar.${feature.code}`),
      vendorRef: input.vendorRef,
      name: feature.label,
      description: `Installs ${feature.label} for an organization whose reality includes ${feature.featureKeys.join(", ")}.`,
      productType: input.productType ?? DEFAULT_PRODUCT_TYPE,
      categories: [],
      capabilities: [feature.capability],
      distributionScope: ["public"],
    });
    if (!product.ok) {
      issues.push(`${feature.code}: ${product.error}`);
      continue;
    }

    const listing = createProductListing({
      id: productListingId(`scholar.${feature.code}.${input.locale ?? "en"}`),
      productId: product.product.id,
      locale: input.locale ?? "en",
      name: feature.label,
      description: `Runtime feature ${feature.code} (workspace: ${feature.workspace}).`,
      capabilities: [feature.capability],
      requirements: [...feature.featureKeys],
      permissions: [feature.code],
      dataAccess: [],
      vendorRef: input.vendorRef,
      versionRef: productVersionId(`scholar.bundle.${bundleVersion}`),
      supportLevel: "standard",
      certificationRefs: [],
    });

    listings.push({
      featureCode: feature.code,
      label: feature.label,
      workspace: feature.workspace,
      product: product.product,
      listing,
    });
  }

  return { ok: issues.length === 0, issues, listings };
}

/** Feature codes a published catalog covers (used for coverage assertions). */
export function publishedFeatureCodes(
  listings: readonly RealityListing[],
): readonly ScholarFeatureCode["code"][] {
  return listings.map((entry) => entry.featureCode).sort();
}
