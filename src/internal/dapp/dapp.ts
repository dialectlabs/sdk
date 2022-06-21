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

export class DappsImpl implements Dapps {
  constructor(
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
