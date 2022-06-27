import type {
  CreateDappCommand,
  Dapp,
  DappAddresses,
  Dapps,
  FindDappQuery,
} from '@dapp/dapp.interface';
import { PublicKey } from '@solana/web3.js';
import type { DataServiceDappsApi } from '@data-service-api/data-service-dapps-api';
import type { DappDto } from '@data-service-api/data-service-dapps-api';
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
      return this.toDapp(dappDto);
    } catch (e) {
      const err = e as DataServiceApiClientError;
      if (err instanceof ResourceNotFoundError) return null;
      throw e;
    }
  }

  private toDapp(dappDto: DappDto) {
    return new DappImpl(
      new PublicKey(dappDto.publicKey),
      dappDto.name,
      dappDto.verified,
      this.dappAddresses,
      dappDto.description,
    );
  }

  async findAll(query?: FindDappQuery): Promise<Omit<Dapp, 'dappAddresses'>[]> {
    const dappDtos = await withErrorParsing(
      this.dappsApi.findAll({
        verified: query?.verified,
      }),
    );
    return dappDtos.map((it) => ({
      ...it,
      publicKey: new PublicKey(it.publicKey),
    }));
  }

  async create(command: CreateDappCommand): Promise<Dapp> {
    const dappDto = await withErrorParsing(
      this.dappsApi.create({
        name: command.name,
        description: command.description,
      }),
    );
    return new DappImpl(
      this.wallet.publicKey,
      dappDto.name,
      dappDto.verified,
      this.dappAddresses,
      dappDto.description,
    );
  }
}

export class DappImpl implements Dapp {
  constructor(
    readonly publicKey: PublicKey,
    readonly name: string,
    readonly verified: boolean,
    readonly dappAddresses: DappAddresses,
    readonly description?: string,
  ) {}
}
