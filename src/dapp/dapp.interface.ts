import type { PublicKey } from '@solana/web3.js';
import type { DappAddress } from '@address/addresses.interface';

export interface Dapps {
  create(command: CreateDappCommand): Promise<Dapp>;
  find(query?: FindDappQuery): Promise<Dapp>;
}

export interface Dapp {
  publicKey: PublicKey;
  dappAddresses: DappAddresses;

  // notify(command: NotifyCommand): Promise<void>;
}

export interface DappAddresses {
  findAll(): Promise<DappAddress[]>;
}

export interface FindDappQuery {
  publicKey: PublicKey;
}

export interface CreateDappCommand {
  publicKey: PublicKey;
}

//
// export type NotifyCommand = BroadcastNotifyCommand | UnicastNotifyCommand;
//
// interface BroadcastNotifyCommand {
//   title: string;
//   message: string;
// }
//
// interface UnicastNotifyCommand {
//   title: string;
//   message: string;
//   wallets: PublicKey[];
// }
//

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
