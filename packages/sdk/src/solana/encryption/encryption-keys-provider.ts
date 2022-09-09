import type { DiffeHellmanKeys } from '../../core/encryption/encryption.interface';
import { EncryptionKeysProvider } from '../../core/internal/encryption/encryption-keys-provider';
import type { DialectWalletAdapterWrapper } from '../wallet-adapter/dialect-wallet-adapter-wrapper';

export class DialectWalletAdapterEncryptionKeysProvider extends EncryptionKeysProvider {
  constructor(
    private readonly dialectWalletAdapter: DialectWalletAdapterWrapper,
  ) {
    super();
  }

  getFailSafe(): Promise<DiffeHellmanKeys | null> {
    return this.dialectWalletAdapter.canEncrypt
      ? this.dialectWalletAdapter.diffieHellman()
      : Promise.resolve(null);
  }

  getFailFast(): Promise<DiffeHellmanKeys> {
    return this.dialectWalletAdapter.diffieHellman();
  }
}
