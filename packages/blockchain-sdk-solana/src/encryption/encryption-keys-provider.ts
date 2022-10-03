import type { DiffeHellmanKeys } from '@dialectlabs/sdk';
import { EncryptionKeysProvider } from '@dialectlabs/sdk';
import type { DialectSolanaWalletAdapterWrapper } from '../wallet-adapter/dialect-solana-wallet-adapter-wrapper';

export class DialectSolanaWalletAdapterEncryptionKeysProvider extends EncryptionKeysProvider {
  constructor(
    private readonly dialectWalletAdapter: DialectSolanaWalletAdapterWrapper,
  ) {
    super();
  }

  isAvailable(): boolean {
    return this.dialectWalletAdapter.canEncrypt;
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
