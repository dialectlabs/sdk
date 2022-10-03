import type { DialectSolanaWalletAdapterWrapper } from '../../wallet-adapter/dialect-solana-wallet-adapter-wrapper';
import type {
  AccountAddress,
  PublicKey,
  TokenSigner,
  TokenSignerResult,
} from '@dialectlabs/sdk';
import { DIALECT_BLOCKCHAIN_SDK_TYPE_SOLANA } from '../../sdk/constants';

export const SOLANA_ED25519_TOKEN_SIGNER_ALG = `${DIALECT_BLOCKCHAIN_SDK_TYPE_SOLANA}-ed25519`;
export const SOLANA_ED25519_TOKEN_SIGNER_ALG_BACKWARD_COMPATIBLE = 'ed25519';

export abstract class SolanaEd25519TokenSigner implements TokenSigner {
  readonly alg = SOLANA_ED25519_TOKEN_SIGNER_ALG;

  abstract subject: AccountAddress;
  abstract subjectPublicKey: PublicKey;

  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterSolanaEd25519TokenSigner extends SolanaEd25519TokenSigner {
  constructor(
    readonly dialectWalletAdapter: DialectSolanaWalletAdapterWrapper,
  ) {
    super();
  }

  get subject(): AccountAddress {
    return this.dialectWalletAdapter.publicKey.toBase58();
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
