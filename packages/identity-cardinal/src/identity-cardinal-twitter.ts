import { getNameEntry, tryGetName } from '@cardinal/namespaces';
import type {
  AccountAddress,
  Identity,
  IdentityResolver,
} from '@dialectlabs/sdk';
import { Connection, PublicKey } from '@solana/web3.js';
import { tryGetImageUrl } from './utils';

const TWITTER_NAMESPACE = 'twitter';

export class CardinalTwitterIdentityResolver implements IdentityResolver {
  constructor(private readonly connection: Connection) {}

  get type(): string {
    return 'CARDINAL_TWITTER';
  }

  async resolve(accountAddress: AccountAddress): Promise<Identity | null> {
    const name = await tryGetName(
      this.connection,
      new PublicKey(accountAddress),
    );
    if (!name || !name[0]) {
      return null;
    }
    const realName = name[0].slice(1);
    const avatar = (await tryGetImageUrl(realName)) || undefined;
    return {
      type: this.type,
      accountAddress,
      name: realName,
      additionals: {
        displayName: name[0],
        avatarUrl: avatar,
        link: `https://twitter.com/${realName}`,
      },
    };
  }

  async resolveReverse(rawDomainName: string): Promise<Identity | null> {
    let domainName = rawDomainName.trim();
    if (rawDomainName.startsWith('@')) {
      domainName = domainName.slice(1);
    }
    const { parsed } = await getNameEntry(
      this.connection,
      TWITTER_NAMESPACE,
      domainName,
    );
    if (!parsed.data) {
      return null;
    }
    const avatar = (await tryGetImageUrl(domainName)) || undefined;
    return {
      type: this.type,
      name: domainName,
      accountAddress: parsed.data.toBase58(),
      additionals: {
        displayName: rawDomainName,
        avatarUrl: avatar,
        link: `https://twitter.com/${domainName}`,
      },
    };
  }
}
