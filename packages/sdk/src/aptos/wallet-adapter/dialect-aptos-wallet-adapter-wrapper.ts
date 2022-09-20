import type { DialectAptosWalletAdapter } from './dialect-aptos-wallet-adapter.interface';
import { UnsupportedOperationError } from '../../core/sdk/errors';
import type { AccountKeys } from '@manahippo/aptos-wallet-adapter/src/WalletAdapters/BaseAdapter';

export class DialectAptosWalletAdapterWrapper
  implements DialectAptosWalletAdapter
{
  constructor(private readonly delegate: DialectAptosWalletAdapter) {}

  get publicAccount(): AccountKeys {
    if (!this.delegate.publicAccount) {
      throw new UnsupportedOperationError(
        'Public account not available',
        'Wallet does not have public account, please provide a valid public account.',
      );
    }
    return this.delegate.publicAccount;
  }

  static create(
    adapter: DialectAptosWalletAdapter,
  ): DialectAptosWalletAdapterWrapper {
    return new DialectAptosWalletAdapterWrapper(adapter);
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
}
