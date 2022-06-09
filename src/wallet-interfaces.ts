import type {
  MessageSignerWalletAdapterProps,
  SignerWalletAdapterProps,
} from '@solana/wallet-adapter-base/lib/types/signer';
import type { PublicKey } from '@solana/web3.js';

/**
 * Based on ISP and SRP
 */
export interface Web3User {
  publicKey: PublicKey;
}

/**
 * Encryption needed for encryption
 * Based on ISP and SRP
 */
export interface EncryptionKeyProviderWalletAdapterProps {
  diffieHellman(
    publicKey: Uint8Array,
  ): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }>;
}

/**
 * Wallet interface for doing write operations in dialect program: web3 only
 * Based on ISP and SRP
 */
export interface Web3Wallet extends Web3User, SignerWalletAdapterProps {}

export interface Web3EncryptedMessagingWallet
  extends Web3Wallet,
    EncryptionKeyProviderWalletAdapterProps {}

/**
 * Signer wallet needed to authN in data-service: web2 only
 * Based on ISP and SRP
 */
export interface Web2Wallet extends Web3User, MessageSignerWalletAdapterProps {}

export interface Web2EncryptedMessagingWallet
  extends Web2Wallet,
    EncryptionKeyProviderWalletAdapterProps {}

export type Wallet =
  | Web2Wallet
  | Web2EncryptedMessagingWallet
  | Web3Wallet
  | Web3EncryptedMessagingWallet;
