import type {
  CreateAddressCommand,
  CreateDappAddressCommand,
  DeleteAddressCommand,
  DeleteDappAddressCommand,
  FindAddressQuery,
  FindDappAddressesQuery,
  FindDappAddressQuery,
  PartialUpdateAddressCommand,
  PartialUpdateDappAddressCommand,
  ResendVerificationCodeCommand,
  VerifyAddressCommand,
  WalletAddresses,
  WalletDappAddresses,
  Wallets,
} from '@wallet/wallet.interface';
import type { PublicKey } from '@solana/web3.js';
import type { Address, DappAddress } from '@address/addresses.interface';
import { AddressType } from '@address/addresses.interface';
import type { AddressTypeV0 } from '@data-service-api/data-service-wallets-api.v0';
import { IllegalArgumentError, UnsupportedOperationError } from '@sdk/errors';
import type { DataServiceWalletAddressesApi } from '@data-service-api/data-service-wallet-addresses-api';
import type { DataServiceWalletDappAddressesApi } from '@data-service-api/data-service-wallet-dapp-addresses-api';

export class DataServiceWallets implements Wallets {
  addresses: WalletAddresses;
  dappAddresses: WalletDappAddresses;

  constructor(
    readonly publicKey: PublicKey,
    private readonly dataServiceWalletAddressesApi: DataServiceWalletAddressesApi,
    private readonly dataServiceWalletDappAddressesApi: DataServiceWalletDappAddressesApi,
  ) {
    this.addresses = new DataServiceWalletAddresses(
      dataServiceWalletAddressesApi,
    );
    this.dappAddresses = new DataServiceWalletDappAddresses(
      dataServiceWalletDappAddressesApi,
    );
  }
}

export class DataServiceWalletAddresses implements WalletAddresses {
  constructor(private readonly api: DataServiceWalletAddressesApi) {}

  private static toAddressType(type: AddressType): AddressTypeV0 {
    switch (type) {
      case AddressType.Email:
        return 'email';
      case AddressType.PhoneNumber:
        return 'sms';
      case AddressType.Telegram:
        return 'telegram';
      case AddressType.Wallet:
        return 'wallet';
    }
    throw new IllegalArgumentError(`Unknown address type ${type}`);
  }

  create(command: CreateAddressCommand): Promise<Address> {
    throw new UnsupportedOperationError('Not implemented');
  }

  delete(command: DeleteAddressCommand): Promise<void> {
    throw new UnsupportedOperationError('Not implemented');
  }

  find(query: FindAddressQuery): Promise<Address | null> {
    throw new UnsupportedOperationError('Not implemented');
  }

  findAll(): Promise<Address[]> {
    return Promise.resolve([]);
  }

  resendVerificationCode(
    command: ResendVerificationCodeCommand,
  ): Promise<void> {
    throw new UnsupportedOperationError('Not implemented');
  }

  update(command: PartialUpdateAddressCommand): Promise<Address> {
    throw new UnsupportedOperationError('Not implemented');
  }

  verify(command: VerifyAddressCommand): Promise<Address> {
    throw new UnsupportedOperationError('Not implemented');
  }
}

export class DataServiceWalletDappAddresses implements WalletDappAddresses {
  constructor(private readonly api: DataServiceWalletDappAddressesApi) {}

  create(command: CreateDappAddressCommand): Promise<DappAddress> {
    throw new UnsupportedOperationError('Not implemented');
  }

  delete(command: DeleteDappAddressCommand): Promise<void> {
    throw new UnsupportedOperationError('Not implemented');
  }

  find(query: FindDappAddressQuery): Promise<DappAddress | null> {
    throw new UnsupportedOperationError('Not implemented');
  }

  findAll(query: FindDappAddressesQuery): Promise<DappAddress[]> {
    throw new UnsupportedOperationError('Not implemented');
  }

  update(command: PartialUpdateDappAddressCommand): Promise<DappAddress> {
    throw new UnsupportedOperationError('Not implemented');
  }
}
