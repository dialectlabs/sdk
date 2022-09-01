import type {
  MessageSignerWalletAdapterProps,
  SignerWalletAdapterProps,
} from '@solana/wallet-adapter-base/lib/types/signer';
import type { PublicKey } from '@solana/web3.js';
import type { Backend } from '../sdk/sdk.interface';

export interface ApiAvailability {
  supportedBackends: Backend[];
  canEncrypt: boolean;
}

export interface DialectWalletAdapter {
  publicKey?: PublicKey;
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
