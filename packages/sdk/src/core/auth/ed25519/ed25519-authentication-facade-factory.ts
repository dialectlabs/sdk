import {
  AuthenticationFacade,
  AuthenticationFacadeFactory,
} from '../authentication-facade';
import { Ed25519TokenGenerator } from './ed25519-token-generator';
import { TokenParser } from '../token-parser';
import { Ed25519TokenBodyParser } from './ed25519-token-body-parser';
import { Ed25519TokenValidator } from './ed25519-token-validator';
import type { Ed25519TokenSigner } from './ed25519-token-signer';

export class Ed25519AuthenticationFacadeFactory extends AuthenticationFacadeFactory {
  constructor(private readonly tokenSigner: Ed25519TokenSigner) {
    super();
  }

  get(): AuthenticationFacade {
    const tokenBodyParser = new Ed25519TokenBodyParser();
    return new AuthenticationFacade(
      this.tokenSigner,
      new Ed25519TokenGenerator(this.tokenSigner),
      new TokenParser(tokenBodyParser),
      new Ed25519TokenValidator(),
    );
  }
}
