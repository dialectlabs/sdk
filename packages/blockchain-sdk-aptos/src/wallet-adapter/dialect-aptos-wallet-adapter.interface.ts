import type { MaybeHexString } from 'aptos';

export interface DialectAptosWalletAdapter {
  publicKey?: WalletAdapterProps['publicAccount']['publicKey'];
  address?: WalletAdapterProps['publicAccount']['address'];
  signMessage?: WalletAdapterProps['signMessage'];
  signMessagePayload?: WalletAdapterProps['signMessagePayload'];
}

export type PublicKey = MaybeHexString;
export type Address = MaybeHexString;
export type AuthKey = MaybeHexString;

export interface AccountKeys {
  publicKey: PublicKey | null;
  address: Address | null;
  authKey: AuthKey | null;
}

export interface WalletAdapterProps {
  publicAccount: AccountKeys;
  signMessage(message: string): Promise<string>;
  signMessagePayload(payload: SignMessagePayload): Promise<SignMessageResponse>;
}

export interface SignMessagePayload {
  message: string;
  nonce: string;
}

export interface SignMessageResponse {
  fullMessage: string;
  message: string;
  nonce: string;
  prefix: string;
  signature: string;
}
