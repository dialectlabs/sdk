import { DiffeHellmanKeys, UnsupportedOperationError } from '@dialectlabs/sdk';
import { EncryptionKeysProvider } from '@dialectlabs/sdk';
import { Err, Ok, Result } from 'ts-results';
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

  getFailFast(): Promise<Result<DiffeHellmanKeys, UnsupportedOperationError>> {
    const diffieHellman = this.dialectWalletAdapter.diffieHellman();
    return this.dialectWalletAdapter.diffieHellman().then((it) =>
      it ? Ok(it) : Err(new UnsupportedOperationError('DialectSolanaWalletAdapterEncryptionKeysProvider', 'getFailFast failed')),
    );
  }
}
