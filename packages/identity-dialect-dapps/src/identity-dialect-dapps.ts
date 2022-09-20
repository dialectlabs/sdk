import type {
  AccountAddress,
  Identity,
  IdentityResolver,
} from '@dialectlabs/sdk';
import { Dapp, fetchAllDapps } from './api';

export class DialectDappsIdentityResolver implements IdentityResolver {
  // public key to identity
  dappsCached?: Record<string, Identity>;
  dappsData?: Promise<Dapp[]>;

  constructor(private readonly baseUrl: string = 'https://dialectapi.to') {}

  get type(): string {
    return 'DIALECT_DAPPS';
  }

  async resolve(address: AccountAddress): Promise<Identity | null> {
    if (!this.dappsCached) {
      if (this.dappsData) {
        await this.dappsData;
      } else {
        this.dappsData = fetchAllDapps(this.baseUrl);
      }
      this.dappsCached = (await this.dappsData).reduce((acc, it) => {
        acc[it.publicKey] = {
          type: this.type,
          address: it.publicKey,
          name: it.name,
          additionals: {
            description: it.description,
            websiteUrl: it.websiteUrl,
            avatarUrl: it.avatarUrl,
            heroUrl: it.heroUrl,
            verified: it.verified,
          },
        };
        return acc;
      }, {} as Record<string, Identity>);
    }
    return this.dappsCached[address] || null;
  }

  async resolveReverse(domainName: string): Promise<Identity | null> {
    return null;
  }
}
