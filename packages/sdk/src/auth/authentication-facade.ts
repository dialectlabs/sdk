import type { TokenGenerator } from './token-generator';
import type { TokenValidator } from './token-validator';
import type { TokenParser } from './token-parser';
import type { Duration } from 'luxon';
import type {
  AccountAddress,
  Token,
  TokenHeader,
  TokenSigner,
} from './auth.interface';

export class Authenticator {
  constructor(
    readonly parser: TokenParser,
    readonly validator: TokenValidator,
  ) {}

  authenticate(token: string): Token | null {
    const header = this.parser.parseHeader(token);
    if (!this.validator.canValidate(header)) {
      return null;
    }
    const parsedToken = this.parser.parse(token);
    const isValid = this.validator.isValid(parsedToken);
    if (!isValid) {
      return null;
    }
    return parsedToken;
  }
}

export abstract class AuthenticationFacadeFactory {
  abstract get(): AuthenticationFacade;
}

export class AuthenticationFacade {
  constructor(
    readonly tokenSigner: TokenSigner,
    readonly tokenGenerator: TokenGenerator,
    readonly authenticator: Authenticator,
  ) {}

  type(): string {
    return this.tokenSigner.alg;
  }

  subject(): AccountAddress {
    return this.tokenSigner.subject;
  }

  generateToken(ttl: Duration) {
    return this.tokenGenerator.generate(ttl);
  }

  parseToken(token: string) {
    return this.authenticator.parser.parse(token);
  }

  canValidate(tokenHeader: TokenHeader) {
    return this.authenticator.validator.canValidate(tokenHeader);
  }

  isValid(token: Token) {
    return this.authenticator.validator.isValid(token);
  }
}
