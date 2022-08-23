import { getNameEntry, tryGetName } from '@cardinal/namespaces';
import type { Identity, IdentityResolver } from '@dialectlabs/sdk';
import type { Connection, PublicKey } from '@solana/web3.js';
import { tryGetImageUrl } from './utils';

const TWITTER_NAMESPACE = 'twitter';

export class CardinalTwitterIdentityResolver implements IdentityResolver {
  constructor(private readonly connection: Connection) {}

  get type(): string {
    return 'CARDINAL_TWITTER';
  }

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    const name = await tryGetName(this.connection, publicKey);
    if (!name || !name[0]) {
      return null;
    }
    const realName = name[0].slice(1);
    const avatar = (await tryGetImageUrl(name[0])) || undefined;
    return {
      type: this.type,
      publicKey,
      name: realName,
      additionals: {
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
    return {
      type: this.type,
      name: domainName,
      publicKey: parsed.data,
    };
  }
}
