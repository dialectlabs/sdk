import type { PublicKey } from '@solana/web3.js';
import type {
  Address,
  AddressType,
  DappAddress,
} from '@address/addresses.interface';

export interface Wallets {
  readonly publicKey: PublicKey;
  readonly addresses: WalletAddresses;
  readonly dappAddresses: WalletDappAddresses;
  readonly dappMessages: WalletDappMessages;
}

export interface Wallet {
  readonly publicKey: PublicKey;
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
  readonly addressId: string;
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
  readonly dappAddressId: string;
  readonly enabled?: boolean;
}

export interface FindDappAddressQuery {
  readonly dappAddressId: string;
}

export interface FindDappAddressesQuery {
  readonly addressIds?: string[];
  readonly dappPublicKey?: PublicKey;
}

export interface DeleteDappAddressCommand {
  readonly dappAddressId: string;
}

export interface WalletDappMessages {
  findAll(query?: FindDappMessageQuery): Promise<DappMessage[]>;
}

export interface DappMessage {
  text: string;
  timestamp: Date;
  author: PublicKey;
}

export interface FindDappMessageQuery {
  readonly skip?: number;
  readonly take?: number;
}
