import { getFavoriteDomain } from '@bonfida/spl-name-service';
import type {
  Identity,
  IdentityResolver,
  ReverseIdentity,
} from '@dialectlabs/sdk';
import type { PublicKey, Connection } from '@solana/web3.js';

const NAME = 'SNS';

export class SNSIdentityResolver implements IdentityResolver {
  constructor(private readonly connection: Connection) {}

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    try {
      const res = await getFavoriteDomain(this.connection, publicKey);
      return {
        name: res.reverse,
        publicKey,
        identityName: NAME,
      };
    } catch {}
    return null;
  }

  async resolveReverse(domainName: string): Promise<ReverseIdentity | null> {
    return null;
  }
}
