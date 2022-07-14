import type {
  CreateAddressCommand,
  CreateDappAddressCommand,
  DappMessage,
  DeleteAddressCommand,
  DeleteDappAddressCommand,
  FindAddressQuery,
  FindDappAddressesQuery,
  FindDappAddressQuery,
  FindDappMessageQuery,
  PartialUpdateAddressCommand,
  PartialUpdateDappAddressCommand,
  ResendVerificationCodeCommand,
  VerifyAddressCommand,
  WalletAddresses,
  WalletDappAddresses,
  WalletDappMessages,
  WalletDappNotificationConfigs,
  Wallets,
} from '@wallet/wallet.interface';
import { PublicKey } from '@solana/web3.js';
import type { Address, DappAddress } from '@address/addresses.interface';
import { toAddressType, toAddressTypeDto } from '@address/addresses.interface';
import { ResourceNotFoundError } from '@sdk/errors';
import type { DataServiceWalletAddressesApi } from '@data-service-api/data-service-wallet-addresses-api';
import type { DataServiceWalletDappAddressesApi } from '@data-service-api/data-service-wallet-dapp-addresses-api';
import type { AddressDto } from '@data-service-api/data-service-dapps-api';
import { withErrorParsing } from '@data-service-api/data-service-errors';
import type { DataServiceApiClientError } from '@data-service-api/data-service-api';
import type { DataServiceWalletMessagesApi } from '@data-service-api/data-service-wallet-messages-api';
import type { TextSerde } from '@dialectlabs/web3';
import { UnencryptedTextSerde } from '@dialectlabs/web3';
import { toDappAddress } from '@dapp/internal/data-service-dapp-addresses';

export class DataServiceWallets implements Wallets {
  addresses: WalletAddresses;
  dappAddresses: WalletDappAddresses;
  dappMessages: WalletDappMessages;
  dappNotificationSubscriptionConfigs: WalletDappNotificationConfigs = null!; // TODO: implement

  constructor(
    readonly publicKey: PublicKey,
    private readonly dataServiceWalletAddressesApi: DataServiceWalletAddressesApi,
    private readonly dataServiceWalletDappAddressesApi: DataServiceWalletDappAddressesApi,
    private readonly dataServiceWalletMessagesApi: DataServiceWalletMessagesApi,
  ) {
    this.addresses = new DataServiceWalletAddresses(
      dataServiceWalletAddressesApi,
    );
    this.dappAddresses = new DataServiceWalletDappAddresses(
      dataServiceWalletDappAddressesApi,
    );
    this.dappMessages = new DataServiceWalletDappMessages(
      dataServiceWalletMessagesApi,
    );
  }
}

export class DataServiceWalletAddresses implements WalletAddresses {
  constructor(private readonly api: DataServiceWalletAddressesApi) {}

  async create(command: CreateAddressCommand): Promise<Address> {
    const created = await withErrorParsing(
      this.api.create({
        value: command.value,
        type: toAddressTypeDto(command.type),
      }),
    );
    return toAddress(created);
  }

  async delete(command: DeleteAddressCommand): Promise<void> {
    return withErrorParsing(this.api.delete(command.addressId));
  }

  async find(query: FindAddressQuery): Promise<Address | null> {
    try {
      const addressDto = await withErrorParsing(this.api.find(query.addressId));
      return toAddress(addressDto);
    } catch (e) {
      const err = e as DataServiceApiClientError;
      if (err instanceof ResourceNotFoundError) return null;
      throw e;
    }
  }

  async findAll(): Promise<Address[]> {
    const addressDtos = await withErrorParsing(this.api.findAll());
    return addressDtos.map((it) => toAddress(it));
  }

  resendVerificationCode(
    command: ResendVerificationCodeCommand,
  ): Promise<void> {
    return withErrorParsing(this.api.resendVerificationCode(command.addressId));
  }

  async update(command: PartialUpdateAddressCommand): Promise<Address> {
    const patched = await withErrorParsing(
      this.api.patch(command.addressId, {
        value: command.value,
      }),
    );
    return toAddress(patched);
  }

  async verify(command: VerifyAddressCommand): Promise<Address> {
    const verified = await withErrorParsing(
      this.api.verify(command.addressId, {
        code: command.code,
      }),
    );
    return toAddress(verified);
  }
}

export class DataServiceWalletDappAddresses implements WalletDappAddresses {
  constructor(private readonly api: DataServiceWalletDappAddressesApi) {}

  async create(command: CreateDappAddressCommand): Promise<DappAddress> {
    const created = await withErrorParsing(
      this.api.create({
        addressId: command.addressId,
        dappPublicKey: command.dappPublicKey.toBase58(),
        enabled: command.enabled,
      }),
    );
    return toDappAddress(created);
  }

  delete(command: DeleteDappAddressCommand): Promise<void> {
    return withErrorParsing(this.api.delete(command.dappAddressId));
  }

  async find(query: FindDappAddressQuery): Promise<DappAddress | null> {
    try {
      const found = await withErrorParsing(this.api.find(query.dappAddressId));
      return toDappAddress(found);
    } catch (e) {
      const err = e as DataServiceApiClientError;
      if (err instanceof ResourceNotFoundError) return null;
      throw e;
    }
  }

  async findAll(query: FindDappAddressesQuery): Promise<DappAddress[]> {
    const found = await withErrorParsing(
      this.api.findAll({
        addressIds: query.addressIds,
        dappPublicKey: query.dappPublicKey?.toBase58(),
      }),
    );
    return found.map((it) => toDappAddress(it));
  }

  async update(command: PartialUpdateDappAddressCommand): Promise<DappAddress> {
    const found = await withErrorParsing(
      this.api.patch(command.dappAddressId, {
        enabled: command.enabled,
      }),
    );
    return toDappAddress(found);
  }
}

export class DataServiceWalletDappMessages implements WalletDappMessages {
  private readonly textSerde: TextSerde = new UnencryptedTextSerde();

  constructor(private readonly api: DataServiceWalletMessagesApi) {}

  async findAll(query?: FindDappMessageQuery): Promise<DappMessage[]> {
    const dappMessages = await this.api.findAllDappMessages({
      skip: query?.skip,
      take: query?.take,
      dappVerified: query?.dappVerified,
    });
    return dappMessages.map((it) => ({
      author: new PublicKey(it.owner),
      timestamp: new Date(it.timestamp),
      text: this.textSerde.deserialize(new Uint8Array(it.text)),
    }));
  }
}

function toAddress(addressDto: AddressDto): Address {
  return {
    id: addressDto.id,
    value: addressDto.value,
    verified: addressDto.verified,
    type: toAddressType(addressDto.type),
    wallet: {
      publicKey: new PublicKey(addressDto.wallet.publicKey),
    },
  };
}
