import { getNameEntry, tryGetName } from '@cardinal/namespaces';
import type {
  Identity,
  IdentityResolver,
  ReverseIdentity,
} from '@dialectlabs/sdk';
import type { Connection, PublicKey } from '@solana/web3.js';
import { tryGetImageUrl } from './utils';

const NAME = 'CARDINAL_TWITTER';

const TWITTER_NAMESPACE = 'twitter';

export class CardinalTwitterIdentityResolver implements IdentityResolver {
  constructor(private readonly connection: Connection) {}

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    try {
      const name = await tryGetName(this.connection, publicKey);
      if (!name || !name[0]) {
        return null;
      }
      const realName = name[0].slice(1);
      const avatar = (await tryGetImageUrl(name[0])) || undefined;
      return {
        identityName: NAME,
        publicKey,
        name: realName,
        additionals: {
          avatarUrl: avatar,
          link: `https://twitter.com/${realName}`,
        },
      };
    } catch {}
    return null;
  }

  async resolveReverse(rawDomainName: string): Promise<ReverseIdentity | null> {
    let domainName = rawDomainName.trim();
    if (rawDomainName.startsWith('@')) {
      domainName = domainName.slice(1);
    }
    try {
      const { parsed } = await getNameEntry(
        this.connection,
        TWITTER_NAMESPACE,
        domainName,
      );
      if (!parsed.data) {
        return null;
      }
      return {
        identityName: NAME,
        name: domainName,
        publicKey: parsed.data,
      };
    } catch {}
    return null;
  }
}
