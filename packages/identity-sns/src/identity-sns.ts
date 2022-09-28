import {
  getDomainKey,
  getFavoriteDomain,
  NameRegistryState,
} from '@bonfida/spl-name-service';
import type { Identity, IdentityResolver } from '@dialectlabs/sdk';
import { SNSIdentityError } from './identity-sns.error';
import type { Connection, PublicKey } from '@solana/web3.js';

export class SNSIdentityResolver implements IdentityResolver {
  constructor(private readonly connection: Connection) {}
  get type(): string {
    return 'SNS';
  }

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    try {
      const res = await getFavoriteDomain(this.connection, publicKey);
      return {
        name: res.reverse,
        publicKey,
        type: this.type,
        additionals: {
          displayName: `${res.reverse}.sol`,
        },
      };
    } catch (e: any) {
      if (!SNSIdentityError.ignoreMatcher.some((it) => e.message.match(it))) {
        throw new SNSIdentityError(e.message);
      }
    }
    return null;
  }

  async resolveReverse(rawDomainName: string): Promise<Identity | null> {
    const domainName = rawDomainName.trim();

    const { pubkey } = await getDomainKey(domainName);
    const { registry } = await NameRegistryState.retrieve(
      this.connection,
      pubkey,
    );

    if (!registry.owner) {
      return null;
    }

    return {
      type: this.type,
      name: domainName,
      publicKey: registry.owner,
      additionals: {
        displayName: rawDomainName,
      },
    };
  }
}
