import type { Token } from '@auth/auth.interface';

export abstract class TokenStore {
  abstract get(): Token | null;

  abstract save(token: Token): Token;

  static createInMemory(): TokenStore {
    return new InMemoryTokenStore();
  }

  static createSession(): TokenStore {
    return new SessionStorageTokenStore();
  }
}

export class InMemoryTokenStore extends TokenStore {
  private token: Token | null = null;

  get(): Token | null {
    return this.token;
  }

  save(token: Token): Token {
    this.token = token;
    return this.token;
  }
}

const sessionStorageTokenKey = 'dialect-auth-token';

export class SessionStorageTokenStore implements TokenStore {
  get(): Token | null {
    const token = sessionStorage.getItem(sessionStorageTokenKey);
    if (!token) {
      return null;
    }
    return JSON.parse(token) as Token;
  }

  save(token: Token): Token {
    sessionStorage.setItem(sessionStorageTokenKey, JSON.stringify(token));
    return token;
  }
}
