import type { DappAddress, DappAddresses } from '@dapp/dapp.interface';
import { AddressType } from '@dapp/dapp.interface';
import { PublicKey } from '@solana/web3.js';
import type { DataServiceDappsApi } from '@data-service-api/data-service-api';
import { AddressTypeDto } from '@data-service-api/data-service-api';
import { IllegalStateError } from '@sdk/errors';

export class DataServiceDappAddresses implements DappAddresses {
  constructor(private readonly dataServiceDappsApi: DataServiceDappsApi) {}

  async findAll(): Promise<DappAddress[]> {
    const dappAddressesDtos =
      await this.dataServiceDappsApi.findAllDappAddresses();
    return dappAddressesDtos.map((it) => {
      const dapp: DappAddress = {
        enabled: it.enabled,
        telegramChatId: it.telegramChatId,
        address: {
          type: DataServiceDappAddresses.toAddressType(it.address.type),
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

  private static toAddressType(addressTypeDto: AddressTypeDto): AddressType {
    switch (addressTypeDto) {
      case AddressTypeDto.Email:
        return AddressType.Email;
      case AddressTypeDto.Wallet:
        return AddressType.Wallet;
      case AddressTypeDto.Sms:
        return AddressType.PhoneNumber;
      case AddressTypeDto.Telegram:
        return AddressType.Telegram;
      default:
        throw new IllegalStateError('Should not happen');
    }
  }
}
