import {
  AuthenticationFacade,
  AuthenticationFacadeFactory,
} from '../../../core/auth/authentication-facade';
import { Ed25519TokenBodyParser } from '../../../core/auth/ed25519/ed25519-token-body-parser';
import type { Ed25519TokenSigner } from '../../../core/auth/ed25519/ed25519-token-signer';
import { Ed25519TokenGenerator } from '../../../core/auth/ed25519/ed25519-token-generator';
import { TokenParser } from '../../../core/auth/token-parser';
import { SolanaEd25519TokenValidator } from './solana-ed25519-token-validator';

export class SolanaEd25519AuthenticationFacadeFactory extends AuthenticationFacadeFactory {
  constructor(private readonly tokenSigner: Ed25519TokenSigner) {
    super();
  }

  get(): AuthenticationFacade {
    const tokenBodyParser = new Ed25519TokenBodyParser();
    return new AuthenticationFacade(
      this.tokenSigner,
      new Ed25519TokenGenerator(this.tokenSigner),
      new TokenParser(tokenBodyParser),
      new SolanaEd25519TokenValidator(),
    );
  }
}
