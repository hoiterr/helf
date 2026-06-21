import { Injectable, NotFoundException } from '@nestjs/common';
import { Provider } from '../domain/enums';
import { HealthProvider } from './provider.interface';
import { WhoopProvider } from './whoop/whoop.provider';

/**
 * Resolves a `Provider` enum value to its `HealthProvider` implementation.
 *
 * To add a provider: implement `HealthProvider`, add it as a constructor
 * dependency here, and `register()` it. That's the only wiring needed.
 */
@Injectable()
export class ProviderRegistry {
  private readonly providers = new Map<Provider, HealthProvider>();

  constructor(whoop: WhoopProvider) {
    this.register(whoop);
    // register(oura); register(polar); register(withings); ...
  }

  private register(provider: HealthProvider): void {
    this.providers.set(provider.provider, provider);
  }

  get(provider: Provider): HealthProvider {
    const impl = this.providers.get(provider);
    if (!impl) {
      throw new NotFoundException(`No integration is wired up for provider "${provider}".`);
    }
    return impl;
  }

  has(provider: Provider): boolean {
    return this.providers.has(provider);
  }

  list(): Provider[] {
    return [...this.providers.keys()];
  }
}
