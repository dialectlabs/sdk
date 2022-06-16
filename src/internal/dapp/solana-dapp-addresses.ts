import type { Program } from '@project-serum/anchor';
import { IllegalStateError } from '@sdk/errors';
import { DialectAccount, findDialects } from '@dialectlabs/web3';
import type { DappAddress } from '@address/addresses.interface';
import { AddressType } from '@address/addresses.interface';
import type { DappAddresses } from '@dapp/dapp.interface';
import { withErrorParsing } from '@data-service-api/data-service-errors';

export class SolanaDappAddresses implements DappAddresses {
  constructor(private readonly program: Program) {}

  async findAll(): Promise<DappAddress[]> {
    const dialectAccounts = await withErrorParsing(
      findDialects(this.program, {
        userPk: this.program.provider.wallet.publicKey,
      }),
    );
    return dialectAccounts.map((it) => {
      const dialectMember = this.extractDialectMember(it);
      const dapp: DappAddress = {
        id: it.publicKey.toBase58(),
        enabled: true,
        address: {
          id: it.publicKey.toBase58(),
          type: AddressType.Wallet,
          value: dialectMember.publicKey.toBase58(),
          verified: true,
          wallet: {
            publicKey: dialectMember.publicKey,
          },
        },
      };
      return dapp;
    });
  }

  private extractDialectMember(account: DialectAccount) {
    const member = account.dialect.members.find(
      (it) => !it.publicKey.equals(this.program.provider.wallet.publicKey),
    );
    if (!member) {
      throw new IllegalStateError("Shouldn't happen");
    }
    return member;
  }
}
