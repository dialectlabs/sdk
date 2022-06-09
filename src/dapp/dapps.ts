import type { PublicKey } from '@solana/web3.js';

export interface Dapps {
  create(command: CreateDappCommand): Promise<Dapp>;

  remove(command: DeleteDappCommand): Promise<void>;

  find(query: FindDappQuery): Promise<Dapp | null>;
}

interface Dapp {
  publicKey: PublicKey;
  subscribers: DappSubscribers;

  notify(command: NotifyCommand): Promise<void>;
}

export type NotifyCommand = BroadcastNotifyCommand | UnicastNotifyCommand;

interface BroadcastNotifyCommand {
  title: string;
  message: string;
}

interface UnicastNotifyCommand {
  title: string;
  message: string;
  wallets: PublicKey[];
}

interface DappSubscribers {
  list(): Promise<DappSubscriber>;
}

export interface DappSubscriber {
  publicKey: string;
  email?: string;
  phoneNumber?: string;
  tgChatId?: string;
}

export interface CreateDappCommand {
  publicKey: PublicKey;
  telegramBotToken?: string;
  twilioApiKey?: string;
}

export interface DeleteDappCommand {
  publicKey: PublicKey;
  telegramBotToken?: string;
  twilioApiKey?: string;
}

export interface FindDappQuery {
  publicKey: PublicKey;
}

export interface Wallets {
  addresses: Addresses;
}

export interface Addresses {
  list(): Promise<Address[]>;

  save(command: UpsertAddressCommand): Promise<Address>;
}

export interface UpsertAddressCommand {
  type: string;
  enabled: boolean;
}

export interface Address {
  type: string;
  enabled: boolean;

  update(command: UpdateAddressCommand): Promise<Address>;

  verify(command: VerifyAddressCommand): Promise<Address>;

  delete(command: DeleteAddressCommand): Promise<void>;
}

export interface VerifyAddressCommand {
  dapp: PublicKey;
  code: string;
}

export interface DeleteAddressCommand {
  dapp: PublicKey;
  code: string;
}

export interface UpdateAddressCommand {
  dapp: PublicKey;
  enabled?: boolean;
}
