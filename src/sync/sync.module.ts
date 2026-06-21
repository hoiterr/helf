import { Module } from '@nestjs/common';
import { ConnectionsModule } from '../connections/connections.module';
import { IngestionModule } from '../ingestion/ingestion.module';
import { ProvidersModule } from '../providers/providers.module';
import { SyncService } from './sync.service';

@Module({
  imports: [ProvidersModule, ConnectionsModule, IngestionModule],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
