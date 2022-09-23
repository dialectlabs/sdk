import {
  AuthenticationFacade,
  AuthenticationFacadeFactory,
  Authenticator,
} from '../authentication-facade';
import { DefaultTokenGenerator } from '../default-token-generator';
import { TokenParser } from '../token-parser';
import { Ed25519TokenBodyParser } from './ed25519-token-body-parser';
import { Ed25519TokenValidator } from './ed25519-token-validator';
import type { Ed25519TokenSigner } from './ed25519-token-signer';

export class Ed25519AuthenticationFacadeFactory extends AuthenticationFacadeFactory {
  constructor(private readonly tokenSigner: Ed25519TokenSigner) {
    super();
  }

  get(): AuthenticationFacade {
    return new AuthenticationFacade(
      this.tokenSigner,
      new DefaultTokenGenerator(this.tokenSigner),
      Ed25519AuthenticationFacadeFactory.createAuthenticator(),
    );
  }

  static createAuthenticator(): Authenticator {
    return new Authenticator(
      new TokenParser(new Ed25519TokenBodyParser()),
      new Ed25519TokenValidator(),
    );
  }
}
