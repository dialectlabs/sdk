import {
  AuthenticationFacade,
  AuthenticationFacadeFactory,
  Authenticator,
  DefaultTokenGenerator,
  Ed25519TokenBodyParser,
  TokenParser,
} from '@dialectlabs/sdk';

import { PolygonEd25519TokenValidator } from './polygon-ed25519-token-validator';
import type { PolygonEd25519TokenSigner } from './polygon-ed25519-token-signer';

export class PolygonEd25519AuthenticationFacadeFactory extends AuthenticationFacadeFactory {
  constructor(private readonly tokenSigner: PolygonEd25519TokenSigner) {
    super();
  }

  static createAuthenticator(): Authenticator {
    return new Authenticator(
      new TokenParser(new Ed25519TokenBodyParser()),
      new PolygonEd25519TokenValidator(),
    );
  }

  get(): AuthenticationFacade {
    return new AuthenticationFacade(
      this.tokenSigner,
      new DefaultTokenGenerator(this.tokenSigner),
      PolygonEd25519AuthenticationFacadeFactory.createAuthenticator(),
    );
  }
}
