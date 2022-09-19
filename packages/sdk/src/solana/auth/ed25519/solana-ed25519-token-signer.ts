import type { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import type {
  PublicKey,
  TokenSigner,
  TokenSignerResult,
} from '../../../core/auth/auth.interface';

export const SOLANA_ED25519_TOKEN_SIGNER_ALG = 'solana-ed25519';
export const SOLANA_ED25519_TOKEN_SIGNER_ALG_BACKWARD_COMPATIBLE = 'ed25519';

export abstract class SolanaEd25519TokenSigner implements TokenSigner {
  // TODO: change after data service is updated
  readonly alg = SOLANA_ED25519_TOKEN_SIGNER_ALG_BACKWARD_COMPATIBLE;

  abstract subject: PublicKey;
  abstract subjectPublicKey: PublicKey;

  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterEd25519TokenSigner extends SolanaEd25519TokenSigner {
  constructor(readonly dialectWalletAdapter: DialectWalletAdapterWrapper) {
    super();
  }

  get subject(): PublicKey {
    return this.dialectWalletAdapter.publicKey;
  }

  get subjectPublicKey(): PublicKey {
    return this.dialectWalletAdapter.publicKey;
  }

  async sign(payload: Uint8Array): Promise<TokenSignerResult> {
    return {
      payload,
      signature: await this.dialectWalletAdapter.signMessage(payload),
    };
  }
}
