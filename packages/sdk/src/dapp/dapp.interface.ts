import type { PublicKey } from '@solana/web3.js';
import type { AddressType, DappAddress } from '@address/addresses.interface';
import type {
  NotificationConfig,
  NotificationSubscription,
  NotificationType,
} from '@wallet/wallet.interface';

export interface Dapps {
  create(command: CreateDappCommand): Promise<Dapp>;

  find(): Promise<Dapp | null>;

  findAll(query?: FindDappQuery): Promise<ReadOnlyDapp[]>;
}

export interface Dapp {
  publicKey: PublicKey;
  name: string;
  description?: string;
  avatarUrl?: string;
  verified: boolean;
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
  avatarUrl?: string;
}

export interface FindDappQuery {
  verified?: boolean;
}

export interface SendDappMessageCommandBase {
  message: string;
  title?: string;
  notificationTypeId?: string;
  addressTypes?: AddressType[];
}

export type BroadcastDappMessageCommand = SendDappMessageCommandBase;

export interface UnicastDappMessageCommand extends SendDappMessageCommandBase {
  recipient: PublicKey;
}

export interface MulticastDappMessageCommand
  extends SendDappMessageCommandBase {
  recipients: PublicKey[];
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
