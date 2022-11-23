import {
  getHashedName,
  getNameAccountKeyWithBump,
  TldParser,
  NameRecordHeader,
} from '@onsol/tldparser';
import type {
  AccountAddress,
  Identity,
  IdentityResolver,
} from '@dialectlabs/sdk';
import type { Connection } from '@solana/web3.js';
import { OnsolIdentityError } from './identity-onsol.error';

export class OnsolIdentityResolver implements IdentityResolver {
  constructor(private readonly connection: Connection) { }

  get type(): string {
    return 'Onsol';
  }

  async resolve(address: AccountAddress): Promise<Identity | null> {
    try {
      const parser = new TldParser(this.connection);
      const allDomains = await parser.getAllUserDomains(
        address,
      );

      if (!allDomains || !allDomains[0]) {
        return null;
      }
      const mainDomain = allDomains[0];
      const mainDomainRecord = await NameRecordHeader.fromAccountAddress(
        this.connection,
        mainDomain,
      );

      // expired or not found
      if (!mainDomainRecord?.owner) return null;

      const parentNameAccount = await NameRecordHeader.fromAccountAddress(
        this.connection,
        mainDomainRecord?.parentName,
      );

      const tld = await parser.getTldFromParentAccount(
        mainDomainRecord?.parentName
      );

      const reverseLookupHashedName = await getHashedName(
        mainDomain.toString(),
      );
      const [reverseLookupAccount] = await getNameAccountKeyWithBump(
        reverseLookupHashedName,
        parentNameAccount?.owner!,
        undefined,
      );

      const domain = await parser.reverseLookupNameAccount(mainDomain, parentNameAccount?.owner!);

      return {
        name: `${domain}${tld}`,
        address,
        type: this.type,
        additionals: {
          displayName: `${domain}${tld}`,
        },
      };
    } catch (e: any) {
      if (!OnsolIdentityError.ignoreMatcher.some((it) => e.message.match(it))) {
        throw new OnsolIdentityError(e.message);
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
