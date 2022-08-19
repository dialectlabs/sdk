import type { DialectWalletAdapterWrapper } from '../../wallet-adapter/dialect-wallet-adapter-wrapper';
import type { TokenSigner, TokenSignerResult } from '../auth.interface';
import type { WalletAddress } from '../../internal/wallet/wallet-address';

export abstract class Ed25519TokenSigner implements TokenSigner {
  readonly alg = 'ed25519';

  abstract subject: WalletAddress;
  abstract sign(payload: Uint8Array): Promise<TokenSignerResult>;
}

export class DialectWalletAdapterEd25519TokenSigner extends Ed25519TokenSigner {
  readonly subject: WalletAddress;

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
