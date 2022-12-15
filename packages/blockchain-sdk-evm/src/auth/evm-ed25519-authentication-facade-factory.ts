import {
  AuthenticationFacade,
  AuthenticationFacadeFactory,
  Authenticator,
  DefaultTokenGenerator,
  Ed25519TokenBodyParser,
  TokenParser,
} from '@dialectlabs/sdk';

import { EvmEd25519TokenValidator } from './evm-ed25519-token-validator';
import type { EvmEd25519TokenSigner } from './evm-ed25519-token-signer';

export class EvmEd25519AuthenticationFacadeFactory extends AuthenticationFacadeFactory {
  constructor(private readonly tokenSigner: EvmEd25519TokenSigner) {
    super();
  }

  static createAuthenticator(): Authenticator {
    return new Authenticator(
      new TokenParser(new Ed25519TokenBodyParser()),
      new EvmEd25519TokenValidator(),
    );
  }

  get(): AuthenticationFacade {
    return new AuthenticationFacade(
      this.tokenSigner,
      new DefaultTokenGenerator(this.tokenSigner),
      EvmEd25519AuthenticationFacadeFactory.createAuthenticator(),
    );
  }
}
