import type { AddressType, DappAddress } from '../address/addresses.interface';
import type {
  NotificationConfig,
  NotificationSubscription,
  NotificationType,
} from '../wallet/wallet.interface';
import type { AccountAddress } from '../auth/auth.interface';

export interface Dapps {
  create(command: CreateDappCommand): Promise<Dapp>;

  find(): Promise<Dapp | null>;

  findAll(query?: FindDappQuery): Promise<ReadOnlyDapp[]>;
}

export declare const BlockchainType: {
  SOLANA: 'SOLANA';
  APTOS: 'APTOS';
  POLYGON: 'POLYGON';
};

export type BlockchainType = typeof BlockchainType[keyof typeof BlockchainType];

export interface Dapp {
  id: string;
  address: AccountAddress;
  name: string;
  description?: string;
  websiteUrl?: string;
  avatarUrl?: string;
  heroUrl?: string;
  verified: boolean;
  telegramUsername: string;
  blockchainType: BlockchainType;
  dappAddresses: DappAddresses;
  messages: DappMessages;
  notificationTypes: DappNotificationTypes;
  notificationSubscriptions: DappNotificationSubscriptions;
}

export type ReadOnlyDapp = Omit<
  Dapp,
  | 'dappAddresses'
  | 'messages'
  | 'notificationTypes'
  | 'notificationSubscriptions'
>;

export interface DappAddresses {
  findAll(): Promise<DappAddress[]>;
}

export interface DappMessages {
  send(command: SendDappMessageCommand): Promise<void>;
}

export interface CreateDappCommand {
  name: string;
  description?: string;
  websiteUrl?: string;
  avatarUrl?: string;
  heroUrl?: string;
  telegramBotConfiguration?: DappTelegramBotConfiguration;
}

export interface DappTelegramBotConfiguration {
  token: string;
}

export interface FindDappQuery {
  verified?: boolean;
  blockchainType?: BlockchainType;
}

export interface SendDappMessageCommandBase {
  message: string;
  title?: string;
  notificationTypeId?: string;
  addressTypes?: AddressType[];
}

export type BroadcastDappMessageCommand = SendDappMessageCommandBase;

export interface UnicastDappMessageCommand extends SendDappMessageCommandBase {
  recipient: AccountAddress;
}

export interface MulticastDappMessageCommand
  extends SendDappMessageCommandBase {
  recipients: AccountAddress[];
}

export type SendDappMessageCommand =
  | BroadcastDappMessageCommand
  | UnicastDappMessageCommand
  | MulticastDappMessageCommand;

export interface DappNotificationTypes {
  create(command: CreateNotificationTypeCommand): Promise<NotificationType>;

  findAll(): Promise<NotificationType[]>;

  find(id: string): Promise<NotificationType>;

  patch(
    id: string,
    command: PatchNotificationTypeCommand,
  ): Promise<NotificationType>;

  delete(id: string): Promise<void>;
}

export interface CreateNotificationTypeCommand {
  name: string;
  humanReadableId: string;
  trigger?: string;
  orderingPriority?: number;
  tags?: string[];
  defaultConfig: NotificationConfig;
}

export interface PatchNotificationTypeCommand {
  name?: string;
  humanReadableId?: string;
  trigger?: string;
  orderingPriority?: number;
  tags?: string[];
  defaultConfig?: NotificationConfig;
}

export interface DappNotificationSubscriptions {
  findAll(): Promise<DappNotificationSubscription[]>;
}

export class DappNotificationSubscription {
  notificationType!: NotificationType;
  subscriptions!: NotificationSubscription[];
}
