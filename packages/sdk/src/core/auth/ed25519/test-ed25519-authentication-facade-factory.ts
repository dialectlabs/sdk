import {
  AuthenticationFacade,
  AuthenticationFacadeFactory,
} from '../authentication-facade';
import { DefaultTokenGenerator } from './default-token-generator';
import { TokenParser } from '../token-parser';
import { Ed25519TokenBodyParser } from './ed25519-token-body-parser';
import { TestEd25519TokenValidator } from './test-ed25519-token-validator';
import type { TestEd25519TokenSigner } from './test-ed25519-token-signer';

export class TestEd25519AuthenticationFacadeFactory extends AuthenticationFacadeFactory {
  constructor(private readonly tokenSigner: TestEd25519TokenSigner) {
    super();
  }

  get(): AuthenticationFacade {
    const tokenBodyParser = new Ed25519TokenBodyParser();
    return new AuthenticationFacade(
      this.tokenSigner,
      new DefaultTokenGenerator(this.tokenSigner),
      new TokenParser(tokenBodyParser),
      new TestEd25519TokenValidator(),
    );
  }
}
