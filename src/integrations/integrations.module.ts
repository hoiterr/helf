import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module';
import { ProvidersModule } from '../providers/providers.module';
import { SyncModule } from '../sync/sync.module';
import { IntegrationsController } from './integrations.controller';
import { WhoopWebhookController } from './whoop-webhook.controller';

@Module({
  imports: [ProvidersModule, ConnectionsModule, SyncModule],
  controllers: [IntegrationsController, WhoopWebhookController],
})
export class IntegrationsModule {}
