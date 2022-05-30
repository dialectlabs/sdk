import type { DialectWalletAdapter } from '../dialect-wallet-adapter';
import { UnsupportedOperationError } from '../errors';
import type { Transaction } from '@solana/web3.js';

export class DialectWalletAdapterDecorator implements DialectWalletAdapter {
  constructor(private readonly delegate: DialectWalletAdapter) {}

  get publicKey() {
    return this.delegate.publicKey;
  }

  signTransaction(transaction: Transaction): Promise<Transaction> {
    if (!this.delegate.signTransaction) {
      throw new UnsupportedOperationError(
        'Signing not supported',
        'Wallet does not support signing, please use wallet that has supports signTransaction() operation.',
      );
    }
    return this.delegate.signTransaction(transaction);
  }

  signAllTransactions(transaction: Transaction[]): Promise<Transaction[]> {
    if (!this.delegate.signAllTransactions) {
      throw new UnsupportedOperationError(
        'Signing not supported',
        'Wallet does not support signing, please use wallet that has supports signAllTransactions() operation.',
      );
    }
    return this.delegate.signAllTransactions(transaction);
  }

  signMessage(message: Uint8Array): Promise<Uint8Array> {
    if (!this.delegate.signMessage) {
      throw new UnsupportedOperationError(
        'Message signing not supported',
        'Wallet does not support message signing, please use wallet that has supports signMessage() operation.',
      );
    }
    return this.delegate.signMessage(message);
  }

  diffieHellman(): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
    if (!this.delegate.diffieHellman) {
      throw new UnsupportedOperationError(
        'Encryption not supported',
        'Wallet does not support encryption, please use wallet that has supports diffieHellman() operation.',
      );
    }
    return this.delegate.diffieHellman(this.publicKey.toBytes());
  }

  canSignTransactions() {
    return (
      !!this.delegate.signTransaction && !!this.delegate.signAllTransactions
    );
  }

  canSign() {
    return !!this.delegate.signMessage;
  }

  canEncrypt() {
    return !!this.delegate.diffieHellman;
  }

  static create(adapter: DialectWalletAdapter): DialectWalletAdapter {
    // TODO: here we can put adapter lookup logic
    return new DialectWalletAdapterDecorator(adapter);
  }
}
