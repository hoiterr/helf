import { Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ConnectionService } from '../connections/connection.service';
import { ProviderRegistry } from '../providers/provider.registry';
import { SyncService } from '../sync/sync.service';
import { decodeState, encodeState, parseProvider } from './provider-param';

/**
 * Generic OAuth connect/callback for any wired provider, plus on-demand sync.
 *   GET  /providers/:provider/connect?userId=...   → redirect to provider consent
 *   GET  /providers/:provider/callback?code&state  → store tokens + initial sync
 *   POST /connections/:id/sync                      → "sync now" button
 */
@Controller()
export class IntegrationsController {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly connections: ConnectionService,
    private readonly sync: SyncService,
  ) {}

  @Get('providers/:provider/connect')
  connect(
    @Param('provider') providerParam: string,
    @Query('userId') userId: string,
    @Res() res: Response,
  ): void {
    const provider = parseProvider(providerParam);
    const url = this.registry.get(provider).getAuthorizationUrl(encodeState(userId));
    res.redirect(url);
  }

  @Get('providers/:provider/callback')
  async callback(
    @Param('provider') providerParam: string,
    @Query('code') code: string,
    @Query('state') state: string,
  ): Promise<{ connected: string; userId: string }> {
    const provider = parseProvider(providerParam);
    const { userId } = decodeState(state);
    const tokens = await this.registry.get(provider).exchangeCode(code);
    const conn = await this.connections.upsertFromTokens(userId, provider, tokens);
    // Kick off the initial backfill without blocking the redirect response.
    void this.sync.syncConnection(conn.id).catch(() => undefined);
    return { connected: provider, userId };
  }

  @Post('connections/:id/sync')
  async syncNow(@Param('id') id: string): Promise<{ ok: true }> {
    await this.sync.syncConnection(id);
    return { ok: true };
  }
}
