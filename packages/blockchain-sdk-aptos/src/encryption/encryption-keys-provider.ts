import {
  DiffeHellmanKeys,
  EncryptionKeysProvider,
  UnsupportedOperationError,
} from '@dialectlabs/sdk';
import type { Result } from 'ts-results';
import type { DialectAptosWalletAdapterWrapper } from '../wallet-adapter/dialect-aptos-wallet-adapter-wrapper';

export class DialectAptosWalletAdapterEncryptionKeysProvider extends EncryptionKeysProvider {
  constructor(
    private readonly dialectWalletAdapter: DialectAptosWalletAdapterWrapper,
  ) {
    super();
  }

  async getFailSafe(): Promise<DiffeHellmanKeys | null> {
    return null;
  }

  getFailFast(): Promise<Result<DiffeHellmanKeys, UnsupportedOperationError>> {
    throw new UnsupportedOperationError(
      'Encryption not supported',
      'Wallet does not support encryption yet',
    );
  }

  isAvailable(): boolean {
    return false;
  }
}
