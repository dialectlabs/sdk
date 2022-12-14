import {
  DiffeHellmanKeys,
  EncryptionKeysProvider,
  UnsupportedOperationError,
} from '@dialectlabs/sdk';
import type { DialectEvmWalletAdapterWrapper } from '../wallet-adapter/dialect-evm-wallet-adapter-wrapper';

export class DialectEvmWalletAdapterEncryptionKeysProvider extends EncryptionKeysProvider {
  constructor(
    private readonly dialectWalletAdapter: DialectEvmWalletAdapterWrapper,
  ) {
    super();
  }

  async getFailSafe(): Promise<DiffeHellmanKeys | null> {
    return null;
  }

  getFailFast(): Promise<DiffeHellmanKeys> {
    throw new UnsupportedOperationError(
      'Encryption not supported',
      'Wallet does not support encryption yet',
    );
  }

  isAvailable(): boolean {
    return false;
  }
}
