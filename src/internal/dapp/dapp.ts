import type {
  CreateDappCommand,
  Dapp,
  DappAddresses,
  Dapps,
} from '@dapp/dapp.interface';
import type { PublicKey } from '@solana/web3.js';
import type { DataServiceDappsApi } from '@data-service-api/data-service-dapps-api';
import { withReThrowingDataServiceError } from '@data-service-api/data-service-api';

export class DappsImpl implements Dapps {
  constructor(
    private readonly publicKey: PublicKey,
    private readonly dappAddresses: DappAddresses,
    private readonly dappsApi: DataServiceDappsApi,
  ) {}

  find(): Promise<Dapp> {
    const dapp: Dapp = new DappImpl(this.publicKey, this.dappAddresses);
    return Promise.resolve(dapp);
  }

  async create(command: CreateDappCommand): Promise<Dapp> {
    await withReThrowingDataServiceError(
      this.dappsApi.create({
        publicKey: command.publicKey.toBase58(),
      }),
    );
    return new DappImpl(command.publicKey, this.dappAddresses);
  }
}

export class DappImpl implements Dapp {
  constructor(
    readonly publicKey: PublicKey,
    readonly dappAddresses: DappAddresses,
  ) {}
}
