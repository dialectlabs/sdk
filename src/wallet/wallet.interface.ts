import type { PublicKey } from '@solana/web3.js';
import type {
  Address,
  AddressType,
  DappAddress,
} from '@address/addresses.interface';

export interface Wallets {
  publicKey: PublicKey;
  addresses: WalletAddresses;
  dappAddresses: WalletDappAddresses;
}

export interface Wallet {
  publicKey: PublicKey;
}

export interface WalletAddresses {
  create(command: CreateAddressCommand): Promise<Address>;

  update(command: PartialUpdateAddressCommand): Promise<Address>;

  delete(command: DeleteAddressCommand): Promise<void>;

  find(query: FindAddressQuery): Promise<Address | null>;

  findAll(): Promise<Address[]>;

  verify(command: VerifyAddressCommand): Promise<Address>;

  resendVerificationCode(command: ResendVerificationCodeCommand): Promise<void>;
}

export interface CreateAddressCommand {
  readonly value: string;
  readonly type: AddressType;
}

export interface PartialUpdateAddressCommand {
  readonly value?: string;
}

export interface FindAddressQuery {
  readonly addressId: string;
}

export interface DeleteAddressCommand {
  readonly addressId: string;
}

export interface VerifyAddressCommand {
  readonly addressId: string;
  readonly code: string;
}

export interface ResendVerificationCodeCommand {
  readonly addressId: string;
}

export interface WalletDappAddresses {
  create(command: CreateDappAddressCommand): Promise<DappAddress>;

  update(command: PartialUpdateDappAddressCommand): Promise<DappAddress>;

  delete(command: DeleteDappAddressCommand): Promise<void>;

  find(query: FindDappAddressQuery): Promise<DappAddress | null>;

  findAll(query?: FindDappAddressesQuery): Promise<DappAddress[]>;
}

export interface CreateDappAddressCommand {
  readonly dappPublicKey: PublicKey;
  readonly addressId: string;
  readonly enabled: boolean;
}

export interface PartialUpdateDappAddressCommand {
  readonly enabled?: boolean;
}

export interface FindDappAddressQuery {
  dappAddressId: string;
}

export interface FindDappAddressesQuery {
  readonly addressIds?: string[];
  readonly dappPublicKey?: PublicKey;
}

export interface DeleteDappAddressCommand {
  dappAddressId: string;
}
