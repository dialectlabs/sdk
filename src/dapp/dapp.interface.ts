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
  notifications: DappNotifications;
}

export type ReadOnlyDapp = Omit<Dapp, 'dappAddresses' | 'notifications'>;

export interface DappAddresses {
  findAll(): Promise<DappAddress[]>;
}

export interface DappNotifications {
  send(command: SendNotificationCommand): Promise<void>;
}

export interface CreateDappCommand {
  name: string;
  description?: string;
}

export interface FindDappQuery {
  verified?: boolean;
}

export type SendNotificationCommand =
  | BroadcastSendNotificationCommand
  | UnicastSendNotificationCommand
  | MulticastSendNotificationCommand;

export interface BroadcastSendNotificationCommand {
  title: string;
  message: string;
}

export interface UnicastSendNotificationCommand {
  title: string;
  message: string;
  receiver: PublicKey;
}

export interface MulticastSendNotificationCommand {
  title: string;
  message: string;
  receivers: PublicKey[];
}

//
//
// export interface DeleteDappCommand {
//   publicKey: PublicKey;
//   telegramBotToken?: string;
//   twilioApiKey?: string;
// }
//

//
// export interface Wallets {
//   addresses: Addresses;
// }
//
// export interface Addresses {
//   list(): Promise<Address[]>;
//
//   save(command: UpsertAddressCommand): Promise<Address>;
// }
//
// export interface UpsertAddressCommand {
//   type: string;
//   enabled: boolean;
// }
//
// export interface Address {
//   type: string;
//   enabled: boolean;
//
//   update(command: UpdateAddressCommand): Promise<Address>;
//
//   verify(command: VerifyAddressCommand): Promise<Address>;
//
//   delete(command: DeleteAddressCommand): Promise<void>;
// }
//
// export interface VerifyAddressCommand {
//   dapp: PublicKey;
//   code: string;
// }
//
// export interface DeleteAddressCommand {
//   dapp: PublicKey;
//   code: string;
// }
//
// export interface UpdateAddressCommand {
//   dapp: PublicKey;
//   enabled?: boolean;
// }
