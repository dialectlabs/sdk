import type { DialectAptosWalletAdapter } from './dialect-aptos-wallet-adapter.interface';
import { UnsupportedOperationError } from '../../core/sdk/errors';
import type { Address, PublicKey } from '@manahippo/aptos-wallet-adapter';

export class DialectAptosWalletAdapterWrapper
  implements DialectAptosWalletAdapter
{
  constructor(private readonly delegate: DialectAptosWalletAdapter) {}

  get publicKey(): PublicKey {
    if (!this.delegate.publicKey) {
      throw new UnsupportedOperationError(
        'Account public key not available',
        'Wallet does not have account public key, please provide a valid account public key.',
      );
    }
    return this.delegate.publicKey;
  }

  get address(): Address {
    if (!this.delegate.address) {
      throw new UnsupportedOperationError(
        'Account address not available',
        'Wallet does not have account address, please provide a valid account address.',
      );
    }
    return this.delegate.address;
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
