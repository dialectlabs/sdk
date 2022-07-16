import type { PublicKey } from '@solana/web3.js';
import type { DappAddress } from '@address/addresses.interface';

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
}

export type ReadOnlyDapp = Omit<Dapp, 'dappAddresses' | 'messages'>;

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
