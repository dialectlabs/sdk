import type {
  Identity,
  IdentityResolver,
  ReverseIdentity,
} from '@dialectlabs/sdk';
import { PublicKey } from '@solana/web3.js';
import { fetchAllDapps } from 'api';

const NAME = 'DIALECT_DAPPS';

export class DialectDappsIdentityResolver implements IdentityResolver {
  // public key to identity
  dappsCached?: Record<string, Identity>;

  constructor(private readonly baseUrl: string = 'https://dialectapi.to') {}

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    if (!this.dappsCached) {
      const dapps = await fetchAllDapps(this.baseUrl);
      this.dappsCached = dapps.reduce((acc, it) => {
        acc[it.publicKey] = {
          identityName: NAME,
          publicKey: new PublicKey(it.publicKey),
          name: it.name,
          additionals: {
            avatarUrl: it.avatarUrl,
            description: it.description,
            verified: it.verified,
          },
        };
        return acc;
      }, {} as Record<string, Identity>);
    }
    return this.dappsCached[publicKey.toString()] || null;
  }

  async resolveReverse(domainName: string): Promise<ReverseIdentity | null> {
    return null;
  }
}
