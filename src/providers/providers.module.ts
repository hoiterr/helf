import { Module } from '@nestjs/common';
import { ProviderRegistry } from './provider.registry';
import { WhoopProvider } from './whoop/whoop.provider';

@Module({
  providers: [WhoopProvider, ProviderRegistry],
  exports: [ProviderRegistry],
})
export class ProvidersModule {}
