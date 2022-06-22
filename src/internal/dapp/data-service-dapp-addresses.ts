import type { DappAddresses } from '@dapp/dapp.interface';

import { PublicKey } from '@solana/web3.js';
import { withErrorParsing } from '@data-service-api/data-service-errors';
import type {
  DappAddressDto,
  DataServiceDappsApi,
} from '@data-service-api/data-service-dapps-api';
import { DappAddress, toAddressType } from '@address/addresses.interface';

export class DataServiceDappAddresses implements DappAddresses {
  constructor(private readonly dataServiceDappsApi: DataServiceDappsApi) {}

  async findAll(): Promise<DappAddress[]> {
    const dappAddressesDtos = await withErrorParsing(
      this.dataServiceDappsApi.findAllDappAddresses(),
    );
    return dappAddressesDtos.map((it) => toDappAddress(it));
  }
}

function toDappAddress(dto: DappAddressDto) {
  const dapp: DappAddress = {
    id: dto.id,
    enabled: dto.enabled,
    channelId: dto.channelId,
    address: {
      id: dto.id,
      type: toAddressType(dto.address.type),
      value: dto.address.value,
      verified: dto.address.verified,
      wallet: {
        publicKey: new PublicKey(dto.address.wallet.publicKey),
      },
    },
  };
  return dapp;
}
