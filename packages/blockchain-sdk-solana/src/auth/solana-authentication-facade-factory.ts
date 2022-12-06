import {
  AuthenticationFacadeFactory,
  Config,
  TokenHeaderParser,
  TokenValidator,
} from '@dialectlabs/sdk';
import type { DialectSolanaWalletAdapterWrapper } from '../wallet-adapter/dialect-solana-wallet-adapter-wrapper';
import { SolanaEd25519AuthenticationFacadeFactory } from './ed25519/solana-ed25519-authentication-facade-factory';
import { DialectWalletAdapterSolanaEd25519TokenSigner } from './ed25519/solana-ed25519-token-signer';
import { SolanaEd25519TokenValidator } from './ed25519/solana-ed25519-token-validator';
import { SolanaTxAuthenticationFacadeFactory } from './tx/solana-tx-authentication-facade-factory';
import { DialectWalletAdapterSolanaTxTokenSigner } from './tx/solana-tx-token-signer';
import { SolanaTxTokenValidator } from './tx/solana-tx-token-validator';

export class SolanaAuthenticationFacadeFactory {
  solanaEd25519TokenValidator: TokenValidator;

  solanaTxTokenValidator: TokenValidator;

  constructor(
    readonly config: Config,
    readonly wallet: DialectSolanaWalletAdapterWrapper,
  ) {
    this.solanaEd25519TokenValidator = new SolanaEd25519TokenValidator();
    this.solanaTxTokenValidator = new SolanaTxTokenValidator();
  }

  create(): AuthenticationFacadeFactory {
    const tokenHeader = this.getCachedTokenHeader();
    if (
      (tokenHeader &&
        this.solanaEd25519TokenValidator.canValidate(tokenHeader)) ||
      this.wallet.canSignMessage()
    ) {
      return new SolanaEd25519AuthenticationFacadeFactory(
        new DialectWalletAdapterSolanaEd25519TokenSigner(this.wallet),
      );
    } else if (
      tokenHeader &&
      this.solanaTxTokenValidator.canValidate(tokenHeader)
    ) {
      return new SolanaTxAuthenticationFacadeFactory(
        new DialectWalletAdapterSolanaTxTokenSigner(this.wallet),
      );
    }

    return new SolanaEd25519AuthenticationFacadeFactory(
      new DialectWalletAdapterSolanaEd25519TokenSigner(this.wallet),
    );
  }

  private getCachedTokenHeader() {
    const rawToken = this.config.dialectCloud.tokenStore.get(
      this.wallet.publicKey.toBase58(),
    );
    if (!rawToken) {
      return null;
    }
    try {
      const tokenHeaderParser = new TokenHeaderParser();
      const tokenHeader = tokenHeaderParser.parse(rawToken);
      return tokenHeader;
    } catch (e) {
      return null;
    }
  }
}
