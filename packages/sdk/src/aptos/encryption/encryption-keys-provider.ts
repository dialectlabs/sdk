import type { DiffeHellmanKeys } from '../../core/encryption/encryption.interface';
import { EncryptionKeysProvider } from '../../core/internal/encryption/encryption-keys-provider';
import type { DialectAptosWalletAdapterWrapper } from '../wallet-adapter/dialect-aptos-wallet-adapter-wrapper';
import { UnsupportedOperationError } from '../../core/sdk/errors';

export class DialectAptosWalletAdapterEncryptionKeysProvider extends EncryptionKeysProvider {
  constructor(
    private readonly dialectWalletAdapter: DialectAptosWalletAdapterWrapper,
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
}
