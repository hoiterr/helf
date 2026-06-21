import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { CanonicalBatch, emptyBatch } from '../../canonical/canonical.types';
import { WhoopConfig } from '../../config/configuration';
import { HealthProvider, TokenSet } from '../provider.interface';
import { normalizeRecovery, normalizeSleep, normalizeWorkout } from './whoop.normalizer';
import {
  WhoopPaginated,
  WhoopProfile,
  WhoopRecovery,
  WhoopSleep,
  WhoopTokenResponse,
  WhoopWorkout,
} from './whoop.types';

const WHOOP_AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const WHOOP_TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const WHOOP_API_BASE = 'https://api.prod.whoop.com/developer';

// `offline` is required to receive a refresh token.
const WHOOP_SCOPES = [
  'offline',
  'read:recovery',
  'read:sleep',
  'read:workout',
  'read:cycles',
  'read:profile',
];

@Injectable()
export class WhoopProvider implements HealthProvider {
  readonly provider = Provider.WHOOP;
  private readonly logger = new Logger(WhoopProvider.name);
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.http = axios.create({ baseURL: WHOOP_API_BASE, timeout: 15_000 });
  }

  private get cfg(): WhoopConfig {
    return this.config.getOrThrow<WhoopConfig>('whoop');
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.cfg.clientId,
      redirect_uri: this.cfg.redirectUri,
      scope: WHOOP_SCOPES.join(' '),
      state,
    });
    return `${WHOOP_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string): Promise<TokenSet> {
    return this.tokenRequest({
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.cfg.redirectUri,
    });
  }

  async refresh(refreshToken: string): Promise<TokenSet> {
    return this.tokenRequest({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: WHOOP_SCOPES.join(' '),
    });
  }

  private async tokenRequest(extra: Record<string, string>): Promise<TokenSet> {
    const body = new URLSearchParams({
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
      ...extra,
    });
    try {
      const { data } = await axios.post<WhoopTokenResponse>(WHOOP_TOKEN_URL, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        scopes: data.scope?.split(' '),
      };
    } catch (err) {
      this.logger.error(`WHOOP token request failed: ${describeAxiosError(err)}`);
      throw new UnauthorizedException('WHOOP token request failed');
    }
  }

  async fetchSince(accessToken: string, since: Date): Promise<CanonicalBatch> {
    const batch = emptyBatch();
    const headers = { Authorization: `Bearer ${accessToken}` };

    try {
      const profile = await this.http.get<WhoopProfile>('/v2/user/profile/basic', { headers });
      batch.externalUserId = String(profile.data.user_id);
    } catch (err) {
      this.logger.warn(`WHOOP profile fetch failed: ${describeAxiosError(err)}`);
    }

    const start = since.toISOString();

    const recoveries = await this.paginate<WhoopRecovery>('/v2/recovery', { start }, headers);
    batch.recovery = recoveries.map(normalizeRecovery);

    const sleeps = await this.paginate<WhoopSleep>('/v2/activity/sleep', { start }, headers);
    batch.sleep = sleeps.filter((s) => !s.nap).map(normalizeSleep);

    const workouts = await this.paginate<WhoopWorkout>('/v2/activity/workout', { start }, headers);
    batch.workouts = workouts.map(normalizeWorkout);

    return batch;
  }

  /** Walk a paginated WHOOP collection, following `next_token` until exhausted. */
  private async paginate<T>(
    path: string,
    query: Record<string, string>,
    headers: Record<string, string>,
  ): Promise<T[]> {
    const out: T[] = [];
    let nextToken: string | undefined;
    let guard = 0;
    do {
      const params: Record<string, string> = { ...query, limit: '25' };
      if (nextToken) params.nextToken = nextToken;
      try {
        const { data } = await this.http.get<WhoopPaginated<T>>(path, { headers, params });
        out.push(...data.records);
        nextToken = data.next_token;
      } catch (err) {
        this.logger.error(`WHOOP GET ${path} failed: ${describeAxiosError(err)}`);
        break;
      }
    } while (nextToken && ++guard < 200);
    return out;
  }
}

function describeAxiosError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return `${err.response?.status ?? '?'} ${JSON.stringify(err.response?.data ?? err.message)}`;
  }
  return err instanceof Error ? err.message : String(err);
}
