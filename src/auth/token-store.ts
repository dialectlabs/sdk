import type { Token } from '@auth/auth.interface';
import type { PublicKey } from '@solana/web3.js';

export abstract class TokenStore {
  abstract get(subject: PublicKey): Token | null;

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

class InMemoryTokenStore extends TokenStore {
  private tokens: Map<string, Token> = new Map<string, Token>();

  get(subject: PublicKey): Token | null {
    return this.tokens.get(subject.toBase58()) ?? null;
  }

  save(token: Token): Token {
    this.tokens.set(token.body.sub, token);
    return token;
  }
}

class SessionStorageTokenStore implements TokenStore {
  get(subject: PublicKey): Token | null {
    const token = sessionStorage.getItem(createStorageKey(subject.toBase58()));
    if (!token) {
      return null;
    }
    return JSON.parse(token) as Token;
  }

  save(token: Token): Token {
    sessionStorage.setItem(
      createStorageKey(token.body.sub),
      JSON.stringify(token),
    );
    return token;
  }
}

class LocalStorageTokenStore implements TokenStore {
  get(subject: PublicKey): Token | null {
    const token = localStorage.getItem(createStorageKey(subject.toBase58()));
    if (!token) {
      return null;
    }
    return JSON.parse(token) as Token;
  }

  save(token: Token): Token {
    localStorage.setItem(
      createStorageKey(token.body.sub),
      JSON.stringify(token),
    );
    return token;
  }
}

const storageTokenKeyPrefix = 'dialect-auth-token-';

function createStorageKey(subject: string) {
  return `${storageTokenKeyPrefix}-${subject}`;
}
