import type {
  Address,
  AddressType,
  DappAddress,
} from '../address/addresses.interface';
import type { AccountAddress } from '../auth/auth.interface';

export interface Wallets {
  readonly address: AccountAddress;
  readonly addresses: WalletAddresses;
  readonly dappAddresses: WalletDappAddresses;
  readonly messages: WalletMessages;
  readonly notificationSubscriptions: WalletNotificationSubscriptions;
  readonly pushNotificationSubscriptions: WalletPushNotificationSubscriptions;
}

export interface Wallet {
  readonly address: AccountAddress;
}

export interface WalletAddresses {
  create(command: CreateAddressCommand): Promise<Address>;

  update(command: PartialUpdateAddressCommand): Promise<Address>;

  delete(command: DeleteAddressCommand): Promise<void>;

  find(query: FindAddressQuery): Promise<Address | null>;

  findAll(): Promise<Address[]>;

  verify(command: VerifyAddressCommand): Promise<Address>;

  resendVerificationCode(command: ResendVerificationCodeCommand): Promise<void>;
}

export interface CreateAddressCommand {
  readonly value: string;
  readonly type: AddressType;
}

export interface PartialUpdateAddressCommand {
  readonly addressId: string;
  readonly value?: string;
}

export interface FindAddressQuery {
  readonly addressId: string;
}

export interface DeleteAddressCommand {
  readonly addressId: string;
}

export interface VerifyAddressCommand {
  readonly addressId: string;
  readonly code: string;
}

export interface ResendVerificationCodeCommand {
  readonly addressId: string;
}

export interface WalletDappAddresses {
  create(command: CreateDappAddressCommand): Promise<DappAddress>;

  update(command: PartialUpdateDappAddressCommand): Promise<DappAddress>;

  delete(command: DeleteDappAddressCommand): Promise<void>;

  find(query: FindDappAddressQuery): Promise<DappAddress | null>;

  findAll(query?: FindDappAddressesQuery): Promise<DappAddress[]>;
}

export interface CreateDappAddressCommand {
  readonly dappAccountAddress: AccountAddress;
  readonly addressId: string;
  readonly enabled: boolean;
}

export interface PartialUpdateDappAddressCommand {
  readonly dappAddressId: string;
  readonly enabled?: boolean;
}

export interface FindDappAddressQuery {
  readonly dappAddressId: string;
}

export interface FindDappAddressesQuery {
  readonly addressIds?: string[];
  readonly dappAccountAddress?: AccountAddress;
}

export interface DeleteDappAddressCommand {
  readonly dappAddressId: string;
}

export interface WalletMessages {
  findAllFromDapps(query?: FindDappMessageQuery): Promise<DappMessage[]>;
}

export interface DappMessage {
  text: string;
  timestamp: Date;
  author: AccountAddress;
}

export interface FindDappMessageQuery {
  readonly skip?: number;
  readonly take?: number;
  readonly dappVerified?: boolean;
}

export interface WalletNotificationSubscriptions {
  findAll(
    query: FindNotificationSubscriptionQuery,
  ): Promise<WalletNotificationSubscription[]>;

  upsert(
    command: UpsertNotificationSubscriptionCommand,
  ): Promise<WalletNotificationSubscription>;
}

export interface WalletPushNotificationSubscriptions {
  delete(physicalId: string): Promise<void>;

  upsert(
    command: UpsertPushNotificationSubscriptionCommand,
  ): Promise<WalletPushNotificationSubscription>;

  get(physicalId: string): Promise<WalletPushNotificationSubscription>;
}

export interface FindNotificationSubscriptionQuery {
  readonly dappAccountAddress: AccountAddress;
}

export interface WalletNotificationSubscription {
  notificationType: NotificationType;
  subscription: NotificationSubscription;
}

export interface WalletPushNotificationSubscription {
  walletAddress: string;
  physicalId: string;
  token: string;
}

export class NotificationSubscription {
  wallet!: Wallet;
  config!: NotificationConfig;
}

export interface NotificationType {
  id: string;
  name: string;
  humanReadableId: string;
  trigger?: string;
  orderingPriority?: number;
  tags: string[];
  defaultConfig: NotificationConfig;
  dappId: string;
}

export interface NotificationConfig {
  enabled: boolean;
}

export interface UpsertNotificationSubscriptionCommand {
  readonly notificationTypeId: string;
  readonly config: NotificationConfig;
}

export interface UpsertPushNotificationSubscriptionCommand {
  readonly physicalId: string;
  readonly token: string;
}
