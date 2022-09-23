import type { MaybeHexString } from 'aptos';

export interface DialectAptosWalletAdapter {
  publicKey?: WalletAdapterProps['publicAccount']['publicKey'];
  address?: WalletAdapterProps['publicAccount']['address'];
  signMessage?: WalletAdapterProps['signMessage'];
}

export interface WalletAdapterProps {
  publicAccount: AccountKeys;
  signMessage(message: string): Promise<string>;
}

export type PublicKey = MaybeHexString;
export type Address = MaybeHexString;
export type AuthKey = MaybeHexString;

export interface AccountKeys {
  publicKey: PublicKey | null;
  address: Address | null;
  authKey: AuthKey | null;
}
