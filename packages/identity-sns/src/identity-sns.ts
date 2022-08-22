import {
  getDomainKey,
  getFavoriteDomain,
  NameRegistryState,
} from '@bonfida/spl-name-service';
import type {
  Identity,
  IdentityResolver,
  ReverseIdentity,
} from '@dialectlabs/sdk';
import type { Connection, PublicKey } from '@solana/web3.js';

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
    } catch (e) {}
    return null;
  }

  async resolveReverse(rawDomainName: string): Promise<ReverseIdentity | null> {
    const domainName = rawDomainName.trim();
    try {
      const { pubkey } = await getDomainKey(domainName);

      const { registry } = await NameRegistryState.retrieve(
        this.connection,
        pubkey,
      );

      if (!registry.owner) {
        return null;
      }

      return {
        identityName: NAME,
        name: domainName,
        publicKey: registry.owner,
      };
    } catch (e) {}

    return null;
  }
}
