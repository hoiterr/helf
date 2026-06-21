import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ProviderConnection } from '@prisma/client';
import { ConnectionStatus, Provider } from '../domain/enums';
import { daysAgo } from '../common/time';
import { ConnectionService } from '../connections/connection.service';
import { IngestionService } from '../ingestion/ingestion.service';
import { ProviderRegistry } from '../providers/provider.registry';
import { PrismaService } from '../prisma/prisma.service';

const TOKEN_REFRESH_SKEW_MS = 60_000; // refresh if expiring within a minute
const INITIAL_BACKFILL_DAYS = 30;
const WEBHOOK_LOOKBACK_DAYS = 2; // re-pull a small window on webhook to be safe

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ProviderRegistry,
    private readonly connections: ConnectionService,
    private readonly ingestion: IngestionService,
  ) {}

  /** Sync a single connection. Refreshes the access token first if needed. */
  async syncConnection(connectionId: string, since?: Date): Promise<void> {
    const conn = await this.prisma.providerConnection.findUniqueOrThrow({
      where: { id: connectionId },
    });
    if (conn.status === ConnectionStatus.REVOKED) return;

    const providerName = conn.provider as Provider;
    const provider = this.registry.get(providerName);
    const accessToken = await this.ensureValidToken(conn);
    const sinceDate = since ?? conn.lastSyncedAt ?? daysAgo(INITIAL_BACKFILL_DAYS);

    const batch = await provider.fetchSince(accessToken, sinceDate);
    await this.ingestion.persist(conn.userId, providerName, batch);
    await this.connections.touchSynced(conn.id, batch.externalUserId);
  }

  /** Route an incoming webhook to the matching connection(s) by provider user id. */
  async syncByExternalUser(provider: Provider, externalUserId: string): Promise<void> {
    const conns = await this.prisma.providerConnection.findMany({
      where: { provider, externalUserId, status: ConnectionStatus.ACTIVE },
    });
    if (conns.length === 0) {
      this.logger.warn(`Webhook for ${provider} user ${externalUserId} matched no connection`);
    }
    for (const conn of conns) {
      await this.syncConnection(conn.id, daysAgo(WEBHOOK_LOOKBACK_DAYS)).catch((err) =>
        this.logger.error(`Webhook sync failed for connection ${conn.id}: ${err}`),
      );
    }
  }

  /**
   * Hourly polling fallback. Webhooks keep data near-real-time; this catches
   * anything missed and covers providers without webhooks. ~1h max staleness.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async scheduledPoll(): Promise<void> {
    const due = await this.prisma.providerConnection.findMany({
      where: { status: ConnectionStatus.ACTIVE },
    });
    this.logger.log(`Hourly poll: ${due.length} active connections`);
    for (const conn of due) {
      await this.syncConnection(conn.id).catch((err) =>
        this.logger.error(`Poll sync failed for connection ${conn.id}: ${err}`),
      );
    }
  }

  private async ensureValidToken(conn: ProviderConnection): Promise<string> {
    const expiringSoon =
      conn.tokenExpiresAt != null &&
      conn.tokenExpiresAt.getTime() < Date.now() + TOKEN_REFRESH_SKEW_MS;

    if (expiringSoon) {
      const refreshToken = this.connections.decryptRefreshToken(conn);
      if (!refreshToken) {
        await this.connections.markStatus(conn.id, ConnectionStatus.EXPIRED);
        throw new Error(`Connection ${conn.id} expired and has no refresh token`);
      }
      const provider = this.registry.get(conn.provider as Provider);
      const tokens = await provider.refresh(refreshToken);
      const updated = await this.connections.upsertFromTokens(
        conn.userId,
        conn.provider as Provider,
        tokens,
      );
      const access = this.connections.decryptAccessToken(updated);
      if (!access) throw new Error(`Connection ${conn.id} refresh returned no access token`);
      return access;
    }

    const access = this.connections.decryptAccessToken(conn);
    if (!access) throw new Error(`Connection ${conn.id} has no access token`);
    return access;
  }
}
