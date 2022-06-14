import type { DappAddress, DappAddresses } from '@dapp/dapp.interface';
import { AddressType } from '@dapp/dapp.interface';
import type { Program } from '@project-serum/anchor';
import { IllegalStateError } from '@sdk/errors';
import { DialectAccount, findDialects } from '@dialectlabs/web3';

export class SolanaDappAddresses implements DappAddresses {
  constructor(private readonly program: Program) {}

  async findAll(): Promise<DappAddress[]> {
    const dialectAccounts = await findDialects(this.program, {
      userPk: this.program.provider.wallet.publicKey,
    });
    return dialectAccounts.map((it) => {
      const dialectMember = this.extractDialectMember(it);
      const dapp: DappAddress = {
        enabled: true,
        address: {
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
