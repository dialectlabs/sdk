import type { PublicKey as SolanaPublicKey } from '@solana/web3.js';
import type { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { Ed25519TokenSigner } from '../../../core/auth/ed25519/ed25519-token-signer';
import type { TokenSignerResult } from '../../../core/auth/auth.interface';
import type { PublicKey } from '../../../core/auth/auth.interface';

export class DialectWalletAdapterEd25519TokenSigner extends Ed25519TokenSigner {
  constructor(readonly dialectWalletAdapter: DialectWalletAdapterWrapper) {
    super();
  }

  async sign(payload: Uint8Array): Promise<TokenSignerResult> {
    return {
      payload,
      signature: await this.dialectWalletAdapter.signMessage(payload),
    };
  }

  get subject(): PublicKey {
    return this.dialectWalletAdapter.publicKey;
  }

  get subjectPublicKey(): PublicKey {
    return this.dialectWalletAdapter.publicKey;
  }
}
