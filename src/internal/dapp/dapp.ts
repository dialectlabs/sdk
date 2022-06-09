import type { Dapp, DappAddresses, Dapps } from '@dapp/dapp.interface';
import type { PublicKey } from '@solana/web3.js';

export class DappsImpl implements Dapps {
  constructor(
    private readonly publicKey: PublicKey,
    private readonly dappAddresses: DappAddresses,
  ) {}

  find(): Promise<Dapp> {
    const dapp: Dapp = new DappImpl(this.publicKey, this.dappAddresses);
    return Promise.resolve(dapp);
  }
}

export class DappImpl implements Dapp {
  constructor(
    readonly publicKey: PublicKey,
    readonly dappAddresses: DappAddresses,
  ) {}
}
