import { Controller, Headers, HttpCode, Logger, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@prisma/client';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { WhoopConfig } from '../config/configuration';
import { verifyWhoopSignature } from '../providers/whoop/whoop-signature.util';
import { WhoopWebhookEvent } from '../providers/whoop/whoop.types';
import { SyncService } from '../sync/sync.service';

/**
 * WHOOP webhook receiver. On a verified event we re-pull a short window for the
 * affected user — near-real-time updates without polling.
 */
@Controller('providers/whoop')
export class WhoopWebhookController {
  private readonly logger = new Logger(WhoopWebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly sync: SyncService,
  ) {}

  @Post('webhook')
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-whoop-signature') signature?: string,
    @Headers('x-whoop-signature-timestamp') timestamp?: string,
  ): Promise<{ ok: true }> {
    const raw = req.rawBody?.toString('utf8') ?? '';
    const secret = this.config.getOrThrow<WhoopConfig>('whoop').webhookSecret;

    if (!verifyWhoopSignature(raw, timestamp, signature, secret)) {
      throw new UnauthorizedException('Invalid WHOOP webhook signature');
    }

    const event = JSON.parse(raw) as WhoopWebhookEvent;
    this.logger.log(`WHOOP webhook: ${event.type} for user ${event.user_id}`);
    void this.sync.syncByExternalUser(Provider.WHOOP, String(event.user_id));
    return { ok: true };
  }
}
