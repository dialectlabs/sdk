import type { DialectPolygonWalletAdapter } from './dialect-polygon-wallet-adapter.interface';
import { UnsupportedOperationError } from '@dialectlabs/sdk';
import type {
  TransactionConfig,
  SignedTransaction,
  Sign,
  EncryptedKeystoreV3Json,
} from 'web3-core';

export class DialectPolygonWalletAdapterWrapper
  implements DialectPolygonWalletAdapter {
  constructor(private readonly delegate: DialectPolygonWalletAdapter) { }

  static create(
    adapter: DialectPolygonWalletAdapter,
  ): DialectPolygonWalletAdapterWrapper {
    return new DialectPolygonWalletAdapterWrapper(adapter);
  }

  get address(): string {
    if (!this.delegate.address) {
      throw new UnsupportedOperationError(
        'Address not available',
        'Wallet does not have address, please provide a valid adress.',
      );
    }

    return this.delegate.address;
  }

  canSignMessage(): boolean {
    return Boolean(this.delegate.sign);
  }

  canSignTransaction(): boolean {
    return Boolean(this.delegate.signTransaction);
  }

  signTransaction(
    transactionConfig: TransactionConfig,
    callback?: (signTransaction: SignedTransaction) => void,
  ): Promise<SignedTransaction> {
    if (!this.delegate.signTransaction) {
      throw new UnsupportedOperationError(
        'Signing not supported',
        'Wallet does not support signing, please use wallet-adapter that supports signTransaction() operation.',
      );
    }
    return this.delegate.signTransaction(transactionConfig, callback);
  }

  sign(data: string): Sign {
    if (!this.delegate.sign) {
      throw new UnsupportedOperationError(
        'Signing not supported',
        'Wallet does not support signing, please use wallet-adapter that supports sign() operation.',
      );
    }
    return this.delegate.sign(data);
  }

  encrypt(password: string): EncryptedKeystoreV3Json {
    if (!this.delegate.encrypt) {
      throw new UnsupportedOperationError(
        'Encryption not supported',
        'Wallet does not support encryption, please use wallet-adapter that supports encrypt() operation.',
      );
    }
    return this.delegate.encrypt(password);
  }
}
