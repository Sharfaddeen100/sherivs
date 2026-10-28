/**
 * Sherivs — platform identity constants (UI chrome).
 *
 * Single source for how the platform presents itself. SHERIVS is the COMPANY
 * and the PLATFORM; CoreGrid is a historical internal architecture identifier
 * and must never appear on a customer-facing surface. A runtime's own name,
 * id and description belong to that runtime's layer
 * (`@/lib/runtime/installed-runtimes`), never to the platform's identity module,
 * and UI copy must never imply Sherivs is built on top of any one runtime.
 */
import {
  POSITIONING_STATEMENT,
  POSITIONING_TAGLINE,
  PRODUCT_NAME,
} from "@/lib/public-site/company";

export const PLATFORM_NAME = "Sherivs";
export const PLATFORM_TAGLINE = POSITIONING_TAGLINE;

/** Primary company domain (customer-facing). */
export const PLATFORM_DOMAIN = "sherivs.com";
export const PLATFORM_URL = "https://sherivs.com";

export const PLATFORM_PAGE_TITLE = `${PRODUCT_NAME} | School Management Platform`;
export const PLATFORM_PAGE_DESCRIPTION =
  "Bring school administration, academic operations, and your school community together with Sherivs Scholar.";

export const PLATFORM_PRODUCT_STATEMENT = POSITIONING_STATEMENT;
