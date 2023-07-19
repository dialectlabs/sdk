import type {
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import type { DialectSolanaWalletAdapter } from './dialect-solana-wallet-adapter.interface';
import { UnsupportedOperationError } from '@dialectlabs/sdk';

export class DialectSolanaWalletAdapterWrapper
  implements DialectSolanaWalletAdapter
{
  constructor(private readonly delegate: DialectSolanaWalletAdapter) {}

  get publicKey(): PublicKey {
    if (!this.delegate.publicKey) {
      throw new UnsupportedOperationError(
        'Public key not available',
        'Wallet does not have public key, please provide a valid public key.',
      );
    }
    return this.delegate.publicKey;
  }

  get canEncrypt(): boolean {
    return Boolean(this.publicKey && this.delegate.diffieHellman);
  }

  static create(
    adapter: DialectSolanaWalletAdapter,
  ): DialectSolanaWalletAdapterWrapper {
    return new DialectSolanaWalletAdapterWrapper(adapter);
  }

  signTransaction<T extends Transaction | VersionedTransaction>(
    transaction: T,
  ): Promise<T> {
    if (!this.delegate.signTransaction) {
      throw new UnsupportedOperationError(
        'Signing not supported',
        'Wallet does not support signing, please use wallet-adapter that supports signTransaction() operation.',
      );
    }
    return this.delegate.signTransaction(transaction);
  }

  signAllTransactions<T extends Transaction | VersionedTransaction>(
    transactions: T[],
  ): Promise<T[]> {
    if (!this.delegate.signAllTransactions) {
      throw new UnsupportedOperationError(
        'Signing not supported',
        'Wallet does not support signing, please use wallet-adapter that supports signAllTransactions() operation.',
      );
    }
    return this.delegate.signAllTransactions(transactions);
  }

  signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this.delegate.signMessage) {
      throw new UnsupportedOperationError(
        'Message signing not supported',
        'Wallet does not support message signing, please use wallet-adapter that supports signMessage() operation.',
      );
    }
    return this.delegate.signMessage(message);
  }

  diffieHellman(): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
    if (!this.delegate.diffieHellman) {
      throw new UnsupportedOperationError(
        'Encryption not supported',
        'Wallet does not support encryption, please use wallet-adapter that supports diffieHellman() operation.',
      );
    }
    return this.delegate.diffieHellman(this.publicKey.toBytes());
  }

  canSignMessage(): boolean {
    return Boolean(this.delegate.signMessage);
  }

  canSignTransaction(): boolean {
    return Boolean(this.delegate.signTransaction);
  }
}
