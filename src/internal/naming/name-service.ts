import { Connection, PublicKey } from '@solana/web3.js';
import { FavouriteDomain, NAME_OFFERS_ID } from '@bonfida/name-offers';
import {
  NAME_PROGRAM_ID,
  performReverseLookup,
} from '@bonfida/spl-name-service';
import { tryGetName as tryGetTwitterHandle } from '@cardinal/namespaces';
import type { NameService } from 'naming/naming.interface';

export class NameServiceResolver implements NameService {
  private connection: Connection;
  private CARDINAL_CONST_PK = 'nameXpT2PwZ2iA6DTNYTotTmiMYusBCYqwBLN2QgF4w';

  constructor(readonly solanaRpcUrl: string) {
    this.connection = new Connection(solanaRpcUrl);
  }

  async getTwitterHandler(publicKey: string) {
    const twitterName = await tryGetTwitterHandle(
      this.connection,
      new PublicKey(publicKey),
      new PublicKey(this.CARDINAL_CONST_PK),
    );
    return twitterName || '';
  }

  async getSNSNameByPublicKey(publicKey: string) {
    if (!publicKey || !publicKey.length) return '';
    const address = new PublicKey(publicKey);

    let domainName = await this.findFavoriteDomainName(address);
    if (!domainName || domainName === '') {
      const domainKeys = await this.findOwnedNameAccountsForUser(address);
      domainKeys.sort();
      if (domainKeys.length > 0 && domainKeys[0]) {
        domainName = await performReverseLookup(this.connection, domainKeys[0]);
      }
    }

    return domainName || '';
  }

  private async findOwnedNameAccountsForUser(
    userAccount: PublicKey,
  ): Promise<PublicKey[]> {
    const filters = [
      {
        memcmp: {
          offset: 32,
          bytes: userAccount.toBase58(),
        },
      },
    ];
    const accounts = await this.connection.getProgramAccounts(NAME_PROGRAM_ID, {
      filters,
    });
    return accounts.map((a) => a.pubkey);
  }

  private async findFavoriteDomainName(address: any) {
    try {
      const [favKey] = await FavouriteDomain.getKey(
        NAME_OFFERS_ID,
        new PublicKey(address),
      );

      const favourite = await FavouriteDomain.retrieve(this.connection, favKey);

      const reverse = await performReverseLookup(
        this.connection,
        favourite.nameAccount,
      );

      return reverse;
    } catch (err) {
      return undefined;
    }
  }
}
