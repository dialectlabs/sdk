import type { TokenGenerator } from './token-generator';
import type { TokenValidator } from './token-validator';
import type { TokenParser } from './token-parser';
import type { Duration } from 'luxon';
import type { Token, TokenSigner } from './auth.interface';
import type { PublicKey } from './auth.interface';

export abstract class AuthenticationFacadeFactory {
  abstract get(): AuthenticationFacade;
}

export class AuthenticationFacade {
  constructor(
    readonly tokenSigner: TokenSigner,
    readonly tokenGenerator: TokenGenerator,
    readonly tokenParser: TokenParser,
    readonly tokenValidator: TokenValidator,
  ) {}

  type(): string {
    return this.tokenSigner.alg;
  }

  signerSubject(): PublicKey {
    return this.tokenSigner.subject;
  }

  generateToken(ttl: Duration) {
    return this.tokenGenerator.generate(ttl);
  }

  parseToken(token: string) {
    return this.tokenParser.parse(token);
  }

  isSignatureValid(token: Token) {
    return this.tokenValidator.isSignatureValid(token);
  }

  isValid(token: Token) {
    return this.tokenValidator.isValid(token);
  }
}
