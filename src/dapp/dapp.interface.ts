import type { PublicKey } from '@solana/web3.js';
import type { DappAddress } from '@address/addresses.interface';
import type {
  NotificationConfig,
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
  verified: boolean;
  dappAddresses: DappAddresses;
  messages: DappMessages;
  notificationTypes: DappNotificationTypes;
}

export type ReadOnlyDapp = Omit<
  Dapp,
  'dappAddresses' | 'messages' | 'notificationTypes'
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
}

export interface FindDappQuery {
  verified?: boolean;
}

export type SendDappMessageCommand =
  | BroadcastDappMessageCommand
  | UnicastDappMessageCommand
  | MulticastDappMessageCommand;

export interface BroadcastDappMessageCommand {
  title: string;
  message: string;
  notificationTypeId?: string;
}

export interface UnicastDappMessageCommand {
  title: string;
  message: string;
  recipient: PublicKey;
  notificationTypeId?: string;
}

export interface MulticastDappMessageCommand {
  title: string;
  message: string;
  recipients: PublicKey[];
  notificationTypeId?: string;
}

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
