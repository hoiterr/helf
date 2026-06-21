import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { CommonModule } from './common/common.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { ConnectionsModule } from './connections/connections.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { SyncModule } from './sync/sync.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CommonModule,
    ProvidersModule,
    ConnectionsModule,
    IngestionModule,
    SyncModule,
    IntegrationsModule,
    UsersModule,
    DashboardModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
