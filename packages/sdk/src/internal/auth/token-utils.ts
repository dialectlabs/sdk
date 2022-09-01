import type { Duration } from 'luxon';
import { TokenGenerator } from './token-generator';
import { TokenParser } from './token-parser';
import { TokenValidator } from './token-validator';
import type { AuthTokens, Token, TokenSigner } from '../../auth/auth.interface';

export class AuthTokensImpl implements AuthTokens {
  async generate(signer: TokenSigner, ttl: Duration): Promise<Token> {
    return TokenGenerator.new(signer).generate(ttl);
  }

  parse(rawToken: string): Token {
    return TokenParser.parse(rawToken);
  }

  isValid(token: Token): boolean {
    return TokenValidator.newValidator(token).isValid();
  }
}
