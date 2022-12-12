import { TldParser } from '@onsol/tldparser';
import type {
  AccountAddress,
  Identity,
  IdentityResolver,
} from '@dialectlabs/sdk';
import type { Connection } from '@solana/web3.js';
import { ANSIdentityError } from './identity-ans.error';

export class ANSIdentityResolver implements IdentityResolver {
  constructor(private readonly connection: Connection) { }

  get type(): string {
    return 'ANS';
  }

  async resolve(address: AccountAddress): Promise<Identity | null> {
    try {
      const parser = new TldParser(this.connection);
      const mainDomain = await parser.getMainDomain(address);
      const domain = mainDomain.domain;
      const tld = mainDomain.tld
      return {
        name: `${domain}${tld}`,
        address,
        type: this.type,
        additionals: {
          displayName: `${domain}${tld}`,
        },
      };
    } catch (e: any) {
      if (!ANSIdentityError.ignoreMatcher.some((it) => e.message.match(it))) {
        throw new ANSIdentityError(e.message);
      }
    }
    return null;
  }

  async resolveReverse(domainTld: string): Promise<Identity | null> {
    const parser = new TldParser(this.connection);
    const owner = await parser.getOwnerFromDomainTld(domainTld);
    // expired or not found
    if (!owner) {
      return null;
    }

    return {
      type: this.type,
      name: domainTld,
      address: owner?.toString(),
      additionals: {
        displayName: domainTld,
      },
    };
  }
}
