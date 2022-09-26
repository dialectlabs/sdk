import {
  AuthenticationFacade,
  AuthenticationFacadeFactory,
  Authenticator,
  TokenParser,
} from '@dialectlabs/sdk';

import { AptosEd25519PayloadTokenValidator } from './aptos-ed25519-payload-token-validator';
import type { AptosEd25519PayloadTokenSigner } from './aptos-ed25519-payload-token-signer';
import { AptosEd25519PayloadTokenGenerator } from './aptos-ed25519-payload-token-generator';
import { AptosEd25519PayloadTokenBodyParser } from './aptos-ed25519-payload-token-body-parser';

export class AptosEd25519PayloadAuthenticationFacadeFactory extends AuthenticationFacadeFactory {
  constructor(private readonly tokenSigner: AptosEd25519PayloadTokenSigner) {
    super();
  }

  static createAuthenticator(): Authenticator {
    return new Authenticator(
      new TokenParser(new AptosEd25519PayloadTokenBodyParser()),
      new AptosEd25519PayloadTokenValidator(),
    );
  }

  get(): AuthenticationFacade {
    return new AuthenticationFacade(
      this.tokenSigner,
      new AptosEd25519PayloadTokenGenerator(this.tokenSigner),
      AptosEd25519PayloadAuthenticationFacadeFactory.createAuthenticator(),
    );
  }
}
