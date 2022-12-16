import type { DialectEvmWalletAdapter } from './dialect-evm-wallet-adapter.interface';
import { UnsupportedOperationError } from '@dialectlabs/sdk';

export class DialectEvmWalletAdapterWrapper implements DialectEvmWalletAdapter {
  constructor(private readonly delegate: DialectEvmWalletAdapter) {}

  static create(
    adapter: DialectEvmWalletAdapter,
  ): DialectEvmWalletAdapterWrapper {
    return new DialectEvmWalletAdapterWrapper(adapter);
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

  sign(data: string | Uint8Array): Promise<string> {
    if (!this.delegate.sign) {
      throw new UnsupportedOperationError(
        'Signing not supported',
        'Wallet does not support signing, please use wallet-adapter that supports sign() operation.',
      );
    }
    return this.delegate.sign(data);
  }
}
