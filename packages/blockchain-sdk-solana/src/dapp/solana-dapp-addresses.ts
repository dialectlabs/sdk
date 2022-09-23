import type { DialectAccount } from '@dialectlabs/web3';
import { findDialects } from '@dialectlabs/web3';
import type { Program } from '@project-serum/anchor';
import type { DappAddress, DappAddresses } from '@dialectlabs/sdk';
import { AddressType, IllegalStateError } from '@dialectlabs/sdk';
import { withErrorParsing } from '../messaging/solana-messaging-errors';

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
            address: dialectMember.publicKey.toBase58(),
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
