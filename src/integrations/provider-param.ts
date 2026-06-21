import { BadRequestException } from '@nestjs/common';
import { Provider } from '@prisma/client';

/** Parse a URL path segment like "whoop" into the Provider enum. */
export function parseProvider(value: string): Provider {
  const upper = value.toUpperCase();
  if ((Object.values(Provider) as string[]).includes(upper)) {
    return upper as Provider;
  }
  throw new BadRequestException(`Unknown provider "${value}"`);
}

/**
 * Demo-grade OAuth `state` encoding (carries the userId through the redirect).
 * PRODUCTION: replace with a signed, single-use, CSRF-bound token bound to the
 * authenticated session — do not trust a plain userId round-tripped via the browser.
 */
export function encodeState(userId: string): string {
  return Buffer.from(JSON.stringify({ userId }), 'utf8').toString('base64url');
}

export function decodeState(state: string): { userId: string } {
  try {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
  } catch {
    throw new BadRequestException('Invalid OAuth state');
  }
}
