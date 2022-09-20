import type { Address, DappAddress } from '../../address/addresses.interface';
import {
  toAddressType,
  toAddressTypeDto,
} from '../../address/addresses.interface';
import { toDappAddress } from '../dapp/data-service-dapp-addresses';
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
  FindNotificationSubscriptionQuery,
  PartialUpdateAddressCommand,
  PartialUpdateDappAddressCommand,
  ResendVerificationCodeCommand,
  UpsertNotificationSubscriptionCommand,
  UpsertPushNotificationSubscriptionCommand,
  VerifyAddressCommand,
  WalletAddresses,
  WalletDappAddresses,
  WalletMessages,
  WalletNotificationSubscription,
  WalletNotificationSubscriptions,
  WalletPushNotificationSubscription,
  WalletPushNotificationSubscriptions,
  Wallets,
} from '../../wallet/wallet.interface';
import type { DataServiceWalletAddressesApi } from '../../../data-service-api/data-service-wallet-addresses-api';
import type { DataServiceApiClientError } from '../../../data-service-api/data-service-api';
import type { DataServiceWalletMessagesApi } from '../../../data-service-api/data-service-wallet-messages-api';
import { TextSerde, UnencryptedTextSerde } from '@dialectlabs/web3';
import type {
  DataServiceWalletNotificationSubscriptionsApi,
  WalletNotificationSubscriptionDto,
} from '../../../data-service-api/data-service-wallet-notification-subscriptions-api';
import type { DataServiceWalletDappAddressesApi } from '../../../data-service-api/data-service-wallet-dapp-addresses-api';
import type { AddressDto } from '../../../data-service-api/data-service-dapps-api';
import { ResourceNotFoundError } from '../../sdk/errors';
import type { DataServicePushNotificationSubscriptionsApi } from '../../../data-service-api/data-service-push-notification-subscriptions-api';
import { withErrorParsing } from '../../../data-service-api/data-service-errors';
import type { AccountAddress } from '../../auth/auth.interface';

export class DataServiceWallets implements Wallets {
  addresses: WalletAddresses;
  dappAddresses: WalletDappAddresses;
  messages: WalletMessages;
  notificationSubscriptions: WalletNotificationSubscriptions;
  pushNotificationSubscriptions: WalletPushNotificationSubscriptions;

  constructor(
    readonly address: AccountAddress,
    private readonly dataServiceWalletAddressesApi: DataServiceWalletAddressesApi,
    private readonly dataServiceWalletDappAddressesApi: DataServiceWalletDappAddressesApi,
    private readonly dataServiceWalletMessagesApi: DataServiceWalletMessagesApi,
    private readonly dataServiceWalletNotificationSubscriptionsApi: DataServiceWalletNotificationSubscriptionsApi,
    private readonly dataServicePushWalletNotificationSubscriptionsApi: DataServicePushNotificationSubscriptionsApi,
  ) {
    this.addresses = new DataServiceWalletAddresses(
      dataServiceWalletAddressesApi,
    );
    this.dappAddresses = new DataServiceWalletDappAddresses(
      dataServiceWalletDappAddressesApi,
    );
    this.messages = new DataServiceWalletMessages(dataServiceWalletMessagesApi);
    this.notificationSubscriptions =
      new DataServiceWalletNotificationSubscriptions(
        dataServiceWalletNotificationSubscriptionsApi,
      );
    this.pushNotificationSubscriptions =
      new DataServiceWalletPushNotificationSubscriptions(
        dataServicePushWalletNotificationSubscriptionsApi,
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
        dappPublicKey: command.address.toString(),
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
        dappPublicKey: query.dappAddress?.toString(),
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

export class DataServiceWalletMessages implements WalletMessages {
  private readonly textSerde: TextSerde = new UnencryptedTextSerde();

  constructor(private readonly api: DataServiceWalletMessagesApi) {}

  async findAllFromDapps(query?: FindDappMessageQuery): Promise<DappMessage[]> {
    const dappMessages = await withErrorParsing(
      this.api.findAllDappMessages({
        skip: query?.skip,
        take: query?.take,
        dappVerified: query?.dappVerified,
      }),
    );
    return dappMessages.map((it) => ({
      author: it.owner,
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
      address: addressDto.wallet.publicKey,
    },
  };
}

export class DataServiceWalletNotificationSubscriptions
  implements WalletNotificationSubscriptions
{
  constructor(
    private readonly api: DataServiceWalletNotificationSubscriptionsApi,
  ) {}

  async findAll(
    query: FindNotificationSubscriptionQuery,
  ): Promise<WalletNotificationSubscription[]> {
    const dtos = await withErrorParsing(
      this.api.findAll({
        dappPublicKey: query?.dappAddress?.toString(),
      }),
    );
    return dtos.map(fromNotificationSubscriptionDto);
  }

  async upsert(
    command: UpsertNotificationSubscriptionCommand,
  ): Promise<WalletNotificationSubscription> {
    const dto = await withErrorParsing(this.api.upsert(command));
    return fromNotificationSubscriptionDto(dto);
  }
}

function fromNotificationSubscriptionDto(
  dto: WalletNotificationSubscriptionDto,
): WalletNotificationSubscription {
  return {
    notificationType: dto.notificationType,
    subscription: {
      wallet: {
        address: dto.subscription.wallet.publicKey,
      },
      config: dto.subscription.config,
    },
  };
}

export class DataServiceWalletPushNotificationSubscriptions
  implements WalletPushNotificationSubscriptions
{
  constructor(
    private readonly api: DataServicePushNotificationSubscriptionsApi,
  ) {}

  async delete(physicalId: string): Promise<void> {
    await withErrorParsing(this.api.delete(physicalId));
  }

  async upsert(
    command: UpsertPushNotificationSubscriptionCommand,
  ): Promise<WalletPushNotificationSubscription> {
    const dto = await this.api.upsert(command);
    return {
      ...dto,
      walletAddress: dto.walletPublicKey,
    };
  }

  async get(physicalId: string): Promise<WalletPushNotificationSubscription> {
    const dto = await this.api.get(physicalId);
    return {
      ...dto,
      walletAddress: dto.walletPublicKey,
    };
  }
}
