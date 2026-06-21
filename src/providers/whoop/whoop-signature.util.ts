import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Verify a WHOOP webhook signature. WHOOP signs `timestamp + rawBody` with your
 * client secret (HMAC-SHA256, base64) and sends it in the X-WHOOP-Signature header
 * alongside X-WHOOP-Signature-Timestamp.
 *
 * NOTE: confirm the exact signing scheme against the current WHOOP webhook docs
 * before relying on this in production:
 * https://developer.whoop.com/docs/developing/webhooks/
 */
export function verifyWhoopSignature(
  rawBody: string,
  timestamp: string | undefined,
  signature: string | undefined,
  secret: string,
): boolean {
  if (!timestamp || !signature || !secret) return false;
  const expected = createHmac('sha256', secret)
    .update(timestamp + rawBody)
    .digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
