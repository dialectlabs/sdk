import type {
  ApiAvailability,
  DialectWalletAdapter,
} from '@wallet-adapter/dialect-wallet-adapter.interface';
import { UnsupportedOperationError } from '@sdk/errors';
import type { PublicKey, Transaction } from '@solana/web3.js';
import { Backend } from '@sdk/sdk.interface';

export class DialectWalletAdapterWrapper
  implements DialectWalletAdapter, ApiAvailability
{
  constructor(private readonly delegate: DialectWalletAdapter) {}

  get publicKey(): PublicKey {
    if (!this.delegate.publicKey) {
      throw new UnsupportedOperationError(
        'Public key not available',
        'Wallet does not have public key, please provide a valid public key.',
      );
    }
    return this.delegate.publicKey;
  }

  signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.delegate.signTransaction) {
      throw new UnsupportedOperationError(
        'Signing not supported',
        'Wallet does not support signing, please use wallet-adapter that supports signTransaction() operation.',
      );
    }
    return this.delegate.signTransaction(transaction);
  }

  signAllTransactions(transaction: Transaction[]): Promise<Transaction[]> {
    if (!this.delegate.signAllTransactions) {
      throw new UnsupportedOperationError(
        'Signing not supported',
        'Wallet does not support signing, please use wallet-adapter that supports signAllTransactions() operation.',
      );
    }
    return this.delegate.signAllTransactions(transaction);
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

  private canUseSolana() {
    return (
      !!this.publicKey &&
      !!this.delegate.signTransaction &&
      !!this.delegate.signAllTransactions
    );
  }

  private canUseDialectCloud() {
    return !!this.publicKey && !!this.delegate.signMessage;
  }

  get canEncrypt() {
    return !!this.publicKey && !!this.delegate.diffieHellman;
  }

  get supportedBackends(): Backend[] {
    return [
      ...(this.canUseSolana() ? [Backend.Solana] : []),
      ...(this.canUseDialectCloud() ? [Backend.DialectCloud] : []),
    ];
  }

  static create(adapter: DialectWalletAdapter): DialectWalletAdapterWrapper {
    return new DialectWalletAdapterWrapper(adapter);
  }
}
