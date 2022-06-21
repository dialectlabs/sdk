import type { DappAddresses } from '@dapp/dapp.interface';

import { PublicKey } from '@solana/web3.js';
import { withErrorParsing } from '@data-service-api/data-service-errors';
import type { DataServiceDappsApi } from '@data-service-api/data-service-dapps-api';
import { DappAddress, toAddressType } from '@address/addresses.interface';

export class DataServiceDappAddresses implements DappAddresses {
  constructor(private readonly dataServiceDappsApi: DataServiceDappsApi) {}

  async findAll(): Promise<DappAddress[]> {
    const dappAddressesDtos = await withErrorParsing(
      this.dataServiceDappsApi.findAllDappAddresses(),
    );
    return dappAddressesDtos.map((it) => {
      const dapp: DappAddress = {
        id: it.id,
        enabled: it.enabled,
        telegramChatId: it.channelId,
        address: {
          id: it.id,
          type: toAddressType(it.address.type),
          value: it.address.value,
          verified: it.address.verified,
          wallet: {
            publicKey: new PublicKey(it.address.wallet.publicKey),
          },
        },
      };
      return dapp;
    });
  }
}
