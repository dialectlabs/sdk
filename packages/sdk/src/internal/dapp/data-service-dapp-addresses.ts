import type { DappAddress } from '../../address/addresses.interface';
import { toAddressType } from '../../address/addresses.interface';
import { PublicKey } from '@solana/web3.js';
import type { DappAddresses } from '../../dapp/dapp.interface';
import type { DataServiceDappsApi } from '../data-service-api/data-service-dapps-api';
import type { DappAddressDto } from '../data-service-api/data-service-dapps-api';
import { withErrorParsing } from '../messaging/solana-messaging-errors';

export class DataServiceDappAddresses implements DappAddresses {
  constructor(private readonly dataServiceDappsApi: DataServiceDappsApi) {}

  async findAll(): Promise<DappAddress[]> {
    const dappAddressesDtos = await withErrorParsing(
      this.dataServiceDappsApi.findAllDappAddresses(),
    );
    return dappAddressesDtos.map((it) => toDappAddress(it));
  }
}

export function toDappAddress(dto: DappAddressDto) {
  const dapp: DappAddress = {
    id: dto.id,
    enabled: dto.enabled,
    channelId: dto.channelId,
    address: {
      id: dto.address.id,
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
