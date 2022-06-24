import type { Token } from '@auth/auth.interface';

export abstract class TokenStore {
  abstract get(): Token | null;

  abstract save(token: Token): Token;

  static createInMemory(): TokenStore {
    return new InMemoryTokenStore();
  }

  static createSessionStorage(): TokenStore {
    return new SessionStorageTokenStore();
  }

  static createLocalStorage(): TokenStore {
    return new LocalStorageTokenStore();
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

const storageTokenKey = 'dialect-auth-token';

export class SessionStorageTokenStore implements TokenStore {
  get(): Token | null {
    const token = sessionStorage.getItem(storageTokenKey);
    if (!token) {
      return null;
    }
    return JSON.parse(token) as Token;
  }

  save(token: Token): Token {
    sessionStorage.setItem(storageTokenKey, JSON.stringify(token));
    return token;
  }
}

export class LocalStorageTokenStore implements TokenStore {
  get(): Token | null {
    const token = localStorage.getItem(storageTokenKey);
    if (!token) {
      return null;
    }
    return JSON.parse(token) as Token;
  }

  save(token: Token): Token {
    localStorage.setItem(storageTokenKey, JSON.stringify(token));
    return token;
  }
}
