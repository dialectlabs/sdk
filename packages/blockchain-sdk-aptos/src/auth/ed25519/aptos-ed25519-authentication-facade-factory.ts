import {
  AuthenticationFacade,
  AuthenticationFacadeFactory,
  Authenticator,
  DefaultTokenGenerator,
  Ed25519TokenBodyParser,
  TokenParser,
} from '@dialectlabs/sdk';

import { AptosEd25519TokenValidator } from './aptos-ed25519-token-validator';
import type { AptosEd25519TokenSigner } from './aptos-ed25519-token-signer';

export class AptosEd25519AuthenticationFacadeFactory extends AuthenticationFacadeFactory {
  constructor(private readonly tokenSigner: AptosEd25519TokenSigner) {
    super();
  }

  static createAuthenticator(): Authenticator {
    return new Authenticator(
      new TokenParser(new Ed25519TokenBodyParser()),
      new AptosEd25519TokenValidator(),
    );
  }

  get(): AuthenticationFacade {
    return new AuthenticationFacade(
      this.tokenSigner,
      new DefaultTokenGenerator(this.tokenSigner),
      AptosEd25519AuthenticationFacadeFactory.createAuthenticator(),
    );
  }
}
