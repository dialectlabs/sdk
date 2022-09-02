import type { PublicKey } from '@solana/web3.js';
import type { DialectWalletAdapterWrapper } from '../../../wallet-adapter/dialect-wallet-adapter-wrapper';
import { Ed25519TokenSigner } from '../../../core/auth/ed25519/ed25519-token-signer';
import type { TokenSignerResult } from '../../../core/auth/auth.interface';

export class DialectWalletAdapterEd25519TokenSigner extends Ed25519TokenSigner {
  readonly subject: PublicKey;

  constructor(readonly dialectWalletAdapter: DialectWalletAdapterWrapper) {
    super();
    this.subject = dialectWalletAdapter.publicKey;
  }

  async sign(payload: Uint8Array): Promise<TokenSignerResult> {
    return {
      payload,
      signature: await this.dialectWalletAdapter.signMessage(payload),
    };
  }
}
