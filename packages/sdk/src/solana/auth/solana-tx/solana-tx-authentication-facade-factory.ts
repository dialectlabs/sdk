import {
  AuthenticationFacade,
  AuthenticationFacadeFactory,
  Authenticator,
} from '../../../core/auth/authentication-facade';
import { TokenParser } from '../../../core/auth/token-parser';
import { SolanaTxTokenBodyParser } from './solana-tx-token-body-parser';
import type { SolanaTxTokenSigner } from './solana-tx-token-signer';
import { SolanaTxTokenGenerator } from './solana-tx-token-generator';
import { SolanaTxTokenValidator } from './solana-tx-token-validator';

export class SolanaTxAuthenticationFacadeFactory extends AuthenticationFacadeFactory {
  constructor(private readonly tokenSigner: SolanaTxTokenSigner) {
    super();
  }

  get(): AuthenticationFacade {
    return new AuthenticationFacade(
      this.tokenSigner,
      new SolanaTxTokenGenerator(this.tokenSigner),
      SolanaTxAuthenticationFacadeFactory.createAuthenticator(),
    );
  }

  static createAuthenticator(): Authenticator {
    return new Authenticator(
      new TokenParser(new SolanaTxTokenBodyParser()),
      new SolanaTxTokenValidator(),
    );
  }
}
