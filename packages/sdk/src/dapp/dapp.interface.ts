import type { AddressType, DappAddress } from '../address/addresses.interface';
import type {
  NotificationConfig,
  NotificationSubscription,
  NotificationType,
} from '../wallet/wallet.interface';
import type { AccountAddress } from '../auth/auth.interface';

export interface Dapps {
  create(command: CreateDappCommand): Promise<Dapp>;

  patch(command: PatchDappCommand): Promise<Dapp>;

  find(query?: FindOneDappQuery): Promise<Dapp | null>;

  findAll(query?: FindDappQuery): Promise<ReadOnlyDapp[]>;
}

export enum BlockchainType {
  SOLANA = 'SOLANA',
  APTOS = 'APTOS',
  EVM = 'EVM',
}

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
  blockchainType: BlockchainType;
}

export interface PatchDappCommand {
  name?: string;
  description?: string | null;
  websiteUrl?: string | null;
  avatarUrl?: string | null;
  heroUrl?: string | null;
}

export interface DappTelegramBotConfiguration {
  token: string;
}

export interface FindOneDappQuery {
  address?: AccountAddress;
}

export interface FindDappQuery {
  verified?: boolean;
  blockchainType?: BlockchainType;
}

export enum DappMessageActionType {
  LINK = 'Link',
  SMART_MESSAGE = 'SmartMessage',
}

interface DappMessageActionBase {
  type: DappMessageActionType;
}

export interface DappMessageLinksAction extends DappMessageActionBase {
  type: DappMessageActionType.LINK;
  links: [DappMessageLinkAction];
}
export interface DappMessageLinkAction {
  label: string;
  url: string;
}

export interface DappMessageSmartMessageAction extends DappMessageActionBase {
  type: DappMessageActionType.SMART_MESSAGE;
  smartMessage: SmartMessage;
}

export interface SmartMessage {
  transactionServiceId: string;
  transactionParams: SmartMessageParams;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SmartMessageParams {}

export interface SendDappMessageCommandBase {
  message: string;
  title?: string;
  imageUrl?: string;
  notificationTypeId?: string;
  addressTypes?: AddressType[];
  // tags?: string[];
}

export interface BroadcastDappMessageCommand
  extends SendDappMessageCommandBase {
  actionsV2?: DappMessageLinksAction;
}

export interface UnicastDappMessageCommand extends SendDappMessageCommandBase {
  recipient: AccountAddress;
  actionsV2?: DappMessageLinksAction | DappMessageSmartMessageAction;
}

export interface MulticastDappMessageCommand
  extends SendDappMessageCommandBase {
  recipients: AccountAddress[];
  actionsV2?: DappMessageLinksAction;
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
