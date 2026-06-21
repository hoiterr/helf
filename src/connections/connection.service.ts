import { Injectable } from '@nestjs/common';
import { ConnectionStatus, Prisma, Provider, ProviderConnection } from '@prisma/client';
import { CryptoService } from '../common/crypto.service';
import { PrismaService } from '../prisma/prisma.service';
import { TokenSet } from '../providers/provider.interface';

@Injectable()
export class ConnectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  /** Create or update a user's connection to a provider, encrypting tokens at rest. */
  async upsertFromTokens(
    userId: string,
    provider: Provider,
    tokens: TokenSet,
  ): Promise<ProviderConnection> {
    const data: Prisma.ProviderConnectionUncheckedCreateInput = {
      userId,
      provider,
      status: ConnectionStatus.ACTIVE,
      externalUserId: tokens.externalUserId,
      scopes: tokens.scopes ?? [],
      accessToken: tokens.accessToken ? this.crypto.encrypt(tokens.accessToken) : null,
      refreshToken: tokens.refreshToken ? this.crypto.encrypt(tokens.refreshToken) : null,
      tokenExpiresAt: tokens.expiresAt ?? null,
    };
    return this.prisma.providerConnection.upsert({
      where: { userId_provider: { userId, provider } },
      create: data,
      update: {
        status: data.status,
        externalUserId: data.externalUserId,
        scopes: data.scopes,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
      },
    });
  }

  decryptAccessToken(conn: ProviderConnection): string | null {
    return conn.accessToken ? this.crypto.decrypt(conn.accessToken) : null;
  }

  decryptRefreshToken(conn: ProviderConnection): string | null {
    return conn.refreshToken ? this.crypto.decrypt(conn.refreshToken) : null;
  }

  async markStatus(id: string, status: ConnectionStatus): Promise<void> {
    await this.prisma.providerConnection.update({ where: { id }, data: { status } });
  }

  async touchSynced(id: string, externalUserId?: string): Promise<void> {
    await this.prisma.providerConnection.update({
      where: { id },
      data: { lastSyncedAt: new Date(), ...(externalUserId ? { externalUserId } : {}) },
    });
  }
}
