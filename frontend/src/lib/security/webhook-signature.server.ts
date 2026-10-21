/** SHERIVS-004 — webhook signature primitive (server only). */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Constant-time check of a hex HMAC-SHA512 signature over the raw body. Fails closed. */
export function verifyHmacHexSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string | null | undefined,
): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest();
  if (!/^[0-9a-fA-F]+$/.test(signature) || signature.length !== expected.length * 2) return false;
  return timingSafeEqual(Buffer.from(signature, "hex"), expected);
}
