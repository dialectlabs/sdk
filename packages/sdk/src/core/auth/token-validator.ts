import type { Token } from './auth.interface';

export abstract class TokenValidator {
  isValid(token: Token) {
    if (!this.isSignatureValid(token)) {
      return false;
    }
    return !this.isExpired(token);
  }

  abstract isSignatureValid(token: Token): boolean;

  private isExpired(token: Token) {
    const nowUtcSeconds = new Date().getTime() / 1000;
    const delta = 10;
    return nowUtcSeconds + delta > token.body.exp;
  }
}
