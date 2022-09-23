import type { Token, TokenHeader } from './auth.interface';

export abstract class TokenValidator {
  isValid(token: Token) {
    if (!this.canValidate(token.header)) {
      return false;
    }
    if (!this.isSignatureValid(token)) {
      return false;
    }
    if (this.isExpired(token)) {
      return false;
    }
    return this.performExtraValidation(token);
  }

  abstract canValidate(tokenHeader: TokenHeader): boolean;

  abstract isSignatureValid(token: Token): boolean;

  protected performExtraValidation(token: Token): boolean {
    return true;
  }

  private isExpired(token: Token) {
    const nowUtcSeconds = new Date().getTime() / 1000;
    const delta = 30;
    return nowUtcSeconds + delta > token.body.exp;
  }
}
