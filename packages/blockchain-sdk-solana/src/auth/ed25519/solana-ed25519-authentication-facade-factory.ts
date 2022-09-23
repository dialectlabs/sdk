import {
  AuthenticationFacade,
  AuthenticationFacadeFactory,
  Authenticator,
  DefaultTokenGenerator,
  Ed25519TokenBodyParser,
  TokenParser,
} from '@dialectlabs/sdk';
import { SolanaEd25519TokenValidator } from './solana-ed25519-token-validator';
import type { SolanaEd25519TokenSigner } from './solana-ed25519-token-signer';

export class SolanaEd25519AuthenticationFacadeFactory extends AuthenticationFacadeFactory {
  constructor(private readonly tokenSigner: SolanaEd25519TokenSigner) {
    super();
  }

  static createAuthenticator(): Authenticator {
    return new Authenticator(
      new TokenParser(new Ed25519TokenBodyParser()),
      new SolanaEd25519TokenValidator(),
    );
  }

  get(): AuthenticationFacade {
    return new AuthenticationFacade(
      this.tokenSigner,
      new DefaultTokenGenerator(this.tokenSigner),
      SolanaEd25519AuthenticationFacadeFactory.createAuthenticator(),
    );
  }
}
