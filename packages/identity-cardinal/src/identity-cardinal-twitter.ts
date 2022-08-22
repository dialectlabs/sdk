import { tryGetName } from '@cardinal/namespaces';
import type {
  Identity,
  IdentityResolver,
  ReverseIdentity,
} from '@dialectlabs/sdk';
import type { PublicKey, Connection } from '@solana/web3.js';
import { tryGetImageUrl } from 'utils';

const NAME = 'CARDINAL_TWITTER';

export class CardinalTwitterIdentityResolver implements IdentityResolver {
  constructor(private readonly connection: Connection) {}

  async resolve(publicKey: PublicKey): Promise<Identity | null> {
    try {
      const name = await tryGetName(this.connection, publicKey);
      if (!name || !name[0]) {
        return null;
      }
      const avatar = await tryGetImageUrl(name[0]);
      return {
        identityName: NAME,
        publicKey,
        name: name[0],
        additonals: {
          avatarUrl: avatar,
        },
      };
    } catch {}
    return null;
  }

  async resolveReverse(domainName: string): Promise<ReverseIdentity | null> {
    return null;
  }
}
