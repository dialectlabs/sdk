import type { AddressType, DappAddress } from '../address/addresses.interface';
import type { NotificationConfig, NotificationSubscription, NotificationType } from '../wallet/wallet.interface';
import type { AccountAddress } from '../auth/auth.interface';

export interface Dapps {
  create(command: CreateDappCommand): Promise<Dapp>;

  find(): Promise<Dapp | null>;

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

export interface DappTelegramBotConfiguration {
  token: string;
}

export interface FindDappQuery {
  verified?: boolean;
  blockchainType?: BlockchainType;
}


export interface SmartMessageParams { // TODO: Just a marker interface for now??

}

export interface DappMessageAction {
  label: string;
  url: string;
}

export enum DappMessageActionType {
  LINK = 'Link',
  SMART_MESSAGE = 'SignTransaction',
}

interface DappMessageActionV2Base {
  type: DappMessageActionType;
}


export interface DappMessageLinkAction extends DappMessageActionV2Base {
  type: DappMessageActionType.LINK;
  label: string;
  url: string;
}

export interface SmartMessageAction extends DappMessageActionV2Base {
  type: DappMessageActionType.SMART_MESSAGE;
  smartMessage: SmartMessage;
}
export interface SmartMessage {
  transactionServiceId: string;
  transactionParams: SmartMessageParams;
}


export interface SendDappMessageCommandBase {
  message: string;
  title?: string;
  notificationTypeId?: string;
  addressTypes?: AddressType[];
  // tags?: string[];
  actions?: DappMessageAction[]; // TODO: deprecate it, I think it's ok to intro breaking change since only tensor and our dashboard uses it atm
}

export type BroadcastDappMessageCommand = SendDappMessageCommandBase;

export type ActionsV3 = LinkOnlyActions | SmartMessageAction;

export interface LinkOnlyActions {
  actions: [DappMessageLinkAction];
  // actions: [DappMessageLinkAction]; // TODO: we can allow single action in compile time using this notation
}


export interface UnicastDappMessageCommand extends SendDappMessageCommandBase {
  recipient: AccountAddress;
  // actionsV2: DappMessageActionV2[];
  actionsV3: ActionsV3;
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

