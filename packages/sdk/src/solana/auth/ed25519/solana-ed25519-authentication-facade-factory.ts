import {
  AuthenticationFacade,
  AuthenticationFacadeFactory,
} from '../../../core/auth/authentication-facade';
import { Ed25519TokenBodyParser } from '../../../core/auth/ed25519/ed25519-token-body-parser';
import { DefaultTokenGenerator } from '../../../core/auth/ed25519/default-token-generator';
import { TokenParser } from '../../../core/auth/token-parser';
import { SolanaEd25519TokenValidator } from './solana-ed25519-token-validator';
import type { SolanaEd25519TokenSigner } from './solana-ed25519-token-signer';

export class SolanaEd25519AuthenticationFacadeFactory extends AuthenticationFacadeFactory {
  constructor(private readonly tokenSigner: SolanaEd25519TokenSigner) {
    super();
  }

  get(): AuthenticationFacade {
    const tokenBodyParser = new Ed25519TokenBodyParser();
    return new AuthenticationFacade(
      this.tokenSigner,
      new DefaultTokenGenerator(this.tokenSigner),
      new TokenParser(tokenBodyParser),
      new SolanaEd25519TokenValidator(),
    );
  }
}
