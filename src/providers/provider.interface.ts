import { Provider } from '../domain/enums';
import { CanonicalBatch } from '../canonical/canonical.types';

export interface TokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
  externalUserId?: string;
}

/**
 * The contract every health-data source implements. Adding a provider (Oura,
 * Polar, Withings, or Garmin via an aggregator) means writing ONE class that
 * implements this — nothing downstream (ingestion, analytics, dashboard) changes.
 */
export interface HealthProvider {
  readonly provider: Provider;

  /** Build the OAuth2 authorization URL the user is redirected to. */
  getAuthorizationUrl(state: string): string;

  /** Exchange the OAuth `code` from the callback for tokens. */
  exchangeCode(code: string): Promise<TokenSet>;

  /** Use a refresh token to mint a fresh access token. */
  refresh(refreshToken: string): Promise<TokenSet>;

  /** Pull all data updated since `since`, normalized into the canonical schema. */
  fetchSince(accessToken: string, since: Date): Promise<CanonicalBatch>;
}
