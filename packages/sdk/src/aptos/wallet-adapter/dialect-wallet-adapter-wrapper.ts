import type { DialectWalletAdapter } from './dialect-wallet-adapter.interface';
import { UnsupportedOperationError } from '../../core/sdk/errors';
import type { AccountKeys } from '@manahippo/aptos-wallet-adapter/src/WalletAdapters/BaseAdapter';

export class DialectWalletAdapterWrapper implements DialectWalletAdapter {
  constructor(private readonly delegate: DialectWalletAdapter) {}

  get publicAccount(): AccountKeys {
    if (!this.delegate.publicAccount) {
      throw new UnsupportedOperationError(
        'Public account not available',
        'Wallet does not have public account, please provide a valid public account.',
      );
    }
    return this.delegate.publicAccount;
  }

  async signMessage(message: string): Promise<string> {
    if (!this.delegate.signMessage) {
      throw new UnsupportedOperationError(
        'Message signing not supported',
        'Wallet does not support message signing, please use wallet-adapter that supports signMessage() operation.',
      );
    }
    return this.delegate.signMessage(message);
  }

  static create(adapter: DialectWalletAdapter): DialectWalletAdapterWrapper {
    return new DialectWalletAdapterWrapper(adapter);
  }
}
