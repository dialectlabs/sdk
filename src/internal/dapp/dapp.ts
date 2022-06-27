import type {
  CreateDappCommand,
  Dapp,
  DappAddresses,
  Dapps,
} from '@dapp/dapp.interface';
import { PublicKey } from '@solana/web3.js';
import type { DataServiceDappsApi } from '@data-service-api/data-service-dapps-api';
import { withErrorParsing } from '@data-service-api/data-service-errors';
import type { DataServiceApiClientError } from '@data-service-api/data-service-api';
import { ResourceNotFoundError } from '@sdk/errors';
import type { DialectWalletAdapterWrapper } from '@wallet-adapter/dialect-wallet-adapter-wrapper';

export class DappsImpl implements Dapps {
  constructor(
    private readonly wallet: DialectWalletAdapterWrapper,
    private readonly dappAddresses: DappAddresses,
    private readonly dappsApi: DataServiceDappsApi,
  ) {}

  async find(): Promise<Dapp | null> {
    try {
      const dappDto = await withErrorParsing(this.dappsApi.find());
      return new DappImpl(new PublicKey(dappDto.publicKey), this.dappAddresses);
    } catch (e) {
      const err = e as DataServiceApiClientError;
      if (err instanceof ResourceNotFoundError) return null;
      throw e;
    }
  }

  async create(command: CreateDappCommand): Promise<Dapp> {
    await withErrorParsing(
      this.dappsApi.create({
        name: command.name,
        description: command.description,
      }),
    );
    return new DappImpl(this.wallet.publicKey, this.dappAddresses);
  }
}

export class DappImpl implements Dapp {
  constructor(
    readonly publicKey: PublicKey,
    readonly dappAddresses: DappAddresses,
  ) {}
}
