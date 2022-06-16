import type { PublicKey } from '@solana/web3.js';
import type { DappAddress } from '@address/addresses.interface';

export interface Wallet {
  publicKey: PublicKey;
  addresses: WalletAddresses;
}

export interface WalletAddresses {
  create(command: CreateAddressCommand): Promise<DappAddress>;
  delete(command: DeleteAddressCommand): Promise<void>;
  findAll(command: FindWalletDappAddressQuery): Promise<DappAddress[]>;
}

export interface CreateAddressCommand {
  type: string;
  value: string;
  enabled: boolean;
  dappPublicKey: PublicKey;
}

export interface DeleteAddressCommand {
  addressId: string;
}

export interface FindWalletDappAddressQuery {
  dappPublicKey: PublicKey;
}
