import type {
  MessageSignerWalletAdapterProps,
  SignerWalletAdapterProps,
} from '@solana/wallet-adapter-base/lib/types/signer';

import type { WalletAddress } from '../internal/wallet/wallet-address';

import type { Backend } from '@sdk/sdk.interface';

export interface ApiAvailability {
  supportedBackends: Backend[];
  canEncrypt: boolean;
}

export interface DialectWalletAdapter {
  publicKey?: WalletAddress;
  signTransaction?: SignerWalletAdapterProps['signTransaction'];
  signAllTransactions?: SignerWalletAdapterProps['signAllTransactions'];
  signMessage?: MessageSignerWalletAdapterProps['signMessage'];
  diffieHellman?: MessageEncryptionWalletAdapterProps['diffieHellman'];
}

export interface MessageEncryptionWalletAdapterProps {
  diffieHellman(
    publicKey: Uint8Array,
  ): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }>;
}
