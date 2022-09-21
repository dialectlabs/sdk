import type { DiffeHellmanKeys } from '../../core/encryption/encryption.interface';
import { EncryptionKeysProvider } from '../../core/internal/encryption/encryption-keys-provider';
import type { DialectSolanaWalletAdapterWrapper } from '../wallet-adapter/dialect-solana-wallet-adapter-wrapper';

export class DialectSolanaWalletAdapterEncryptionKeysProvider extends EncryptionKeysProvider {
  constructor(
    private readonly dialectWalletAdapter: DialectSolanaWalletAdapterWrapper,
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
